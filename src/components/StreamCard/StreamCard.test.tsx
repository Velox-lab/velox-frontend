import { render, screen } from '@testing-library/react';
import { StreamCard } from './StreamCard';
import { Stream } from '../../types';

function makeStream(overrides: Partial<Stream> = {}): Stream {
  return {
    streamId: 'CSTREAM000000000000000000000000000000000000000000000000',
    sender: 'GSENDER0000000000000000000000000000000000000000000000000',
    recipient: 'GRECIPIENT000000000000000000000000000000000000000000000',
    token: 'CTOKEN0000000000000000000000000000000000000000000000000',
    ratePerSecond: 10n,
    startTime: 1000,
    endTime: 1100,
    totalFunded: 1000n,
    totalWithdrawn: 250n,
    status: 'active',
    ...overrides,
  };
}

describe('StreamCard', () => {
  it('renders the sender and recipient addresses', () => {
    render(<StreamCard stream={makeStream()} />);
    expect(screen.getByLabelText(/stellar address: GSENDER/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stellar address: GRECIPIENT/i)).toBeInTheDocument();
  });

  it('renders funded and withdrawn amounts using the provided asset code', () => {
    render(<StreamCard stream={makeStream()} assetCode="USDC" />);
    expect(screen.getByText(/0\.0000250 USDC/)).toBeInTheDocument();
    expect(screen.getByText(/0\.0001000 USDC/)).toBeInTheDocument();
  });

  it('falls back to a truncated token address when no asset code is given', () => {
    render(<StreamCard stream={makeStream()} />);
    expect(screen.getAllByText(/CTOK\.\.\.0000/).length).toBeGreaterThan(0);
  });

  it('renders a progress bar reflecting withdrawn vs funded', () => {
    render(<StreamCard stream={makeStream({ totalWithdrawn: 250n, totalFunded: 1000n })} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
  });

  it.each([
    ['active', 'Active'],
    ['paused', 'Paused'],
    ['cancelled', 'Cancelled'],
    ['completed', 'Completed'],
  ] as const)('shows the %s status label', (status, label) => {
    render(<StreamCard stream={makeStream({ status })} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('only animates the progress bar while active', () => {
    const { rerender } = render(<StreamCard stream={makeStream({ status: 'active' })} />);
    expect(document.querySelector('.velox-progress__fill--animated')).toBeInTheDocument();

    rerender(<StreamCard stream={makeStream({ status: 'paused' })} />);
    expect(document.querySelector('.velox-progress__fill--animated')).not.toBeInTheDocument();
  });
});
