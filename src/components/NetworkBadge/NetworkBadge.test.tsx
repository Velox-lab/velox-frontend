import { render, screen } from '@testing-library/react';
import { NetworkBadge } from './NetworkBadge';

describe('NetworkBadge', () => {
  it('displays Mainnet label for mainnet', () => {
    render(<NetworkBadge network="mainnet" />);
    expect(screen.getByLabelText(/mainnet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mainnet/i).textContent).toContain('Mainnet');
  });

  it('displays Testnet label for testnet', () => {
    render(<NetworkBadge network="testnet" />);
    expect(screen.getByLabelText(/testnet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/testnet/i).textContent).toContain('Testnet');
  });

  it('applies the correct CSS class for mainnet', () => {
    render(<NetworkBadge network="mainnet" />);
    expect(screen.getByLabelText(/mainnet/i)).toHaveClass('velox-badge--mainnet');
  });

  it('applies the correct CSS class for testnet', () => {
    render(<NetworkBadge network="testnet" />);
    expect(screen.getByLabelText(/testnet/i)).toHaveClass('velox-badge--testnet');
  });
});
