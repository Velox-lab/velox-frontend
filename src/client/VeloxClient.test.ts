import { VeloxClient } from './VeloxClient';

/**
 * VeloxClient's methods are all unimplemented stubs today (see the TODOs in the
 * source and issues #2-#5). These tests lock in that current behavior — every
 * method throws "Not implemented" — rather than implementing them, which is
 * left for those issues. Replace the relevant test here as each method is
 * implemented, instead of deleting it outright, so the suite keeps covering
 * every public method.
 */
describe('VeloxClient (unimplemented stubs)', () => {
  const client = new VeloxClient('C_REGISTRY', 'testnet');

  it.each([
    ['connectWallet', () => client.connectWallet()],
    ['getStream', () => client.getStream('C_STREAM')],
    ['getClaimableBalance', () => client.getClaimableBalance('C_STREAM')],
    [
      'createStream',
      () =>
        client.createStream('G_SENDER', {
          recipient: 'G_RECIPIENT',
          token: 'C_TOKEN',
          ratePerSecond: 10n,
          startTime: 1000,
          endTime: 2000,
          totalFunded: 10_000n,
        }),
    ],
    ['withdrawFromStream', () => client.withdrawFromStream('C_STREAM', 'G_SENDER')],
    ['cancelStream', () => client.cancelStream('C_STREAM', 'G_SENDER')],
    ['getStreamsByAddress', () => client.getStreamsByAddress('G_ADDRESS')],
    ['getSchedule', () => client.getSchedule('C_SCHEDULE')],
    [
      'createRecurringPayment',
      () =>
        client.createRecurringPayment('G_SENDER', {
          recipient: 'G_RECIPIENT',
          token: 'C_TOKEN',
          amount: 100n,
          intervalSeconds: 604_800,
          firstPaymentTime: 1_604_800,
        }),
    ],
    ['cancelSchedule', () => client.cancelSchedule('C_SCHEDULE', 'G_SENDER')],
  ])('%s rejects with "Not implemented"', async (_name, call) => {
    await expect(call()).rejects.toThrow('Not implemented');
  });
});
