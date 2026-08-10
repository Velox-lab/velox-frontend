import { useState, useEffect, useCallback } from 'react';
import { Stream } from '../types';
import { VeloxClient } from '../client/VeloxClient';

/**
 * useStreamList — fetches all streams for a given wallet address.
 *
 * Used by StreamDashboard to populate the full list of incoming and outgoing streams.
 */
export function useStreamList(address: string, client: VeloxClient) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch all streams associated with the given address. */
  const fetchStreams = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await client.getStreamsByAddress(address);
      setStreams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load streams');
    } finally {
      setIsLoading(false);
    }
  }, [address, client]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  return { streams, isLoading, error, refresh: fetchStreams };
}
