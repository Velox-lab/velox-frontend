/**
 * formatters.ts — pure utility functions for formatting values for display.
 *
 * Single responsibility: transform raw values into human-readable strings.
 * No side effects, no network calls, no React dependencies.
 */

/** Number of decimal places for common Stellar assets. */
const ASSET_DECIMALS: Record<string, number> = {
  XLM: 7,
  USDC: 7,
  EURC: 7,
};

const DEFAULT_DECIMALS = 7;

/**
 * Format a raw token amount (in stroops/base units) into a human-readable string.
 * Example: formatTokenAmount(10_000_000n, 'XLM') → '1.0000000 XLM'
 */
export function formatTokenAmount(amount: bigint, assetCode: string): string {
  const decimals = ASSET_DECIMALS[assetCode] ?? DEFAULT_DECIMALS;
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0');
  return `${whole}.${fractionStr} ${assetCode}`;
}

/**
 * Format a rate per second into a human-readable per-hour or per-day string.
 * Example: formatStreamRate(1_000_000n, 'USDC') → '0.1000000 USDC/hour'
 */
export function formatStreamRate(ratePerSecond: bigint, assetCode: string): string {
  const ratePerHour = ratePerSecond * 3600n;
  return `${formatTokenAmount(ratePerHour, assetCode)}/hour`;
}

/**
 * Truncate a Stellar public key to GABC...WXYZ format.
 * Example: truncateStellarAddress('GABCDEFGHIJKLMNOPQRSTUVWXYZ') → 'GABC...WXYZ'
 */
export function truncateStellarAddress(address: string, visibleChars: number = 4): string {
  if (address.length <= visibleChars * 2) return address;
  return `${address.slice(0, visibleChars)}...${address.slice(-visibleChars)}`;
}

/**
 * Format a Unix timestamp (seconds) into a human-readable date string.
 * Example: formatTimestamp(1720000000) → 'Jul 3, 2024'
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculate the percentage of a stream that has been paid out.
 * Returns a number between 0 and 100, rounded to the nearest integer.
 */
export function calculateStreamPercentage(streamed: bigint, total: bigint): number {
  if (total === 0n) return 0;
  const ratio = Number((streamed * 10000n) / total) / 100;
  return Math.min(100, Math.max(0, Math.round(ratio)));
}

/**
 * Format a duration in seconds into a human-readable string.
 * Example: formatDuration(3661) → '1h 1m 1s'
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}
