import { Stream } from '../../types';
import { AddressDisplay } from '../AddressDisplay/AddressDisplay';
import { StreamProgressBar } from '../StreamProgressBar/StreamProgressBar';
import { TokenAmountDisplay } from '../TokenAmountDisplay/TokenAmountDisplay';
import { formatStreamRate, truncateStellarAddress } from '../../utils/formatters';

interface Props {
  stream: Stream;
  /**
   * Display code for the stream's token, e.g. 'XLM' or 'USDC'. Resolving it
   * from stream.token (a contract address) would need a network call this
   * component doesn't make — pass it in from wherever the token's metadata
   * is already known. Falls back to a truncated contract address.
   */
  assetCode?: string;
}

const STATUS_LABEL: Record<Stream['status'], string> = {
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

/**
 * StreamCard — a single stream's summary: sender, recipient, funded vs
 * withdrawn, a progress bar, rate, and status.
 *
 * Renders only. Composed entirely from existing display primitives — no
 * formatting logic lives here that isn't already in one of them.
 */
export function StreamCard({ stream, assetCode }: Props) {
  const code = assetCode ?? truncateStellarAddress(stream.token);

  return (
    <div className="velox-stream-card" aria-label={`Stream ${stream.streamId}`}>
      <div className="velox-stream-card__header">
        <span
          className={`velox-stream-card__status velox-stream-card__status--${stream.status}`}
        >
          {STATUS_LABEL[stream.status]}
        </span>
        <span className="velox-stream-card__rate">{formatStreamRate(stream.ratePerSecond, code)}</span>
      </div>

      <dl className="velox-stream-card__parties">
        <div className="velox-stream-card__party">
          <dt>Sender</dt>
          <dd>
            <AddressDisplay address={stream.sender} />
          </dd>
        </div>
        <div className="velox-stream-card__party">
          <dt>Recipient</dt>
          <dd>
            <AddressDisplay address={stream.recipient} />
          </dd>
        </div>
      </dl>

      <StreamProgressBar
        streamed={stream.totalWithdrawn}
        total={stream.totalFunded}
        animated={stream.status === 'active'}
      />

      <div className="velox-stream-card__amounts">
        <span>
          <TokenAmountDisplay amount={stream.totalWithdrawn} assetCode={code} /> withdrawn
        </span>
        <span>
          of <TokenAmountDisplay amount={stream.totalFunded} assetCode={code} /> funded
        </span>
      </div>
    </div>
  );
}
