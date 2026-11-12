import type { StockData, HistoricalReturnPoint } from '../6.types/types';
import type { RawYahooData } from '../1.api/yahoo-api';
import { cagrOverSeries, averageOverWindow, closestPrice } from '../5.utils/utils';
import { FundamentalsTools } from '../3.tools/fundamentals-tools';
import { MarketTools } from '../3.tools/market-tools';

type SensitivityFields = Pick<
  StockData,
  | 'ttmPE'
  | 'avgPE5Y'
  | 'avgPE10Y'
  | 'peByYear'
  | 'peVsAvg'
  | 'ttmEPS'
  | 'epsCAGR5Y'
  | 'epsCAGR10Y'
  | 'estimatedFairValue'
  | 'estimatedPE'
  | 'estimatedEPSGrowth5Y'
  | 'historicalReturns'
>;

/**
 * Feeds components/stock/sensitivity/. Converts what this page needs
 * out of Yahoo's raw response: EPS by year via FundamentalsTools, prices and
 * dividends via MarketTools, and the current PE / EPS / analyst target
 * straight from quoteSummary.
 */
export function computeSensitivityData(raw: RawYahooData): SensitivityFields {
  const detail = raw.summary?.summaryDetail ?? {};
  const keyStats = raw.summary?.defaultKeyStatistics ?? {};
  const financialData = raw.summary?.financialData ?? {};
  const trailingPE: number = detail.trailingPE ?? 0;
  const trailingEps: number = keyStats.trailingEps ?? 0;
  const targetMeanPrice: number = financialData.targetMeanPrice ?? 0;

  const periods = FundamentalsTools.annualPeriods(raw);
  const priceHistory = MarketTools.priceHistory(raw.chart);
  const annualDividends = MarketTools.annualDividends(raw.chart);

  // Real PE-by-year: match each fiscal year-end to the closest month-end
  // price (using the period's *actual* end date, not an assumed Dec 31 —
  // see FiscalPeriod.periodDate's doc comment), rather than repeating the
  // current PE across years.
  const epsByYear = periods.map((p) => ({
    year: p.year,
    eps: p.dilutedEPS,
    price: closestPrice(priceHistory, p.periodDate),
  }));
  const peByYear = epsByYear.map((e) => ({ year: e.year, pe: e.eps > 0 ? e.price / e.eps : 0 }));
  const peValues = peByYear.map((p) => p.pe).filter((v) => v > 0);
  const avgPE5Y = averageOverWindow(peValues, 5);
  const avgPE10Y = averageOverWindow(peValues, 10);
  const ttmPE = trailingPE || peValues[peValues.length - 1] || 0;
  const peVsAvg = avgPE10Y ? ((ttmPE - avgPE10Y) / avgPE10Y) * 100 : 0;

  const epsCAGR5Y = cagrOverSeries(epsByYear, 4, (e) => e.eps);
  const epsCAGR10Y = cagrOverSeries(epsByYear, 9, (e) => e.eps);

  const estimatedPE = avgPE10Y || ttmPE;
  const estimatedEPSGrowth5Y = epsCAGR5Y;
  const ttmEPS = trailingEps || epsByYear[epsByYear.length - 1]?.eps || 0;
  // Prefer analyst consensus (targetMeanPrice) when available; otherwise a
  // simple forward-earnings model (normalized PE x next-year EPS). Swap in a
  // different methodology here (e.g. a DCF) if one becomes available.
  const estimatedFairValue = targetMeanPrice || estimatedPE * ttmEPS;

  // Total-return and compounded-return series across the same window as
  // everything else, pairing each year's price move with that year's
  // per-share dividend.
  const historicalReturns: HistoricalReturnPoint[] = epsByYear.map((e, i) => {
    const prevPrice = i > 0 ? epsByYear[i - 1].price : null;
    const dividendPerShare = annualDividends.find((d) => Number(d.year) === e.year)?.amount ?? 0;
    const totalReturnPct = prevPrice ? ((e.price - prevPrice + dividendPerShare) / prevPrice) * 100 : 0;
    return {
      year: e.year,
      eps: e.eps,
      pe: e.eps > 0 ? e.price / e.eps : 0,
      price: e.price,
      dividendPerShare,
      totalReturnPct,
      compoundedReturnPct: 0,
    };
  });
  let compounding = 1;
  for (let i = 0; i < historicalReturns.length; i++) {
    if (i > 0) compounding *= 1 + historicalReturns[i].totalReturnPct / 100;
    historicalReturns[i].compoundedReturnPct = (compounding - 1) * 100;
  }

  return {
    ttmPE,
    avgPE5Y,
    avgPE10Y,
    peByYear,
    peVsAvg,
    ttmEPS,
    epsCAGR5Y,
    epsCAGR10Y,
    estimatedFairValue,
    estimatedPE,
    estimatedEPSGrowth5Y,
    historicalReturns,
  };
}