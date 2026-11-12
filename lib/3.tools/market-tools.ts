import type { PricePoint } from '../6.types/types';

/**
 * Reusable converters for Yahoo's chart() response (monthly quotes plus
 * dividend events). Static methods — nothing to instantiate. Used by the
 * Overview and Sensitivity pages (prices) and Dividend and Sensitivity pages
 * (dividends).
 */
export class MarketTools {
  /** Monthly closes, oldest first, as { date: 'YYYY-MM-DD', close }. */
  static priceHistory(chart: any): PricePoint[] {
    return ((chart?.quotes ?? []) as any[])
      .filter((q) => q.close != null)
      .map((q) => ({ date: new Date(q.date).toISOString().slice(0, 10), close: q.close }));
  }

  /**
   * Per-calendar-year dividend totals, oldest first. The current year is
   * excluded: a partial year's total reads as an artificial cut next to full
   * prior years and would corrupt the CAGR and streak calculations.
   */
  static annualDividends(chart: any): { year: string; amount: number }[] {
    const events = (chart?.events?.dividends ?? []) as { amount: number; date: Date | number }[];
    const currentYear = new Date().getFullYear();
    const totals = new Map<string, number>();
    for (const e of Object.values(events)) {
      const date = e.date instanceof Date ? e.date : new Date(Number(e.date) * 1000);
      const year = date.getFullYear();
      if (year === currentYear) continue;
      totals.set(String(year), (totals.get(String(year)) ?? 0) + (e.amount ?? 0));
    }
    return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([year, amount]) => ({ year, amount }));
  }
}