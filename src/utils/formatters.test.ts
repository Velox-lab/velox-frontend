import {
  formatTokenAmount,
  formatStreamRate,
  truncateStellarAddress,
  formatTimestamp,
  calculateStreamPercentage,
  formatDuration,
} from './formatters';

describe('formatTokenAmount', () => {
  it('formats a whole number correctly', () => {
    expect(formatTokenAmount(10_000_000n, 'XLM')).toBe('1.0000000 XLM');
  });

  it('formats zero correctly', () => {
    expect(formatTokenAmount(0n, 'XLM')).toBe('0.0000000 XLM');
  });

  it('formats a fractional amount correctly', () => {
    expect(formatTokenAmount(5_000_000n, 'USDC')).toBe('0.5000000 USDC');
  });

  it('includes the asset code in output', () => {
    expect(formatTokenAmount(10_000_000n, 'EURC')).toContain('EURC');
  });

  it('handles unknown asset codes using default decimals', () => {
    const result = formatTokenAmount(10_000_000n, 'CUSTOM');
    expect(result).toContain('CUSTOM');
  });
});

describe('formatStreamRate', () => {
  it('converts rate per second to per hour', () => {
    // 1_000_000 stroops/sec * 3600 = 3_600_000_000 stroops/hour = 360 XLM/hour
    expect(formatStreamRate(1_000_000n, 'XLM')).toContain('/hour');
  });

  it('includes the asset code', () => {
    expect(formatStreamRate(100n, 'USDC')).toContain('USDC');
  });
});

describe('truncateStellarAddress', () => {
  it('truncates a long address to GABC...WXYZ format', () => {
    expect(truncateStellarAddress('GABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe('GABC...WXYZ');
  });

  it('returns the full address if it is short enough', () => {
    expect(truncateStellarAddress('GABCD')).toBe('GABCD');
  });

  it('respects custom visibleChars parameter', () => {
    const result = truncateStellarAddress('GABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
    expect(result).toBe('GABCDE...UVWXYZ');
  });
});

describe('formatTimestamp', () => {
  it('returns a non-empty string for a valid timestamp', () => {
    const result = formatTimestamp(1720000000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('calculateStreamPercentage', () => {
  it('returns 50 when half is streamed', () => {
    expect(calculateStreamPercentage(500n, 1000n)).toBe(50);
  });

  it('returns 0 when nothing is streamed', () => {
    expect(calculateStreamPercentage(0n, 1000n)).toBe(0);
  });

  it('returns 100 when fully streamed', () => {
    expect(calculateStreamPercentage(1000n, 1000n)).toBe(100);
  });

  it('clamps to 100 when streamed exceeds total', () => {
    expect(calculateStreamPercentage(2000n, 1000n)).toBe(100);
  });

  it('returns 0 when total is zero', () => {
    expect(calculateStreamPercentage(0n, 0n)).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('formats hours, minutes and seconds', () => {
    expect(formatDuration(3661)).toBe('1h 1m 1s');
  });

  it('formats days', () => {
    expect(formatDuration(86400)).toBe('1d');
  });

  it('returns 0s for zero duration', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});
