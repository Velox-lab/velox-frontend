import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamList } from './useStreamList';
import { VeloxClient } from '../client/VeloxClient';
import { Stream } from '../types';

function makeClient(): jest.Mocked<Pick<VeloxClient, 'getStreamsByAddress'>> {
  return { getStreamsByAddress: jest.fn() };
}

function makeStream(streamId: string): Stream {
  return {
    streamId,
    sender: 'G_SENDER',
    recipient: 'G_RECIPIENT',
    token: 'C_TOKEN',
    ratePerSecond: 10n,
    startTime: 1000,
    endTime: 2000,
    totalFunded: 10_000n,
    totalWithdrawn: 0n,
    status: 'active',
  };
}

describe('useStreamList', () => {
  it('fetches streams for the given address on mount', async () => {
    const client = makeClient();
    const streams = [makeStream('s1'), makeStream('s2')];
    client.getStreamsByAddress.mockResolvedValue(streams);
    const { result } = renderHook(() =>
      useStreamList('G_ADDRESS', client as unknown as VeloxClient)
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(client.getStreamsByAddress).toHaveBeenCalledWith('G_ADDRESS');
    expect(result.current.streams).toEqual(streams);
    expect(result.current.error).toBeNull();
  });

  it('sets an error and keeps an empty list when the fetch fails', async () => {
    const client = makeClient();
    client.getStreamsByAddress.mockRejectedValue(new Error('registry unreachable'));
    const { result } = renderHook(() =>
      useStreamList('G_ADDRESS', client as unknown as VeloxClient)
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('registry unreachable');
    expect(result.current.streams).toEqual([]);
  });

  it('does not fetch when address is empty', async () => {
    const client = makeClient();
    const { result } = renderHook(() => useStreamList('', client as unknown as VeloxClient));

    await waitFor(() => expect(client.getStreamsByAddress).not.toHaveBeenCalled());
    expect(result.current.streams).toEqual([]);
    // isLoading starts true and is never set to false for an empty address — a known bug,
    // see https://github.com/Velox-lab/velox-frontend/issues/6. Documenting the current
    // behavior here rather than fixing it, since that issue is left open for a contributor.
    expect(result.current.isLoading).toBe(true);
  });

  it('refresh() re-fetches the list', async () => {
    const client = makeClient();
    client.getStreamsByAddress.mockResolvedValue([]);
    const { result } = renderHook(() =>
      useStreamList('G_ADDRESS', client as unknown as VeloxClient)
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(client.getStreamsByAddress).toHaveBeenCalledTimes(2);
  });

  it('re-fetches when the address changes', async () => {
    const client = makeClient();
    client.getStreamsByAddress.mockResolvedValue([]);
    const { rerender } = renderHook(
      ({ address }) => useStreamList(address, client as unknown as VeloxClient),
      { initialProps: { address: 'G_FIRST' } }
    );
    await waitFor(() => expect(client.getStreamsByAddress).toHaveBeenCalledTimes(1));

    rerender({ address: 'G_SECOND' });

    await waitFor(() => expect(client.getStreamsByAddress).toHaveBeenCalledTimes(2));
    expect(client.getStreamsByAddress).toHaveBeenLastCalledWith('G_SECOND');
  });
});
