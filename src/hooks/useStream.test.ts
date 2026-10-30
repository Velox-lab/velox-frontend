import { renderHook, act, waitFor } from '@testing-library/react';
import { useStream } from './useStream';
import { VeloxClient } from '../client/VeloxClient';
import { Stream } from '../types';

const STREAM_ID = 'C_STREAM';
const SENDER = 'G_SENDER';
/** The connected wallet's key, passed to useStream as userPublicKey. */
const CONNECTED_WALLET = 'G_CONNECTED_WALLET';

function makeClient(): jest.Mocked<
  Pick<VeloxClient, 'getStream' | 'withdrawFromStream' | 'cancelStream'>
> {
  return {
    getStream: jest.fn(),
    withdrawFromStream: jest.fn(),
    cancelStream: jest.fn(),
  };
}

function makeStream(overrides: Partial<Stream> = {}): Stream {
  return {
    streamId: STREAM_ID,
    sender: SENDER,
    recipient: 'G_RECIPIENT',
    token: 'C_TOKEN',
    ratePerSecond: 10n,
    startTime: 1000,
    endTime: 2000,
    totalFunded: 10_000n,
    totalWithdrawn: 0n,
    status: 'active',
    ...overrides,
  };
}

// useStream passes the connected wallet's key to both withdraw() and cancel(); the
// contract rejects whichever one that wallet is not authorized to call, so the hook
// does not need to know in advance whether the connected wallet is the stream's
// sender or its recipient. CONNECTED_WALLET below deliberately does not equal the
// stream's sender or recipient, to make sure the hook really does forward whatever
// key it is given rather than silently assuming one role or the other.
describe('useStream', () => {
  it('starts loading and fetches on mount', async () => {
    const client = makeClient();
    client.getStream.mockResolvedValue(makeStream());
    const { result } = renderHook(() =>
      useStream(STREAM_ID, CONNECTED_WALLET, client as unknown as VeloxClient)
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(client.getStream).toHaveBeenCalledWith(STREAM_ID);
    expect(result.current.stream).toEqual(makeStream());
    expect(result.current.error).toBeNull();
  });

  it('sets an error and null stream when the fetch fails', async () => {
    const client = makeClient();
    client.getStream.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() =>
      useStream(STREAM_ID, CONNECTED_WALLET, client as unknown as VeloxClient)
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('network down');
    expect(result.current.stream).toBeNull();
  });

  it('withdraw() calls withdrawFromStream then refetches', async () => {
    const client = makeClient();
    client.getStream
      .mockResolvedValueOnce(makeStream({ totalWithdrawn: 0n }))
      .mockResolvedValueOnce(makeStream({ totalWithdrawn: 500n }));
    client.withdrawFromStream.mockResolvedValue('tx_hash');
    const { result } = renderHook(() =>
      useStream(STREAM_ID, CONNECTED_WALLET, client as unknown as VeloxClient)
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.withdraw();
    });

    expect(client.withdrawFromStream).toHaveBeenCalledWith(STREAM_ID, CONNECTED_WALLET);
    expect(client.getStream).toHaveBeenCalledTimes(2);
    expect(result.current.stream?.totalWithdrawn).toBe(500n);
    expect(result.current.isWithdrawing).toBe(false);
  });

  it('withdraw() sets an error and does not refetch on failure', async () => {
    const client = makeClient();
    client.getStream.mockResolvedValue(makeStream());
    client.withdrawFromStream.mockRejectedValue(new Error('nothing to withdraw'));
    const { result } = renderHook(() =>
      useStream(STREAM_ID, CONNECTED_WALLET, client as unknown as VeloxClient)
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.withdraw();
    });

    expect(result.current.error).toBe('nothing to withdraw');
    expect(client.getStream).toHaveBeenCalledTimes(1);
    expect(result.current.isWithdrawing).toBe(false);
  });

  it('cancel() calls cancelStream then refetches', async () => {
    const client = makeClient();
    client.getStream
      .mockResolvedValueOnce(makeStream({ status: 'active' }))
      .mockResolvedValueOnce(makeStream({ status: 'cancelled' }));
    client.cancelStream.mockResolvedValue('tx_hash');
    const { result } = renderHook(() =>
      useStream(STREAM_ID, CONNECTED_WALLET, client as unknown as VeloxClient)
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.cancel();
    });

    expect(client.cancelStream).toHaveBeenCalledWith(STREAM_ID, CONNECTED_WALLET);
    expect(result.current.stream?.status).toBe('cancelled');
    expect(result.current.isCancelling).toBe(false);
  });

  it('cancel() sets an error on failure', async () => {
    const client = makeClient();
    client.getStream.mockResolvedValue(makeStream());
    client.cancelStream.mockRejectedValue(new Error('not the sender'));
    const { result } = renderHook(() =>
      useStream(STREAM_ID, CONNECTED_WALLET, client as unknown as VeloxClient)
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.cancel();
    });

    expect(result.current.error).toBe('not the sender');
  });

  it('refresh() re-fetches the stream', async () => {
    const client = makeClient();
    client.getStream.mockResolvedValue(makeStream());
    const { result } = renderHook(() =>
      useStream(STREAM_ID, CONNECTED_WALLET, client as unknown as VeloxClient)
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(client.getStream).toHaveBeenCalledTimes(2);
  });

  it('re-fetches when streamId changes', async () => {
    const client = makeClient();
    client.getStream.mockResolvedValue(makeStream());
    const { rerender } = renderHook(
      ({ id }) => useStream(id, CONNECTED_WALLET, client as unknown as VeloxClient),
      { initialProps: { id: STREAM_ID } }
    );
    await waitFor(() => expect(client.getStream).toHaveBeenCalledTimes(1));

    rerender({ id: 'C_OTHER_STREAM' });

    await waitFor(() => expect(client.getStream).toHaveBeenCalledTimes(2));
    expect(client.getStream).toHaveBeenLastCalledWith('C_OTHER_STREAM');
  });
});
