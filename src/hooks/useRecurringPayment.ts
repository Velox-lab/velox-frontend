import { useState, useEffect, useCallback } from 'react';
import { Schedule } from '../types';
import { VeloxClient } from '../client/VeloxClient';

/**
 * useRecurringPayment — manages state and actions for a single recurring payment schedule.
 *
 * Fetches schedule data on mount and after any state-changing action.
 * Components call cancel() — they never call VeloxClient directly.
 */
export function useRecurringPayment(
  scheduleId: string,
  senderPublicKey: string,
  client: VeloxClient
) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetch the latest schedule state from the contract. */
  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await client.getSchedule(scheduleId);
      setSchedule(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId, client]);

  /** Cancel the recurring payment schedule. */
  const cancel = useCallback(async () => {
    setIsCancelling(true);
    setError(null);

    try {
      await client.cancelSchedule(scheduleId, senderPublicKey);
      await fetchSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setIsCancelling(false);
    }
  }, [scheduleId, senderPublicKey, client, fetchSchedule]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return {
    schedule,
    isLoading,
    isCancelling,
    error,
    cancel,
    refresh: fetchSchedule,
  };
}
