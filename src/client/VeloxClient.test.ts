import * as StellarSdk from '@stellar/stellar-sdk';
import * as freighter from '@stellar/freighter-api';
import { VeloxClient, VeloxClientError } from './VeloxClient';

jest.mock('@stellar/freighter-api');
const mockedFreighter = jest.mocked(freighter);

const REGISTRY_ID = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 1));
const FACTORY_ID = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 9));
const STREAM_ID = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 2));
const SCHEDULE_ID = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 3));
const TOKEN_ID = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 4));
const SENDER = StellarSdk.Keypair.random().publicKey();
const RECIPIENT = StellarSdk.Keypair.random().publicKey();

const u64 = (n: number) => StellarSdk.nativeToScVal(BigInt(n), { type: 'u64' });
const i128 = (n: bigint) => StellarSdk.nativeToScVal(n, { type: 'i128' });
const statusVal = (name: string) =>
  StellarSdk.nativeToScVal([StellarSdk.nativeToScVal(name, { type: 'symbol' })]);
const addr = (a: string) => StellarSdk.Address.fromString(a);

function simulateSuccess(retval: StellarSdk.xdr.ScVal) {
  return {
    id: '1',
    latestLedger: 1,
    result: { auth: [], retval },
  } as unknown as StellarSdk.rpc.Api.SimulateTransactionResponse;
}

function simulateError(error: string) {
  return {
    id: '1',
    latestLedger: 1,
    error,
    events: [],
  } as unknown as StellarSdk.rpc.Api.SimulateTransactionResponse;
}

function mockSimulation(...responses: StellarSdk.rpc.Api.SimulateTransactionResponse[]) {
  const spy = jest.spyOn(StellarSdk.rpc.Server.prototype, 'simulateTransaction');
  responses.forEach((r) => spy.mockResolvedValueOnce(r));
  return spy;
}

function makeClient() {
  return new VeloxClient(REGISTRY_ID, FACTORY_ID, 'https://soroban-testnet.stellar.org', 'testnet');
}

