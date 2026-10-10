import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletConnectButton } from './WalletConnectButton';

const BASE_PROPS = {
  isConnected: false,
  publicKey: null,
  isConnecting: false,
  onConnect: jest.fn(),
  onDisconnect: jest.fn(),
};

describe('WalletConnectButton', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders connect button when disconnected', () => {
    render(<WalletConnectButton {...BASE_PROPS} />);
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });

  it('shows loading state while connecting', () => {
    render(<WalletConnectButton {...BASE_PROPS} isConnecting={true} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onConnect when connect button is clicked', async () => {
    const onConnect = jest.fn();
    render(<WalletConnectButton {...BASE_PROPS} onConnect={onConnect} />);
    await userEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('renders truncated address and disconnect button when connected', () => {
    render(
      <WalletConnectButton
        {...BASE_PROPS}
        isConnected={true}
        publicKey="GABCDEFGHIJKLMNOPQRSTUVWXYZ"
      />
    );
    expect(screen.getByLabelText(/connected wallet address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
  });

  it('calls onDisconnect when disconnect button is clicked', async () => {
    const onDisconnect = jest.fn();
    render(
      <WalletConnectButton
        {...BASE_PROPS}
        isConnected={true}
        publicKey="GABCDEFGHIJKLMNOPQRSTUVWXYZ"
        onDisconnect={onDisconnect}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /disconnect/i }));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it('truncates long public key to G...XXXX format', () => {
    render(
      <WalletConnectButton
        {...BASE_PROPS}
        isConnected={true}
        publicKey="GABCDEFGHIJKLMNOPQRSTUVWXYZ"
      />
    );
    expect(screen.getByLabelText(/connected wallet address/i).textContent).toBe('GABC...WXYZ');
  });
});
