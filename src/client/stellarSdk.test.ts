import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Guards the Jest setup that VeloxClient depends on: stellar-sdk pulls in
 * ESM-only packages and needs TextEncoder/TextDecoder, which jsdom lacks.
 * If this fails after a dependency upgrade, see jest.config.js and src/setupTests.ts.
 */
describe('@stellar/stellar-sdk under Jest', () => {
  it('encodes and decodes contract values', () => {
    const value = StellarSdk.nativeToScVal(5n, { type: 'u64' });
    expect(StellarSdk.scValToNative(value)).toBe(5n);
  });

  it('constructs a Soroban RPC server', () => {
    const server = new StellarSdk.rpc.Server('https://soroban-testnet.stellar.org');
    expect(typeof server.simulateTransaction).toBe('function');
  });
});
