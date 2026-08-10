import React from 'react';

interface Props {
  /** Amount already streamed (in smallest token unit). */
  streamed: bigint;
  /** Total funded amount (in smallest token unit). */
  total: bigint;
  /** Animate the fill in real time. */
  animated?: boolean;
}

/**
 * StreamProgressBar — shows how much of a stream has been paid out vs remaining.
 *
 * Renders only. Receives pre-calculated values as props.
 */
export function StreamProgressBar({ streamed, total, animated = false }: Props) {
  const percentage = calculatePercentage(streamed, total);

  return (
    <div
      className="velox-progress"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percentage}% streamed`}
    >
      <div
        className={`velox-progress__fill ${animated ? 'velox-progress__fill--animated' : ''}`}
        style={{ width: `${percentage}%` }}
      />
      <span className="velox-progress__label">{percentage}%</span>
    </div>
  );
}

/** Calculate the percentage of total that has been streamed. Clamps 0–100. */
function calculatePercentage(streamed: bigint, total: bigint): number {
  if (total === 0n) return 0;
  const ratio = Number((streamed * 10000n) / total) / 100;
  return Math.min(100, Math.max(0, Math.round(ratio)));
}
