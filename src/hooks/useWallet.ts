import { useState, useCallback } from 'react';
import { WalletState, Network } from '../types';
import { VeloxClient } from '../client/VeloxClient';

const DEFAULT_WALLET_STATE: WalletState = {
  publicKey: null,
  network: 'testnet',
  isConnected: false,
};

/**
 * useWallet — manages wallet connection state and actions.
 *
 * This is the only hook that touches wallet state.
 * Components call connect() and disconnect() — they never talk to VeloxClient directly.
 */
export function useWallet(client: VeloxClient) {
  const [wallet, setWallet] = useState<WalletState>(DEFAULT_WALLET_STATE);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Request wallet access and update connection state. */
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const walletState = await client.connectWallet();
      setWallet(walletState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [client]);

  /** Clear wallet state and disconnect. */
  const disconnect = useCallback(() => {
    setWallet(DEFAULT_WALLET_STATE);
    setError(null);
  }, []);

  return {
    wallet,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}
