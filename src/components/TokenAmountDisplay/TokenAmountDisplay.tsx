import { formatTokenAmount } from '../../utils/formatters';

interface Props {
  /** Raw token amount in base units (stroops). */
  amount: bigint;
  /** Stellar asset code e.g. XLM, USDC. */
  assetCode: string;
  /** Optional CSS class for custom styling. */
  className?: string;
}

/**
 * TokenAmountDisplay — formats and renders a Stellar token amount.
 *
 * Renders only. Formatting logic lives in formatters.ts.
 * No network calls, no state, no side effects.
 */
export function TokenAmountDisplay({ amount, assetCode, className }: Props) {
  const formatted = formatTokenAmount(amount, assetCode);

  return (
    <span
      className={`velox-token-amount ${className ?? ''}`}
      aria-label={`${formatted}`}
    >
      {formatted}
    </span>
  );
}
