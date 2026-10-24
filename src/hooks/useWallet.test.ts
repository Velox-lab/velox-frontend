import { renderHook, act, waitFor } from '@testing-library/react';
import { useWallet } from './useWallet';
import { VeloxClient } from '../client/VeloxClient';
import { WalletState } from '../types';

function makeClient(): jest.Mocked<Pick<VeloxClient, 'connectWallet'>> {
  return { connectWallet: jest.fn() };
}

describe('useWallet', () => {
  it('starts disconnected with no error', () => {
    const client = makeClient();
    const { result } = renderHook(() => useWallet(client as unknown as VeloxClient));

    expect(result.current.wallet).toEqual({
      publicKey: null,
      network: 'testnet',
      isConnected: false,
    });
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('connect() sets wallet state on success', async () => {
    const client = makeClient();
    const connected: WalletState = {
      publicKey: 'GABC',
      network: 'testnet',
      isConnected: true,
    };
    client.connectWallet.mockResolvedValue(connected);
    const { result } = renderHook(() => useWallet(client as unknown as VeloxClient));

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.wallet).toEqual(connected);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('connect() sets isConnecting true while in flight', async () => {
    const client = makeClient();
    let resolveConnect!: (state: WalletState) => void;
    client.connectWallet.mockReturnValue(
      new Promise((resolve) => {
        resolveConnect = resolve;
      })
    );
    const { result } = renderHook(() => useWallet(client as unknown as VeloxClient));

    let connectPromise!: Promise<void>;
    act(() => {
      connectPromise = result.current.connect();
    });

    expect(result.current.isConnecting).toBe(true);

    resolveConnect({ publicKey: 'GABC', network: 'testnet', isConnected: true });
    await act(async () => {
      await connectPromise;
    });

    expect(result.current.isConnecting).toBe(false);
  });

  it('connect() sets error and leaves wallet disconnected on failure', async () => {
    const client = makeClient();
    client.connectWallet.mockRejectedValue(new Error('Freighter not installed'));
    const { result } = renderHook(() => useWallet(client as unknown as VeloxClient));

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.error).toBe('Freighter not installed');
    expect(result.current.wallet.isConnected).toBe(false);
  });

  it('connect() falls back to a generic message for a non-Error rejection', async () => {
    const client = makeClient();
    client.connectWallet.mockRejectedValue('boom');
    const { result } = renderHook(() => useWallet(client as unknown as VeloxClient));

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.error).toBe('Failed to connect wallet');
  });

  it('disconnect() resets wallet state and clears any error', async () => {
    const client = makeClient();
    client.connectWallet.mockResolvedValue({
      publicKey: 'GABC',
      network: 'testnet',
      isConnected: true,
    });
    const { result } = renderHook(() => useWallet(client as unknown as VeloxClient));

    await act(async () => {
      await result.current.connect();
    });
    act(() => {
      result.current.disconnect();
    });

    expect(result.current.wallet).toEqual({
      publicKey: null,
      network: 'testnet',
      isConnected: false,
    });
    expect(result.current.error).toBeNull();
  });

  it('does not call connectWallet on mount', async () => {
    const client = makeClient();
    renderHook(() => useWallet(client as unknown as VeloxClient));

    await waitFor(() => expect(client.connectWallet).not.toHaveBeenCalled());
  });
});
