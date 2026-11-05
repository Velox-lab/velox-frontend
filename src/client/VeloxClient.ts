import * as StellarSdk from '@stellar/stellar-sdk';
import * as freighter from '@stellar/freighter-api';
import {
  Stream,
  Schedule,
  StreamStatus,
  ScheduleStatus,
  TxHash,
  CreateStreamParams,
  CreateScheduleParams,
  WalletState,
  Network,
} from '../types';

/** A typed error VeloxClient throws instead of letting a raw SDK or wallet error escape. */
export class VeloxClientError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'VeloxClientError';
  }
}

/** PaymentStream's get_stream_info, decoded: i128/u64 fields come back as bigint, the status enum as a one-element array. */
interface RawStreamInfo {
  sender: string;
  recipient: string;
  token: string;
  rate_per_second: bigint;
  start_time: bigint;
  end_time: bigint;
  total_funded: bigint;
  total_withdrawn: bigint;
  status: string[] | string;
}

/** RecurringPayment's get_schedule_info, decoded the same way. */
interface RawScheduleInfo {
  sender: string;
  recipient: string;
  token: string;
  amount: bigint;
  interval: bigint;
  next_payment_time: bigint;
  status: string[] | string;
}

/** VeloxRegistry's StreamEntry, decoded. */
interface RawStreamEntry {
  stream_id: string;
  sender: string;
  recipient: string;
  registered_at: bigint;
}

/**
 * VeloxClient — all communication with the Stellar network and Velox contracts.
 *
 * This is the only module that talks to the blockchain.
 * It returns typed domain objects — no raw SDK types are exposed to upper layers.
 * It throws typed errors — no raw SDK exceptions bubble up to components or hooks.
 */
/**
 * How many payments' worth of allowance to approve when creating a recurring
 * schedule. RecurringPayment pulls `amount` once per interval and never
 * re-approves itself, so approving only one payment's worth would make the
 * very next payment fail. 12 is a judgment call, not a contract requirement —
 * the sender can always approve more later.
 */
const SCHEDULE_APPROVAL_PAYMENT_COUNT = 12;

export class VeloxClient {
  private readonly registryContractId: string;
  private readonly factoryContractId: string;
  private readonly sorobanRpcUrl: string;
  private readonly network: Network;
  private readonly networkPassphrase: string;
  private readonly server: StellarSdk.rpc.Server;
  /**
   * A throwaway local keypair, used only as the `source` account on transactions
   * built purely for simulation (reads). Simulating a read never signs, submits,
   * or spends anything, so this account never needs to exist on-chain or hold funds.
   */
  private readonly simulationSourcePublicKey: string;

  constructor(
    registryContractId: string,
    factoryContractId: string,
    sorobanRpcUrl: string,
    network: Network = 'testnet'
  ) {
    this.registryContractId = registryContractId;
    this.factoryContractId = factoryContractId;
    this.sorobanRpcUrl = sorobanRpcUrl;
    this.network = network;
    this.networkPassphrase =
      network === 'mainnet' ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET;
    this.server = new StellarSdk.rpc.Server(this.sorobanRpcUrl);
    this.simulationSourcePublicKey = StellarSdk.Keypair.random().publicKey();
  }

  // ── Wallet ────────────────────────────────────────────────────────────────

  /**
   * Request wallet access via Freighter and return the connected wallet state.
   * Throws if Freighter is not installed, the user declines access, or the
   * wallet is set to a different network than this client was configured for.
   */
  async connectWallet(): Promise<WalletState> {
    const connected = await freighter.isConnected();
    if (connected.error || !connected.isConnected) {
      throw new VeloxClientError(
        'Freighter is not installed. Install it from https://www.freighter.app/ to connect.',
        'WALLET_NOT_INSTALLED'
      );
    }

    const access = await freighter.requestAccess();
    if (access.error) {
      throw new VeloxClientError(access.error.message, 'WALLET_ACCESS_DENIED');
    }

    const walletNetwork = await freighter.getNetwork();
    if (walletNetwork.error) {
      throw new VeloxClientError(walletNetwork.error.message, 'WALLET_NETWORK_UNKNOWN');
    }
    if (walletNetwork.networkPassphrase !== this.networkPassphrase) {
      throw new VeloxClientError(
        `Freighter is set to a different network. Switch it to ${this.network} and try again.`,
        'WALLET_NETWORK_MISMATCH'
      );
    }

    return { publicKey: access.address, network: this.network, isConnected: true };
  }

