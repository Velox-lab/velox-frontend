import { renderHook, act, waitFor } from '@testing-library/react';
import { useScheduleList } from './useScheduleList';
import { VeloxClient } from '../client/VeloxClient';
import { Schedule } from '../types';

function makeClient(): jest.Mocked<Pick<VeloxClient, 'getSchedulesByAddress'>> {
  return { getSchedulesByAddress: jest.fn() };
}

function makeSchedule(scheduleId: string): Schedule {
  return {
    scheduleId,
    sender: 'G_SENDER',
    recipient: 'G_RECIPIENT',
    token: 'C_TOKEN',
    amount: 100n,
    intervalSeconds: 604_800,
    nextPaymentTime: 2000,
    status: 'active',
  };
}

describe('useScheduleList', () => {
  it('fetches schedules for the given address on mount', async () => {
    const client = makeClient();
    const schedules = [makeSchedule('s1'), makeSchedule('s2')];
    client.getSchedulesByAddress.mockResolvedValue(schedules);
    const { result } = renderHook(() =>
      useScheduleList('G_ADDRESS', client as unknown as VeloxClient)
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(client.getSchedulesByAddress).toHaveBeenCalledWith('G_ADDRESS');
    expect(result.current.schedules).toEqual(schedules);
    expect(result.current.error).toBeNull();
  });

  it('sets an error and keeps an empty list when the fetch fails', async () => {
    const client = makeClient();
    client.getSchedulesByAddress.mockRejectedValue(new Error('registry unreachable'));
    const { result } = renderHook(() =>
      useScheduleList('G_ADDRESS', client as unknown as VeloxClient)
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('registry unreachable');
    expect(result.current.schedules).toEqual([]);
  });

  it('does not fetch, and is not stuck loading, when address is empty', async () => {
    const client = makeClient();
    const { result } = renderHook(() => useScheduleList('', client as unknown as VeloxClient));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(client.getSchedulesByAddress).not.toHaveBeenCalled();
    expect(result.current.schedules).toEqual([]);
  });

  it('clears a previous list and stops loading when the address becomes empty', async () => {
    const client = makeClient();
    client.getSchedulesByAddress.mockResolvedValue([makeSchedule('s1')]);
    const { result, rerender } = renderHook(
      ({ address }) => useScheduleList(address, client as unknown as VeloxClient),
      { initialProps: { address: 'G_ADDRESS' } }
    );
    await waitFor(() => expect(result.current.schedules).toHaveLength(1));

    rerender({ address: '' });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.schedules).toEqual([]);
  });

  it('refresh() re-fetches the list', async () => {
    const client = makeClient();
    client.getSchedulesByAddress.mockResolvedValue([]);
    const { result } = renderHook(() =>
      useScheduleList('G_ADDRESS', client as unknown as VeloxClient)
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(client.getSchedulesByAddress).toHaveBeenCalledTimes(2);
  });

  it('re-fetches when the address changes', async () => {
    const client = makeClient();
    client.getSchedulesByAddress.mockResolvedValue([]);
    const { rerender } = renderHook(
      ({ address }) => useScheduleList(address, client as unknown as VeloxClient),
      { initialProps: { address: 'G_FIRST' } }
    );
    await waitFor(() => expect(client.getSchedulesByAddress).toHaveBeenCalledTimes(1));

    rerender({ address: 'G_SECOND' });

    await waitFor(() => expect(client.getSchedulesByAddress).toHaveBeenCalledTimes(2));
    expect(client.getSchedulesByAddress).toHaveBeenLastCalledWith('G_SECOND');
  });
});
