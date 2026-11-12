import type { StockData } from '../6.types/types';
import type { RawYahooData } from '../1.api/yahoo-api';
import { screenDividend } from '../4.screening/screening';
import { cagrOverSeries, average } from '../5.utils/utils';
import { FundamentalsTools } from '../3.tools/fundamentals-tools';
import { MarketTools } from '../3.tools/market-tools';

type DividendFields = Pick<
  StockData,
  | 'annualDividend'
  | 'payoutRatio'
  | 'dividendGrowthStreak'
  | 'dividendHistory'
  | 'dividendCAGR5Y'
  | 'dividendCAGR10Y'
  | 'estimatedDividendGrowth5Y'
  | 'fcfCoverage5Y'
  | 'fcfCoverage10Y'
  | 'fcfCAGR5Y'
  | 'fcfCAGR10Y'
  | 'fcfByYear'
  | 'isDividendHealthy'
  | 'dividendStatus'
  | 'dividendReasons'
>;

/** Consecutive years (most recent first) where the dividend was maintained or raised.
 * "Maintained" here means "years of uninterrupted payment," not strictly "years of
 * increase" — see README for why that distinction matters for this field's semantics. */
function computeStreak(annual: { year: string; amount: number }[]): number {
  let streak = annual.length ? 1 : 0;
  for (let i = annual.length - 1; i > 0; i--) {
    if (annual[i].amount >= annual[i - 1].amount * 0.999) streak++;
    else break;
  }
  return Math.max(0, streak - 1);
}

/**
 * Feeds components/stock/dividend/ (index + DividendCard + DividendGrowthSection).
 * Converts what this page needs out of Yahoo's raw response: per-year
 * dividend totals via MarketTools, free cash flow and dividends paid via
 * FundamentalsTools, and the payout ratio straight from quoteSummary.
 */
export function computeDividendData(raw: RawYahooData): DividendFields {
  const detail = raw.summary?.summaryDetail ?? {};
  const payoutRatio = (detail.payoutRatio ?? 0) * 100;
  const annualDividends = MarketTools.annualDividends(raw.chart);
  const periods = FundamentalsTools.annualPeriods(raw);

  const dividendGrowthStreak = computeStreak(annualDividends);
  const dividendCAGR5Y = cagrOverSeries(annualDividends, 4, (d) => d.amount);
  const dividendCAGR10Y = cagrOverSeries(annualDividends, 9, (d) => d.amount);

  // FCF coverage = |free cash flow / dividends paid|, averaged per-year over
  // the window (so 5yr and 10yr genuinely differ, rather than both echoing
  // one TTM snapshot). Returns NaN — not a shorter-window substitute — if
  // the window isn't actually available.
  const coverageOverWindow = (n: number): number => {
    if (periods.length < n) return NaN;
    const ratios = periods
      .slice(-n)
      .map((p) => (p.dividendsPaid ? Math.abs(p.freeCashFlow / p.dividendsPaid) : 0))
      .filter((v) => v > 0);
    return ratios.length ? average(ratios) : NaN;
  };
  const fcfCoverage5Y = coverageOverWindow(5);
  const fcfCoverage10Y = coverageOverWindow(10);

  const fcfCAGR5Y = cagrOverSeries(periods, 4, (p) => p.freeCashFlow);
  const fcfCAGR10Y = cagrOverSeries(periods, 9, (p) => p.freeCashFlow);

  const dividend = screenDividend({
    payoutRatio,
    fcfCoverage5Y: Number.isNaN(fcfCoverage5Y) ? 0 : fcfCoverage5Y,
    dividendCAGR5Y: Number.isNaN(dividendCAGR5Y) ? 0 : dividendCAGR5Y,
    fcfCAGR5Y: Number.isNaN(fcfCAGR5Y) ? 0 : fcfCAGR5Y,
  });

  // This is the "dividends paid vs. FCF" chart's data.
  const fcfByYear = periods.map((p) => ({
    year: p.year,
    fcf: p.freeCashFlow / 1e9,
    dividendsPaid: p.dividendsPaid / 1e9,
  }));

  return {
    annualDividend: detail.trailingAnnualDividendRate ?? 0,
    payoutRatio,
    dividendGrowthStreak,
    dividendHistory: annualDividends.slice(-10).map((d) => ({ date: d.year, amount: d.amount })),
    dividendCAGR5Y,
    dividendCAGR10Y,
    estimatedDividendGrowth5Y: dividendCAGR5Y,

    fcfCoverage5Y,
    fcfCoverage10Y,
    fcfCAGR5Y,
    fcfCAGR10Y,
    fcfByYear,

    isDividendHealthy: dividend.isHealthy,
    dividendStatus: dividend.status,
    dividendReasons: dividend.reasons,
  };
}