  // ── Streams ───────────────────────────────────────────────────────────────

  /** Fetch a stream's full state from the PaymentStream contract. */
  async getStream(streamId: string): Promise<Stream> {
    const info = await this.readContract<RawStreamInfo>(streamId, 'get_stream_info');
    return {
      streamId,
      sender: info.sender,
      recipient: info.recipient,
      token: info.token,
      ratePerSecond: info.rate_per_second,
      startTime: Number(info.start_time),
      endTime: Number(info.end_time),
      totalFunded: info.total_funded,
      totalWithdrawn: info.total_withdrawn,
      status: parseStreamStatus(info.status),
    };
  }

  /** Fetch how many tokens the recipient can withdraw from a stream right now. */
  async getClaimableBalance(streamId: string): Promise<bigint> {
    return this.readContract<bigint>(streamId, 'get_claimable_balance');
  }

  /** Deploy a new PaymentStream via StreamFactory and return the stream contract ID. */
  async createStream(senderPublicKey: string, params: CreateStreamParams): Promise<string> {
    const args = [
      new StellarSdk.Address(senderPublicKey).toScVal(),
      new StellarSdk.Address(params.recipient).toScVal(),
      new StellarSdk.Address(params.token).toScVal(),
      StellarSdk.nativeToScVal(params.ratePerSecond, { type: 'i128' }),
      StellarSdk.nativeToScVal(BigInt(params.startTime), { type: 'u64' }),
      StellarSdk.nativeToScVal(BigInt(params.endTime), { type: 'u64' }),
      StellarSdk.nativeToScVal(params.totalFunded, { type: 'i128' }),
    ];
    return this.invokeContractForAddress(
      this.factoryContractId,
      'create_stream',
      args,
      senderPublicKey
    );
  }

  /**
   * Call withdraw() on a PaymentStream contract. Returns the transaction hash.
   * signerPublicKey must be the stream's recipient — only they can withdraw;
   * the contract itself enforces this and rejects any other signer.
   */
  async withdrawFromStream(streamId: string, signerPublicKey: string): Promise<TxHash> {
    return this.invokeContract(streamId, 'withdraw', [], signerPublicKey);
  }

  /**
   * Call cancel() on a PaymentStream contract. Returns the transaction hash.
   * signerPublicKey must be the stream's sender — only they can cancel; the
   * contract itself enforces this and rejects any other signer.
   */
  async cancelStream(streamId: string, signerPublicKey: string): Promise<TxHash> {
    return this.invokeContract(streamId, 'cancel', [], signerPublicKey);
  }

  /**
   * Fetch all streams where the address is the sender or the recipient, from
   * VeloxRegistry. A stream that cannot be read (e.g. a stale or malformed
   * registry entry) is left out rather than failing the whole list.
   */
  async getStreamsByAddress(address: string): Promise<Stream[]> {
    const addressScVal = new StellarSdk.Address(address).toScVal();
    const [bySender, byRecipient] = await Promise.all([
      this.readContract<RawStreamEntry[]>(this.registryContractId, 'list_streams_by_sender', [
        addressScVal,
      ]),
      this.readContract<RawStreamEntry[]>(this.registryContractId, 'list_streams_by_recipient', [
        addressScVal,
      ]),
    ]);

    const streamIds = Array.from(
      new Set([...bySender, ...byRecipient].map((entry) => entry.stream_id))
    );

    const results = await Promise.allSettled(streamIds.map((id) => this.getStream(id)));
    return results
      .filter((r): r is PromiseFulfilledResult<Stream> => r.status === 'fulfilled')
      .map((r) => r.value);
  }

  // ── Recurring Payments ────────────────────────────────────────────────────

  /** Fetch a schedule's full state from the RecurringPayment contract. */
  async getSchedule(scheduleId: string): Promise<Schedule> {
    const info = await this.readContract<RawScheduleInfo>(scheduleId, 'get_schedule_info');
    return {
      scheduleId,
      sender: info.sender,
      recipient: info.recipient,
      token: info.token,
      amount: info.amount,
      intervalSeconds: Number(info.interval),
      nextPaymentTime: Number(info.next_payment_time),
      status: parseScheduleStatus(info.status),
    };
  }

