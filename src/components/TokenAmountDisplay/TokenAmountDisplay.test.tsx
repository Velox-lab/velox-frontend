import React from 'react';
import { render, screen } from '@testing-library/react';
import { TokenAmountDisplay } from './TokenAmountDisplay';

describe('TokenAmountDisplay', () => {
  it('renders the formatted token amount', () => {
    render(<TokenAmountDisplay amount={10_000_000n} assetCode="XLM" />);
    expect(screen.getByText('1.0000000 XLM')).toBeInTheDocument();
  });

  it('renders zero amount correctly', () => {
    render(<TokenAmountDisplay amount={0n} assetCode="USDC" />);
    expect(screen.getByText('0.0000000 USDC')).toBeInTheDocument();
  });

  it('includes aria-label with the formatted amount', () => {
    render(<TokenAmountDisplay amount={5_000_000n} assetCode="USDC" />);
    expect(screen.getByLabelText('0.5000000 USDC')).toBeInTheDocument();
  });

  it('applies the velox-token-amount class', () => {
    render(<TokenAmountDisplay amount={10_000_000n} assetCode="XLM" />);
    expect(screen.getByText('1.0000000 XLM')).toHaveClass('velox-token-amount');
  });

  it('applies an optional custom className', () => {
    render(<TokenAmountDisplay amount={10_000_000n} assetCode="XLM" className="my-custom" />);
    expect(screen.getByText('1.0000000 XLM')).toHaveClass('my-custom');
  });

  it('renders EURC amounts correctly', () => {
    render(<TokenAmountDisplay amount={20_000_000n} assetCode="EURC" />);
    expect(screen.getByText('2.0000000 EURC')).toBeInTheDocument();
  });
});
