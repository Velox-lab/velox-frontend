import { render, screen } from '@testing-library/react';
import { TransactionStatus } from './TransactionStatus';

const TX_HASH = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

describe('TransactionStatus', () => {
  it.each([
    ['pending', 'Pending'],
    ['submitted', 'Submitted'],
    ['confirmed', 'Confirmed'],
    ['failed', 'Failed'],
  ] as const)('renders the %s state with its label', (status, label) => {
    render(<TransactionStatus status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('does not render a link when no txHash is given', () => {
    render(<TransactionStatus status="pending" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a Stellar Expert link when a txHash is given', () => {
    render(<TransactionStatus status="submitted" txHash={TX_HASH} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      `https://stellar.expert/explorer/public/tx/${TX_HASH}`
    );
  });

  it('links to the testnet explorer when network is testnet', () => {
    render(<TransactionStatus status="confirmed" txHash={TX_HASH} network="testnet" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      `https://stellar.expert/explorer/testnet/tx/${TX_HASH}`
    );
  });

  it('defaults to the mainnet explorer when no network is given', () => {
    render(<TransactionStatus status="confirmed" txHash={TX_HASH} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      expect.stringContaining('/explorer/public/')
    );
  });

  it('truncates the displayed hash', () => {
    render(<TransactionStatus status="confirmed" txHash={TX_HASH} />);
    expect(screen.getByRole('link').textContent).toBe('a1b2...a1b2');
  });
});