  /**
   * Deploy a new RecurringPayment via StreamFactory, approve it to pull
   * payments from the sender's token balance, and return the schedule ID.
   */
  async createRecurringPayment(
    senderPublicKey: string,
    params: CreateScheduleParams
  ): Promise<string> {
    const args = [
      new StellarSdk.Address(senderPublicKey).toScVal(),
      new StellarSdk.Address(params.recipient).toScVal(),
      new StellarSdk.Address(params.token).toScVal(),
      StellarSdk.nativeToScVal(params.amount, { type: 'i128' }),
      StellarSdk.nativeToScVal(BigInt(params.intervalSeconds), { type: 'u64' }),
      StellarSdk.nativeToScVal(BigInt(params.firstPaymentTime), { type: 'u64' }),
    ];
    const scheduleId = await this.invokeContractForAddress(
      this.factoryContractId,
      'create_schedule',
      args,
      senderPublicKey
    );

    await this.approveScheduleAllowance(params.token, senderPublicKey, scheduleId, params.amount);

    return scheduleId;
  }

  /** Cancel a recurring payment schedule. Returns the transaction hash. */
  async cancelSchedule(scheduleId: string, senderPublicKey: string): Promise<TxHash> {
    return this.invokeContract(scheduleId, 'cancel', [], senderPublicKey);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Build, simulate, sign with Freighter, submit and wait for the result of a
   * contract call that changes state. Returns the transaction hash once the
   * network confirms it landed — callers that need a return value (e.g. a
   * factory's newly deployed contract ID) must decode it separately; this
   * helper is for calls where only success/failure and the hash matter.
   */
  private async invokeContract(
    contractId: string,
    method: string,
    args: StellarSdk.xdr.ScVal[],
    signerPublicKey: string
  ): Promise<TxHash> {
    const source = new StellarSdk.Account(signerPublicKey, '0');
    const tx = new StellarSdk.TransactionBuilder(source, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(new StellarSdk.Contract(contractId).call(method, ...args))
      .setTimeout(30)
      .build();

    let prepared: StellarSdk.Transaction;
    try {
      prepared = await this.server.prepareTransaction(tx);
    } catch (err) {
      throw new VeloxClientError(
        `failed to prepare ${method} on ${contractId}: ${errorMessage(err)}`,
        'SIMULATION_FAILED'
      );
    }

    const signed = await freighter.signTransaction(prepared.toXDR(), {
      networkPassphrase: this.networkPassphrase,
      address: signerPublicKey,
    });
    if (signed.error) {
      throw new VeloxClientError(signed.error.message, 'USER_REJECTED');
    }

    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signed.signedTxXdr,
      this.networkPassphrase
    ) as StellarSdk.Transaction;

    const sendResult = await this.server.sendTransaction(signedTx);
    if (sendResult.status !== 'PENDING' && sendResult.status !== 'DUPLICATE') {
      throw new VeloxClientError(
        `failed to submit ${method} on ${contractId}: ${sendResult.status}`,
        'SUBMISSION_FAILED'
      );
    }

    const finalResult = await this.server.pollTransaction(sendResult.hash);
    if (finalResult.status !== StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      throw new VeloxClientError(
        `${method} on ${contractId} failed on-chain (tx ${sendResult.hash})`,
        'TRANSACTION_FAILED'
      );
    }

    return sendResult.hash;
  }

  /**
   * Like invokeContract, but for a call whose return value matters — namely
   * StreamFactory.create_stream/create_schedule, which return the newly
   * deployed contract's address. Simulation predicts that address; nothing
   * else can submit a conflicting deployment between simulating and signing
   * in this single-user flow, so the prediction is what actually lands.
   */
  private async invokeContractForAddress(
    contractId: string,
    method: string,
    args: StellarSdk.xdr.ScVal[],
    signerPublicKey: string
  ): Promise<string> {
    const source = new StellarSdk.Account(signerPublicKey, '0');
    const tx = new StellarSdk.TransactionBuilder(source, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(new StellarSdk.Contract(contractId).call(method, ...args))
      .setTimeout(30)
      .build();

    const sim = await this.server.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(sim)) {
      throw new VeloxClientError(
        `failed to simulate ${method} on ${contractId}: ${sim.error}`,
        'SIMULATION_FAILED'
      );
    }
    const retval = sim.result?.retval;
    if (!retval) {
      throw new VeloxClientError(
        `${method} on ${contractId} returned no value`,
        'SIMULATION_FAILED'
      );
    }
    const deployedAddress = StellarSdk.scValToNative(retval) as string;

    const prepared = StellarSdk.rpc.assembleTransaction(tx, sim).build();

    const signed = await freighter.signTransaction(prepared.toXDR(), {
      networkPassphrase: this.networkPassphrase,
      address: signerPublicKey,
    });
    if (signed.error) {
      throw new VeloxClientError(signed.error.message, 'USER_REJECTED');
    }

    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signed.signedTxXdr,
      this.networkPassphrase
    ) as StellarSdk.Transaction;

    const sendResult = await this.server.sendTransaction(signedTx);
    if (sendResult.status !== 'PENDING' && sendResult.status !== 'DUPLICATE') {
      throw new VeloxClientError(
        `failed to submit ${method} on ${contractId}: ${sendResult.status}`,
        'SUBMISSION_FAILED'
      );
    }

    const finalResult = await this.server.pollTransaction(sendResult.hash);
    if (finalResult.status !== StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      throw new VeloxClientError(
        `${method} on ${contractId} failed on-chain (tx ${sendResult.hash})`,
        'TRANSACTION_FAILED'
      );
    }

    return deployedAddress;
  }

  /**
   * Approve a newly created RecurringPayment schedule to pull up to
   * SCHEDULE_APPROVAL_PAYMENT_COUNT payments from the sender's token balance.
   */
  private async approveScheduleAllowance(
    token: string,
    senderPublicKey: string,
    scheduleId: string,
    amountPerPayment: bigint
  ): Promise<void> {
    const latestLedger = await this.server.getLatestLedger();
    const expirationLedger = latestLedger.sequence + 100_000;
    const approvedAmount = amountPerPayment * BigInt(SCHEDULE_APPROVAL_PAYMENT_COUNT);

    const args = [
      new StellarSdk.Address(senderPublicKey).toScVal(),
      new StellarSdk.Address(scheduleId).toScVal(),
      StellarSdk.nativeToScVal(approvedAmount, { type: 'i128' }),
      StellarSdk.nativeToScVal(expirationLedger, { type: 'u32' }),
    ];
    await this.invokeContract(token, 'approve', args, senderPublicKey);
  }

  /**
   * Simulate a read-only contract call and decode its return value.
   * Never signs or submits anything — simulation alone cannot change state or
   * cost fees, so no real account or wallet is needed.
   */
  private async readContract<T>(
    contractId: string,
    method: string,
    args: StellarSdk.xdr.ScVal[] = []
  ): Promise<T> {
    const source = new StellarSdk.Account(this.simulationSourcePublicKey, '0');
    const tx = new StellarSdk.TransactionBuilder(source, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(new StellarSdk.Contract(contractId).call(method, ...args))
      .setTimeout(30)
      .build();

    const sim = await this.server.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(sim)) {
      throw new VeloxClientError(
        `failed to read ${method} on ${contractId}: ${sim.error}`,
        'SIMULATION_FAILED'
      );
    }

    const retval = sim.result?.retval;
    if (!retval) {
      throw new VeloxClientError(
        `${method} on ${contractId} returned no value`,
        'SIMULATION_FAILED'
      );
    }
    return StellarSdk.scValToNative(retval) as T;
  }
}

/** Contract status enums decode as a single-element array, e.g. ['Active']. */
function parseStreamStatus(raw: string[] | string): StreamStatus {
  const name = (Array.isArray(raw) ? raw[0] : raw).toLowerCase();
  if (name === 'active' || name === 'cancelled' || name === 'completed') {
    return name;
  }
  throw new VeloxClientError(`unknown stream status: ${name}`, 'UNKNOWN_STATUS');
}

function parseScheduleStatus(raw: string[] | string): ScheduleStatus {
  const name = (Array.isArray(raw) ? raw[0] : raw).toLowerCase();
  if (name === 'active' || name === 'cancelled' || name === 'completed') {
    return name;
  }
  throw new VeloxClientError(`unknown schedule status: ${name}`, 'UNKNOWN_STATUS');
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
