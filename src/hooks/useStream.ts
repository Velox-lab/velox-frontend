import { useState, useEffect, useCallback } from 'react';
import { Stream } from '../types';
import { VeloxClient } from '../client/VeloxClient';

/**
 * useStream — manages the full state and actions for a single payment stream.
 *
 * Fetches stream data on mount and after any action.
 * Components call withdraw() and cancel() — they never call VeloxClient directly.
 *
 * userPublicKey is the connected wallet's key, passed to both withdraw() and
 * cancel(): only the stream's recipient can actually withdraw and only its
 * sender can actually cancel, and the contract itself enforces that, so the
 * hook does not need to know in advance which one the connected wallet is.
 */
export function useStream(streamId: string, userPublicKey: string, client: VeloxClient) {
  const [stream, setStream] = useState<Stream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetch the latest stream state from the contract. */
  const fetchStream = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await client.getStream(streamId);
      setStream(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stream');
    } finally {
      setIsLoading(false);
    }
  }, [streamId, client]);

  /** Withdraw the currently claimable balance. */
  const withdraw = useCallback(async () => {
    setIsWithdrawing(true);
    setError(null);

    try {
      await client.withdrawFromStream(streamId, userPublicKey);
      await fetchStream();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdraw failed');
    } finally {
      setIsWithdrawing(false);
    }
  }, [streamId, userPublicKey, client, fetchStream]);

  /** Cancel the stream and reclaim unstreamed funds. */
  const cancel = useCallback(async () => {
    setIsCancelling(true);
    setError(null);

    try {
      await client.cancelStream(streamId, userPublicKey);
      await fetchStream();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setIsCancelling(false);
    }
  }, [streamId, userPublicKey, client, fetchStream]);

  useEffect(() => {
    fetchStream();
  }, [fetchStream]);

  return {
    stream,
    isLoading,
    isWithdrawing,
    isCancelling,
    error,
    withdraw,
    cancel,
    refresh: fetchStream,
  };
}
