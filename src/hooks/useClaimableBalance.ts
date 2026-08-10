import { useState, useEffect, useCallback } from 'react';
import { VeloxClient } from '../client/VeloxClient';

/**
 * useClaimableBalance — polls the claimable balance for a stream at a set interval.
 *
 * Designed to provide a near-real-time balance display in StreamCard and WithdrawButton.
 * Polling stops automatically when the component unmounts.
 */
export function useClaimableBalance(
  streamId: string,
  client: VeloxClient,
  pollIntervalMs: number = 5000
) {
  const [claimableBalance, setClaimableBalance] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch the current claimable balance from the contract. */
  const fetchBalance = useCallback(async () => {
    try {
      const balance = await client.getClaimableBalance(streamId);
      setClaimableBalance(balance);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [streamId, client]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchBalance, pollIntervalMs]);

  return { claimableBalance, isLoading, error };
}
