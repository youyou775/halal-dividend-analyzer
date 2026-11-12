import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Treats null, undefined, AND NaN as "no value". This distinction matters
 * specifically because `JSON.stringify` (used by `NextResponse.json()` in
 * the API route) silently converts NaN to null — a value computed as NaN
 * server-side (e.g. from cagrOverSeries/averageOverWindow below, when a
 * window of history isn't available) arrives in the browser as `null`, not
 * NaN. A check that only tests `Number.isNaN(value)` passes that null
 * straight through to `.toFixed()`, which throws. Every formatter here, and
 * any other code reading one of these "might not have enough history"
 * fields, should treat them as equivalent — use this rather than a bare
 * `Number.isNaN()` check.
 */
export function isMissing(value: number | null | undefined): value is null | undefined {
  return value === null || value === undefined || Number.isNaN(value);
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (isMissing(value)) return '—';
  return `${value!.toFixed(decimals)}%`;
}

export function formatMultiple(value: number | null | undefined): string {
  if (isMissing(value)) return '—';
  return `${value!.toFixed(2)}x`;
}

export function formatCompactBillions(value: number | null | undefined): string {
  if (isMissing(value)) return '—';
  return `$${value!.toFixed(1)}B`;
}

export function formatCurrency(value: number | null | undefined): string {
  if (isMissing(value)) return '—';
  return `$${value!.toFixed(2)}`;
}

export function average(values: number[]): number {
  const valid = values.filter((v) => typeof v === 'number' && !Number.isNaN(v) && v !== 0);
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/** CAGR between two same-sign positive values over `years` periods. */
export function cagr(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * CAGR from `growthYears` periods ago to the most recent entry in an
 * ascending-by-time series, via `getValue`. Returns NaN — never a silently
 * shorter span — if the series doesn't actually have `growthYears + 1`
 * entries. This is what stops "5yr" and "10yr" figures from collapsing to
 * the identical number when there isn't enough history: the old pattern of
 * `Math.min(5, series.length - 1)` would use the same short span for both
 * labels once the series ran shallow. Callers should route the result
 * through formatPercent/formatMultiple/formatNumber, which already render
 * NaN as "—".
 *
 * CONVENTION used throughout this project: an "N-year" figure means N data
 * points (N-1 growth periods), not N+1 points — so "5yr CAGR" calls this
 * with growthYears=4 (needs 5 points) and "10yr CAGR" calls it with
 * growthYears=9 (needs 10 points), consistently. This is a deliberate
 * choice, not the only valid one (comparing to a value exactly 5 calendar
 * years back would need 6 points) — it was chosen because annual
 * fundamentals data is often scarce (see lib/1.api/yahoo-api.ts's quarterly
 * depth-extension fallback), and "N data points available = N-year figure"
 * surfaces a real number more often than requiring N+1. Keep both window
 * sizes on this same convention if you touch this — a mismatch (e.g. 5yr
 * needing 6 points while 10yr needs 10) is the exact bug this helper was
 * introduced to prevent.
 */
export function cagrOverSeries<T>(series: T[], growthYears: number, getValue: (item: T) => number): number {
  if (series.length - 1 < growthYears) return NaN;
  const start = getValue(series[series.length - 1 - growthYears]);
  const end = getValue(series[series.length - 1]);
  return cagr(start, end, growthYears);
}

/** Average of the most recent `window` entries, or NaN if the series doesn't
 * actually have that many — same rationale as cagrOverSeries. */
export function averageOverWindow(values: number[], window: number): number {
  if (values.length < window) return NaN;
  return average(values.slice(-window));
}

export function formatNumber(value: number | null | undefined, decimals = 1): string {
  if (isMissing(value)) return '—';
  return value!.toFixed(decimals);
}

/** Finds the price history point closest to a given date — used to match each
 * fiscal year's EPS to its actual period-end price for a real PE-by-year series. */
export function closestPrice(priceHistory: { date: string; close: number }[], target: Date): number {
  if (!priceHistory.length) return 0;
  let best = priceHistory[0];
  let bestDiff = Math.abs(new Date(priceHistory[0].date).getTime() - target.getTime());
  for (const p of priceHistory) {
    const diff = Math.abs(new Date(p.date).getTime() - target.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      best = p;
    }
  }
  return best.close;
}