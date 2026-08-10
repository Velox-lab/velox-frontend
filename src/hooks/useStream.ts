import { useState, useEffect, useCallback } from 'react';
import { Stream } from '../types';
import { VeloxClient } from '../client/VeloxClient';

/**
 * useStream — manages the full state and actions for a single payment stream.
 *
 * Fetches stream data on mount and after any action.
 * Components call withdraw() and cancel() — they never call VeloxClient directly.
 */
export function useStream(streamId: string, senderPublicKey: string, client: VeloxClient) {
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
      await client.withdrawFromStream(streamId, senderPublicKey);
      await fetchStream();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdraw failed');
    } finally {
      setIsWithdrawing(false);
    }
  }, [streamId, senderPublicKey, client, fetchStream]);

  /** Cancel the stream and reclaim unstreamed funds. */
  const cancel = useCallback(async () => {
    setIsCancelling(true);
    setError(null);

    try {
      await client.cancelStream(streamId, senderPublicKey);
      await fetchStream();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setIsCancelling(false);
    }
  }, [streamId, senderPublicKey, client, fetchStream]);

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
