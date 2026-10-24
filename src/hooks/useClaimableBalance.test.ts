import { renderHook, waitFor } from '@testing-library/react';
import { useClaimableBalance } from './useClaimableBalance';
import { VeloxClient } from '../client/VeloxClient';

const STREAM_ID = 'C_STREAM';

function makeClient(): jest.Mocked<Pick<VeloxClient, 'getClaimableBalance'>> {
  return { getClaimableBalance: jest.fn() };
}

describe('useClaimableBalance', () => {
  it('fetches the balance on mount', async () => {
    const client = makeClient();
    client.getClaimableBalance.mockResolvedValue(1_000n);
    const { result } = renderHook(() =>
      useClaimableBalance(STREAM_ID, client as unknown as VeloxClient)
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(client.getClaimableBalance).toHaveBeenCalledWith(STREAM_ID);
    expect(result.current.claimableBalance).toBe(1_000n);
    expect(result.current.error).toBeNull();
  });

  it('sets an error and keeps the balance at 0n when the fetch fails', async () => {
    const client = makeClient();
    client.getClaimableBalance.mockRejectedValue(new Error('rpc timeout'));
    const { result } = renderHook(() =>
      useClaimableBalance(STREAM_ID, client as unknown as VeloxClient)
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('rpc timeout');
    expect(result.current.claimableBalance).toBe(0n);
  });

  // Real timers with a short interval, rather than fake timers: mixing fake timers with
  // Testing Library's act()-wrapped state updates and waitFor's own polling is unreliable.
  it('polls again after pollIntervalMs', async () => {
    const client = makeClient();
    // mockResolvedValue (not Once) for the second value: a wide interval still leaves
    // some chance of a third poll landing before assertions run, and it should stay 200n.
    client.getClaimableBalance.mockResolvedValueOnce(100n).mockResolvedValue(200n);
    const { result } = renderHook(() =>
      useClaimableBalance(STREAM_ID, client as unknown as VeloxClient, 300)
    );

    await waitFor(() => expect(result.current.claimableBalance).toBe(100n));
    await waitFor(() => expect(result.current.claimableBalance).toBe(200n));

    expect(client.getClaimableBalance).toHaveBeenCalledTimes(2);
  });

  it('clears a prior error once a poll succeeds', async () => {
    const client = makeClient();
    // A longer interval than the other tests, so there is a reliable window to observe
    // the error from the first poll before the second poll (which succeeds) fires.
    client.getClaimableBalance
      .mockRejectedValueOnce(new Error('rpc timeout'))
      .mockResolvedValueOnce(500n);
    const { result } = renderHook(() =>
      useClaimableBalance(STREAM_ID, client as unknown as VeloxClient, 300)
    );

    await waitFor(() => expect(result.current.error).toBe('rpc timeout'));
    await waitFor(() => expect(result.current.claimableBalance).toBe(500n));

    expect(result.current.error).toBeNull();
  });

  it('stops polling after unmount', async () => {
    const client = makeClient();
    client.getClaimableBalance.mockResolvedValue(100n);
    const { unmount } = renderHook(() =>
      useClaimableBalance(STREAM_ID, client as unknown as VeloxClient, 20)
    );
    await waitFor(() => expect(client.getClaimableBalance).toHaveBeenCalledTimes(1));

    unmount();
    const callsAtUnmount = client.getClaimableBalance.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(client.getClaimableBalance).toHaveBeenCalledTimes(callsAtUnmount);
  });
});
