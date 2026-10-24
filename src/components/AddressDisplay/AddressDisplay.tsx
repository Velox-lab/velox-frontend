import { useState } from 'react';
import { truncateStellarAddress } from '../../utils/formatters';

interface Props {
  address: string;
  truncate?: boolean;
  linkToExplorer?: boolean;
}

const STELLAR_EXPERT_BASE = 'https://stellar.expert/explorer/public/account';

/**
 * AddressDisplay — shows a Stellar public key with optional truncation,
 * copy-to-clipboard, and a link to Stellar Expert.
 *
 * Renders only. No network calls.
 */
export function AddressDisplay({ address, truncate = true, linkToExplorer = false }: Props) {
  const [copied, setCopied] = useState(false);

  const displayAddress = truncate ? truncateStellarAddress(address) : address;

  /** Copy the full address to clipboard and show brief confirmation. */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — silent fail
    }
  };

  return (
    <span className="velox-address">
      {linkToExplorer ? (
        <a
          href={`${STELLAR_EXPERT_BASE}/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View account ${address} on Stellar Expert`}
          className="velox-address__link"
        >
          {displayAddress}
        </a>
      ) : (
        <span aria-label={`Stellar address: ${address}`}>{displayAddress}</span>
      )}

      <button
        onClick={copyToClipboard}
        aria-label="Copy address to clipboard"
        className="velox-address__copy"
        title={copied ? 'Copied!' : 'Copy address'}
      >
        {copied ? '✓' : '⎘'}
      </button>
    </span>
  );
}
