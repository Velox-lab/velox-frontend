import { useState, useEffect, useCallback } from 'react';
import { Schedule } from '../types';
import { VeloxClient } from '../client/VeloxClient';

/**
 * useScheduleList — fetches all recurring payment schedules for a given wallet address.
 *
 * Used by RecurringPaymentList to populate the full list of incoming and outgoing schedules.
 */
export function useScheduleList(address: string, client: VeloxClient) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch all schedules associated with the given address. */
  const fetchSchedules = useCallback(async () => {
    if (!address) {
      setSchedules([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await client.getSchedulesByAddress(address);
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  }, [address, client]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return { schedules, isLoading, error, refresh: fetchSchedules };
}
