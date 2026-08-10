import React from 'react';

interface Props {
  isConnected: boolean;
  publicKey: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

/**
 * WalletConnectButton — displays a connect button when disconnected,
 * and a truncated address with disconnect option when connected.
 *
 * This component renders only. All wallet logic lives in useWallet.
 */
export function WalletConnectButton({
  isConnected,
  publicKey,
  isConnecting,
  onConnect,
  onDisconnect,
}: Props) {
  if (isConnected && publicKey) {
    return (
      <div className="velox-wallet-connected">
        <span aria-label="Connected wallet address">
          {truncateAddress(publicKey)}
        </span>
        <button
          onClick={onDisconnect}
          aria-label="Disconnect wallet"
          className="velox-btn velox-btn--secondary"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onConnect}
      disabled={isConnecting}
      aria-label="Connect wallet"
      aria-busy={isConnecting}
      className="velox-btn velox-btn--primary"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

/** Truncate a Stellar public key to G...XXXX format. */
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
