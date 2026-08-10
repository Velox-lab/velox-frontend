import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddressDisplay } from './AddressDisplay';

const FULL_ADDRESS = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ012345';

describe('AddressDisplay', () => {
  it('renders the address', () => {
    render(<AddressDisplay address={FULL_ADDRESS} />);
    expect(screen.getByLabelText(/stellar address/i)).toBeInTheDocument();
  });

  it('truncates the address by default', () => {
    render(<AddressDisplay address={FULL_ADDRESS} />);
    expect(screen.getByLabelText(/stellar address/i).textContent).toBe('GABC...5');
  });

  it('shows full address when truncate is false', () => {
    render(<AddressDisplay address={FULL_ADDRESS} truncate={false} />);
    expect(screen.getByLabelText(/stellar address/i).textContent).toBe(FULL_ADDRESS);
  });

  it('renders a link to Stellar Expert when linkToExplorer is true', () => {
    render(<AddressDisplay address={FULL_ADDRESS} linkToExplorer={true} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      `https://stellar.expert/explorer/public/account/${FULL_ADDRESS}`
    );
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders a copy button', () => {
    render(<AddressDisplay address={FULL_ADDRESS} />);
    expect(screen.getByRole('button', { name: /copy address/i })).toBeInTheDocument();
  });

  it('does not render an anchor when linkToExplorer is false', () => {
    render(<AddressDisplay address={FULL_ADDRESS} linkToExplorer={false} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
