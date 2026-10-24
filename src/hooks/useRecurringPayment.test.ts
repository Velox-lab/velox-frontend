import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecurringPayment } from './useRecurringPayment';
import { VeloxClient } from '../client/VeloxClient';
import { Schedule } from '../types';

const SCHEDULE_ID = 'C_SCHEDULE';
const SENDER = 'G_SENDER';

function makeClient(): jest.Mocked<Pick<VeloxClient, 'getSchedule' | 'cancelSchedule'>> {
  return { getSchedule: jest.fn(), cancelSchedule: jest.fn() };
}

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    scheduleId: SCHEDULE_ID,
    sender: SENDER,
    recipient: 'G_RECIPIENT',
    token: 'C_TOKEN',
    amount: 100n,
    intervalSeconds: 604_800,
    nextPaymentTime: 1_604_800,
    status: 'active',
    ...overrides,
  };
}

describe('useRecurringPayment', () => {
  it('fetches the schedule on mount', async () => {
    const client = makeClient();
    client.getSchedule.mockResolvedValue(makeSchedule());
    const { result } = renderHook(() =>
      useRecurringPayment(SCHEDULE_ID, SENDER, client as unknown as VeloxClient)
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(client.getSchedule).toHaveBeenCalledWith(SCHEDULE_ID);
    expect(result.current.schedule).toEqual(makeSchedule());
    expect(result.current.error).toBeNull();
  });

  it('sets an error and null schedule when the fetch fails', async () => {
    const client = makeClient();
    client.getSchedule.mockRejectedValue(new Error('schedule not found'));
    const { result } = renderHook(() =>
      useRecurringPayment(SCHEDULE_ID, SENDER, client as unknown as VeloxClient)
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('schedule not found');
    expect(result.current.schedule).toBeNull();
  });

  it('cancel() calls cancelSchedule then refetches', async () => {
    const client = makeClient();
    client.getSchedule
      .mockResolvedValueOnce(makeSchedule({ status: 'active' }))
      .mockResolvedValueOnce(makeSchedule({ status: 'cancelled' }));
    client.cancelSchedule.mockResolvedValue('tx_hash');
    const { result } = renderHook(() =>
      useRecurringPayment(SCHEDULE_ID, SENDER, client as unknown as VeloxClient)
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.cancel();
    });

    expect(client.cancelSchedule).toHaveBeenCalledWith(SCHEDULE_ID, SENDER);
    expect(client.getSchedule).toHaveBeenCalledTimes(2);
    expect(result.current.schedule?.status).toBe('cancelled');
    expect(result.current.isCancelling).toBe(false);
  });

  it('cancel() sets an error and does not clear the schedule on failure', async () => {
    const client = makeClient();
    client.getSchedule.mockResolvedValue(makeSchedule());
    client.cancelSchedule.mockRejectedValue(new Error('not the sender'));
    const { result } = renderHook(() =>
      useRecurringPayment(SCHEDULE_ID, SENDER, client as unknown as VeloxClient)
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.cancel();
    });

    expect(result.current.error).toBe('not the sender');
    expect(result.current.schedule).not.toBeNull();
    expect(result.current.isCancelling).toBe(false);
  });

  it('refresh() re-fetches the schedule', async () => {
    const client = makeClient();
    client.getSchedule.mockResolvedValue(makeSchedule());
    const { result } = renderHook(() =>
      useRecurringPayment(SCHEDULE_ID, SENDER, client as unknown as VeloxClient)
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(client.getSchedule).toHaveBeenCalledTimes(2);
  });
});
