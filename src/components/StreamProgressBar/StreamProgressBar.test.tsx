import React from 'react';
import { render, screen } from '@testing-library/react';
import { StreamProgressBar } from './StreamProgressBar';

describe('StreamProgressBar', () => {
  it('renders a progressbar role', () => {
    render(<StreamProgressBar streamed={500n} total={1000n} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows 50% when half the total is streamed', () => {
    render(<StreamProgressBar streamed={500n} total={1000n} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows 0% when nothing has been streamed', () => {
    render(<StreamProgressBar streamed={0n} total={1000n} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps at 100% even if streamed exceeds total', () => {
    render(<StreamProgressBar streamed={2000n} total={1000n} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('shows 0% when total is zero', () => {
    render(<StreamProgressBar streamed={0n} total={0n} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('displays the percentage label', () => {
    render(<StreamProgressBar streamed={750n} total={1000n} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