describe('VeloxClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('connectWallet', () => {
    it('returns the connected wallet state on success', async () => {
      mockedFreighter.isConnected.mockResolvedValue({ isConnected: true });
      mockedFreighter.requestAccess.mockResolvedValue({ address: SENDER });
      mockedFreighter.getNetwork.mockResolvedValue({
        network: 'TESTNET',
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      const wallet = await makeClient().connectWallet();

      expect(wallet).toEqual({ publicKey: SENDER, network: 'testnet', isConnected: true });
    });

    it('throws when Freighter is not installed', async () => {
      mockedFreighter.isConnected.mockResolvedValue({ isConnected: false });

      await expect(makeClient().connectWallet()).rejects.toMatchObject({
        code: 'WALLET_NOT_INSTALLED',
      });
    });

    it('throws when the user declines access', async () => {
      mockedFreighter.isConnected.mockResolvedValue({ isConnected: true });
      mockedFreighter.requestAccess.mockResolvedValue({
        address: '',
        error: { code: -4, message: 'User declined access' },
      });

      expect.assertions(2);
      try {
        await makeClient().connectWallet();
      } catch (err) {
        expect(err).toBeInstanceOf(VeloxClientError);
        expect(err).toMatchObject({
          code: 'WALLET_ACCESS_DENIED',
          message: 'User declined access',
        });
      }
    });

    it('throws when the wallet is on a different network', async () => {
      mockedFreighter.isConnected.mockResolvedValue({ isConnected: true });
      mockedFreighter.requestAccess.mockResolvedValue({ address: SENDER });
      mockedFreighter.getNetwork.mockResolvedValue({
        network: 'PUBLIC',
        networkPassphrase: StellarSdk.Networks.PUBLIC,
      });

      await expect(makeClient().connectWallet()).rejects.toMatchObject({
        code: 'WALLET_NETWORK_MISMATCH',
      });
    });
  });

  describe('getStream', () => {
    it('returns the decoded stream state', async () => {
      const retval = StellarSdk.nativeToScVal({
        sender: addr(SENDER),
        recipient: addr(RECIPIENT),
        token: addr(TOKEN_ID),
        rate_per_second: i128(10n),
        start_time: u64(1000),
        end_time: u64(1100),
        total_funded: i128(1000n),
        total_withdrawn: i128(250n),
        status: statusVal('Active'),
      });
      mockSimulation(simulateSuccess(retval));

      const stream = await makeClient().getStream(STREAM_ID);

      expect(stream).toEqual({
        streamId: STREAM_ID,
        sender: SENDER,
        recipient: RECIPIENT,
        token: TOKEN_ID,
        ratePerSecond: 10n,
        startTime: 1000,
        endTime: 1100,
        totalFunded: 1000n,
        totalWithdrawn: 250n,
        status: 'active',
      });
    });

    it('throws a VeloxClientError when simulation fails', async () => {
      mockSimulation(simulateError('contract not found'));

      expect.assertions(3);
      try {
        await makeClient().getStream(STREAM_ID);
      } catch (err) {
        expect(err).toBeInstanceOf(VeloxClientError);
        expect((err as VeloxClientError).code).toBe('SIMULATION_FAILED');
        expect((err as VeloxClientError).message).toContain('contract not found');
      }
    });
  });

  describe('getClaimableBalance', () => {
    it('returns the decoded balance', async () => {
      mockSimulation(simulateSuccess(i128(500n)));
      expect(await makeClient().getClaimableBalance(STREAM_ID)).toBe(500n);
    });
  });

  describe('getSchedule', () => {
    it('returns the decoded schedule state', async () => {
      const retval = StellarSdk.nativeToScVal({
        sender: addr(SENDER),
        recipient: addr(RECIPIENT),
        token: addr(TOKEN_ID),
        amount: i128(100n),
        interval: u64(604_800),
        next_payment_time: u64(1_604_800),
        status: statusVal('Cancelled'),
      });
      mockSimulation(simulateSuccess(retval));

      const schedule = await makeClient().getSchedule(SCHEDULE_ID);

      expect(schedule).toEqual({
        scheduleId: SCHEDULE_ID,
        sender: SENDER,
        recipient: RECIPIENT,
        token: TOKEN_ID,
        amount: 100n,
        intervalSeconds: 604_800,
        nextPaymentTime: 1_604_800,
        status: 'cancelled',
      });
    });
  });

  describe('getStreamsByAddress', () => {
    const STREAM_A = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 10));
    const STREAM_B = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 11));

    function registryEntries(...streamIds: string[]) {
      return StellarSdk.nativeToScVal(
        streamIds.map((id) =>
          StellarSdk.nativeToScVal({
            stream_id: addr(id),
            sender: addr(SENDER),
            recipient: addr(RECIPIENT),
            registered_at: u64(1000),
          })
        )
      );
    }

    /** The same canned PaymentStream.get_stream_info response for any stream ID. */
    function streamInfo() {
      return simulateSuccess(
        StellarSdk.nativeToScVal({
          sender: addr(SENDER),
          recipient: addr(RECIPIENT),
          token: addr(TOKEN_ID),
          rate_per_second: i128(10n),
          start_time: u64(1000),
          end_time: u64(1100),
          total_funded: i128(1000n),
          total_withdrawn: i128(0n),
          status: statusVal('Active'),
        })
      );
    }

    it('merges and de-duplicates streams by sender and recipient, then fetches each', async () => {
      mockSimulation(
        simulateSuccess(registryEntries(STREAM_A, STREAM_B)), // list_streams_by_sender
        simulateSuccess(registryEntries(STREAM_A)), // list_streams_by_recipient (overlaps A)
        streamInfo(),
        streamInfo()
      );

      const streams = await makeClient().getStreamsByAddress(SENDER);

      expect(streams.map((s) => s.streamId).sort()).toEqual([STREAM_A, STREAM_B].sort());
    });

    it('leaves out a stream that fails to load instead of failing the whole list', async () => {
      mockSimulation(
        simulateSuccess(registryEntries(STREAM_A, STREAM_B)),
        simulateSuccess(registryEntries()),
        simulateError('stale entry'),
        streamInfo()
      );

      const streams = await makeClient().getStreamsByAddress(SENDER);

      expect(streams.map((s) => s.streamId)).toEqual([STREAM_B]);
    });

    it('returns an empty list when the address has no streams', async () => {
      mockSimulation(simulateSuccess(registryEntries()), simulateSuccess(registryEntries()));
      expect(await makeClient().getStreamsByAddress(SENDER)).toEqual([]);
    });
  });

  // ── Write methods: withdraw / cancel ────────────────────────────────────

  function mockPrepare() {
    return jest
      .spyOn(StellarSdk.rpc.Server.prototype, 'prepareTransaction')
      .mockImplementation(async (built: StellarSdk.Transaction | StellarSdk.FeeBumpTransaction) => {
        jest.spyOn(built, 'toXDR').mockReturnValue('prepared-xdr');
        return built as StellarSdk.Transaction;
      });
  }

  function mockSend(status: 'PENDING' | 'DUPLICATE' | 'TRY_AGAIN_LATER' | 'ERROR', hash = 'tx_hash') {
    return jest.spyOn(StellarSdk.rpc.Server.prototype, 'sendTransaction').mockResolvedValue({
      status,
      hash,
      latestLedger: 1,
      latestLedgerCloseTime: 1,
    } as unknown as StellarSdk.rpc.Api.SendTransactionResponse);
  }

  function mockPoll(status: 'SUCCESS' | 'FAILED', hash = 'tx_hash') {
    return jest.spyOn(StellarSdk.rpc.Server.prototype, 'pollTransaction').mockResolvedValue({
      status,
      txHash: hash,
    } as unknown as StellarSdk.rpc.Api.GetTransactionResponse);
  }

  function mockSignSuccess(signerAddress = SENDER) {
    mockedFreighter.signTransaction.mockResolvedValue({
      signedTxXdr: 'signed-xdr',
      signerAddress,
    });
  }

  beforeEach(() => {
    jest
      .spyOn(StellarSdk.TransactionBuilder, 'fromXDR')
      .mockReturnValue({} as unknown as StellarSdk.Transaction);
  });

  describe.each([
    ['withdrawFromStream', STREAM_ID] as const,
    ['cancelStream', STREAM_ID] as const,
    ['cancelSchedule', SCHEDULE_ID] as const,
  ])('%s', (methodName, contractId) => {
    it('builds, signs, submits and returns the tx hash on success', async () => {
      mockPrepare();
      mockSignSuccess();
      mockSend('PENDING');
      mockPoll('SUCCESS');

      const client = makeClient() as unknown as Record<
        string,
        (id: string, signer: string) => Promise<string>
      >;
      const hash = await client[methodName](contractId, SENDER);

      expect(hash).toBe('tx_hash');
    });

    it('throws USER_REJECTED when Freighter signing is declined', async () => {
      mockPrepare();
      mockedFreighter.signTransaction.mockResolvedValue({
        signedTxXdr: '',
        signerAddress: '',
        error: { code: -4, message: 'User declined access' },
      });

      const client = makeClient() as unknown as Record<
        string,
        (id: string, signer: string) => Promise<string>
      >;

      await expect(client[methodName](contractId, SENDER)).rejects.toMatchObject({
        code: 'USER_REJECTED',
      });
    });

    it('throws SIMULATION_FAILED when the transaction cannot be prepared', async () => {
      jest
        .spyOn(StellarSdk.rpc.Server.prototype, 'prepareTransaction')
        .mockRejectedValue(new Error('contract not found'));

      const client = makeClient() as unknown as Record<
        string,
        (id: string, signer: string) => Promise<string>
      >;

      await expect(client[methodName](contractId, SENDER)).rejects.toMatchObject({
        code: 'SIMULATION_FAILED',
      });
    });

    it('throws SUBMISSION_FAILED when the network rejects the submission', async () => {
      mockPrepare();
      mockSignSuccess();
      mockSend('ERROR');

      const client = makeClient() as unknown as Record<
        string,
        (id: string, signer: string) => Promise<string>
      >;

      await expect(client[methodName](contractId, SENDER)).rejects.toMatchObject({
        code: 'SUBMISSION_FAILED',
      });
    });

    it('throws TRANSACTION_FAILED when the submitted transaction fails on-chain', async () => {
      mockPrepare();
      mockSignSuccess();
      mockSend('PENDING');
      mockPoll('FAILED');

      const client = makeClient() as unknown as Record<
        string,
        (id: string, signer: string) => Promise<string>
      >;

      await expect(client[methodName](contractId, SENDER)).rejects.toMatchObject({
        code: 'TRANSACTION_FAILED',
      });
    });
  });

  // ── Write methods: createStream / createRecurringPayment ────────────────

  function mockAssemble() {
    return jest.spyOn(StellarSdk.rpc, 'assembleTransaction').mockImplementation(() => {
      const built = { toXDR: () => 'assembled-xdr' } as unknown as StellarSdk.Transaction;
      return { build: () => built } as unknown as StellarSdk.TransactionBuilder;
    });
  }

  function mockLatestLedger(sequence = 1000) {
    return jest.spyOn(StellarSdk.rpc.Server.prototype, 'getLatestLedger').mockResolvedValue({
      id: 'abc',
      sequence,
      protocolVersion: '21',
    } as unknown as StellarSdk.rpc.Api.GetLatestLedgerResponse);
  }

  describe('createStream', () => {
    const params = {
      recipient: RECIPIENT,
      token: TOKEN_ID,
      ratePerSecond: 10n,
      startTime: 1000,
      endTime: 1100,
      totalFunded: 1000n,
    };
    const NEW_STREAM_ID = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 20));

    it('deploys the stream and returns its contract address', async () => {
      mockSimulation(simulateSuccess(addr(NEW_STREAM_ID).toScVal()));
      mockAssemble();
      mockSignSuccess();
      mockSend('PENDING');
      mockPoll('SUCCESS');

      const streamId = await makeClient().createStream(SENDER, params);

      expect(streamId).toBe(NEW_STREAM_ID);
    });

    it('throws SIMULATION_FAILED when simulation fails', async () => {
      mockSimulation(simulateError('factory not found'));

      await expect(makeClient().createStream(SENDER, params)).rejects.toMatchObject({
        code: 'SIMULATION_FAILED',
      });
    });

    it('throws USER_REJECTED when Freighter signing is declined', async () => {
      mockSimulation(simulateSuccess(addr(NEW_STREAM_ID).toScVal()));
      mockAssemble();
      mockedFreighter.signTransaction.mockResolvedValue({
        signedTxXdr: '',
        signerAddress: '',
        error: { code: -4, message: 'User declined access' },
      });

      await expect(makeClient().createStream(SENDER, params)).rejects.toMatchObject({
        code: 'USER_REJECTED',
      });
    });

    it('throws SUBMISSION_FAILED when the network rejects the submission', async () => {
      mockSimulation(simulateSuccess(addr(NEW_STREAM_ID).toScVal()));
      mockAssemble();
      mockSignSuccess();
      mockSend('ERROR');

      await expect(makeClient().createStream(SENDER, params)).rejects.toMatchObject({
        code: 'SUBMISSION_FAILED',
      });
    });

    it('throws TRANSACTION_FAILED when the submitted transaction fails on-chain', async () => {
      mockSimulation(simulateSuccess(addr(NEW_STREAM_ID).toScVal()));
      mockAssemble();
      mockSignSuccess();
      mockSend('PENDING');
      mockPoll('FAILED');

      await expect(makeClient().createStream(SENDER, params)).rejects.toMatchObject({
        code: 'TRANSACTION_FAILED',
      });
    });
  });

  describe('createRecurringPayment', () => {
    const params = {
      recipient: RECIPIENT,
      token: TOKEN_ID,
      amount: 100n,
      intervalSeconds: 604_800,
      firstPaymentTime: 1_604_800,
    };
    const NEW_SCHEDULE_ID = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 21));

    it('deploys the schedule, approves it on the token, and returns its address', async () => {
      mockSimulation(simulateSuccess(addr(NEW_SCHEDULE_ID).toScVal()));
      mockAssemble();
      mockLatestLedger(1000);
      const prepare = mockPrepare();
      mockSignSuccess();
      mockSend('PENDING');
      mockPoll('SUCCESS');

      const scheduleId = await makeClient().createRecurringPayment(SENDER, params);

      expect(scheduleId).toBe(NEW_SCHEDULE_ID);
      // The schedule deploy goes through invokeContractForAddress (simulate +
      // assemble, asserted via the mocks above); the approval afterward goes
      // through invokeContract, which calls prepareTransaction exactly once.
      expect(prepare).toHaveBeenCalledTimes(1);
    });

    it('throws SIMULATION_FAILED when the factory call cannot be simulated', async () => {
      mockSimulation(simulateError('factory not found'));

      await expect(makeClient().createRecurringPayment(SENDER, params)).rejects.toMatchObject({
        code: 'SIMULATION_FAILED',
      });
    });

    it('propagates a failure from the approval step after the schedule was created', async () => {
      mockSimulation(simulateSuccess(addr(NEW_SCHEDULE_ID).toScVal()));
      mockAssemble();
      mockLatestLedger(1000);
      jest
        .spyOn(StellarSdk.rpc.Server.prototype, 'prepareTransaction')
        .mockRejectedValue(new Error('allowance contract call rejected'));
      mockSignSuccess();
      mockSend('PENDING');
      mockPoll('SUCCESS');

      await expect(makeClient().createRecurringPayment(SENDER, params)).rejects.toMatchObject({
        code: 'SIMULATION_FAILED',
      });
    });
  });
});
