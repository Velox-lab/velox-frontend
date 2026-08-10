import React from 'react';
import { Network } from '../../types';

interface Props {
  network: Network;
}

/**
 * NetworkBadge — displays the current Stellar network with a colour-coded badge.
 * Green for mainnet, yellow for testnet.
 *
 * Renders only. No logic.
 */
export function NetworkBadge({ network }: Props) {
  const isMainnet = network === 'mainnet';
  const label = isMainnet ? 'Mainnet' : 'Testnet';

  return (
    <span
      className={`velox-badge velox-badge--${network}`}
      aria-label={`Connected to Stellar ${label}`}
    >
      <span className="velox-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
