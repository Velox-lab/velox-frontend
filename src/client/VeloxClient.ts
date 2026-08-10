import {
  Stream,
  Schedule,
  TxHash,
  CreateStreamParams,
  CreateScheduleParams,
  WalletState,
  Network,
} from '../types';

/**
 * VeloxClient — all communication with the Stellar network and Velox contracts.
 *
 * This is the only module that talks to the blockchain.
 * It returns typed domain objects — no raw SDK types are exposed to upper layers.
 * It throws typed errors — no raw SDK exceptions bubble up to components or hooks.
 */
export class VeloxClient {
  private readonly registryContractId: string;
  private readonly network: Network;

  constructor(registryContractId: string, network: Network = 'testnet') {
    this.registryContractId = registryContractId;
    this.network = network;
  }

  // ── Wallet ────────────────────────────────────────────────────────────────

  /** Request wallet access via Freighter and return the connected wallet state. */
  async connectWallet(): Promise<WalletState> {
    // TODO: implement Freighter wallet connection
    // Contributor issue: "Implement VeloxClient.connectWallet with Freighter API"
    //
    // Expected:
    //   const { isConnected } = await isConnected()
    //   const { address } = await requestAccess()
    //   return { publicKey: address, network: this.network, isConnected: true }
    throw new Error('Not implemented');
  }

  // ── Streams ───────────────────────────────────────────────────────────────

  /** Fetch a stream's full state from the PaymentStream contract. */
  async getStream(streamId: string): Promise<Stream> {
    // TODO: implement Soroban contract read
    // Contributor issue: "Implement VeloxClient.getStream"
    throw new Error('Not implemented');
  }

  /** Fetch how many tokens the recipient can withdraw from a stream right now. */
  async getClaimableBalance(streamId: string): Promise<bigint> {
    // TODO: implement get_claimable_balance contract call
    // Contributor issue: "Implement VeloxClient.getClaimableBalance"
    throw new Error('Not implemented');
  }

  /** Deploy a new PaymentStream via StreamFactory and return the stream contract ID. */
  async createStream(
    senderPublicKey: string,
    params: CreateStreamParams
  ): Promise<string> {
    // TODO: implement StreamFactory.create_stream invocation
    // Contributor issue: "Implement VeloxClient.createStream"
    throw new Error('Not implemented');
  }

  /** Call withdraw() on a PaymentStream contract. Returns the transaction hash. */
  async withdrawFromStream(streamId: string, senderPublicKey: string): Promise<TxHash> {
    // TODO: implement PaymentStream.withdraw invocation
    // Contributor issue: "Implement VeloxClient.withdrawFromStream"
    throw new Error('Not implemented');
  }

  /** Call cancel() on a PaymentStream contract. Returns the transaction hash. */
  async cancelStream(streamId: string, senderPublicKey: string): Promise<TxHash> {
    // TODO: implement PaymentStream.cancel invocation
    // Contributor issue: "Implement VeloxClient.cancelStream"
    throw new Error('Not implemented');
  }

  /** Fetch all streams for a given wallet address from VeloxRegistry. */
  async getStreamsByAddress(address: string): Promise<Stream[]> {
    // TODO: implement VeloxRegistry query
    // Contributor issue: "Implement VeloxClient.getStreamsByAddress"
    throw new Error('Not implemented');
  }

  // ── Recurring Payments ────────────────────────────────────────────────────

  /** Fetch a schedule's full state from the RecurringPayment contract. */
  async getSchedule(scheduleId: string): Promise<Schedule> {
    // TODO: implement Soroban contract read
    // Contributor issue: "Implement VeloxClient.getSchedule"
    throw new Error('Not implemented');
  }

  /** Deploy a new RecurringPayment via StreamFactory and return the schedule ID. */
  async createRecurringPayment(
    senderPublicKey: string,
    params: CreateScheduleParams
  ): Promise<string> {
    // TODO: implement StreamFactory.create_schedule invocation
    // Contributor issue: "Implement VeloxClient.createRecurringPayment"
    throw new Error('Not implemented');
  }

  /** Cancel a recurring payment schedule. Returns the transaction hash. */
  async cancelSchedule(scheduleId: string, senderPublicKey: string): Promise<TxHash> {
    // TODO: implement RecurringPayment.cancel invocation
    // Contributor issue: "Implement VeloxClient.cancelSchedule"
    throw new Error('Not implemented');
  }
}
