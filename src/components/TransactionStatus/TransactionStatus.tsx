import { Network } from '../../types';
import { truncateStellarAddress } from '../../utils/formatters';

export type TxState = 'pending' | 'submitted' | 'confirmed' | 'failed';

interface Props {
  status: TxState;
  /**
   * The transaction hash, once one exists. 'pending' often has none yet (a
   * transaction can be pending before it's even built/signed) — the link is
   * only rendered when a hash is given.
   */
  txHash?: string;
  /** Which Stellar Expert network to link into. Defaults to 'mainnet'. */
  network?: Network;
}

const STATUS_LABEL: Record<TxState, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  confirmed: 'Confirmed',
  failed: 'Failed',
};

const EXPLORER_NETWORK_SEGMENT: Record<Network, string> = {
  mainnet: 'public',
  testnet: 'testnet',
};

/**
 * TransactionStatus — shows a transaction's current state with a link to
 * Stellar Expert once a hash exists.
 *
 * Renders only. Tracking a transaction live (polling until it confirms or
 * fails) is a hook's job, not this component's — it just renders whatever
 * status it's given.
 */
export function TransactionStatus({ status, txHash, network = 'mainnet' }: Props) {
  return (
    <div className="velox-tx-status" aria-label={`Transaction ${status}`}>
      <span className={`velox-tx-status__badge velox-tx-status__badge--${status}`}>
        {STATUS_LABEL[status]}
      </span>

      {txHash && (
        <a
          href={`https://stellar.expert/explorer/${EXPLORER_NETWORK_SEGMENT[network]}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View transaction ${txHash} on Stellar Expert`}
          className="velox-tx-status__link"
        >
          {truncateStellarAddress(txHash)}
        </a>
      )}
    </div>
  );
}
