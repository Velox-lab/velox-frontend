import * as StellarSdk from '@stellar/stellar-sdk';
import * as freighter from '@stellar/freighter-api';
import { VeloxClient, VeloxClientError } from './VeloxClient';

jest.mock('@stellar/freighter-api');
const mockedFreighter = jest.mocked(freighter);

const REGISTRY_ID = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 1));
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
  return new VeloxClient(REGISTRY_ID, 'https://soroban-testnet.stellar.org', 'testnet');
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
});
