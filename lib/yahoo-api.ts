import YahooFinance from 'yahoo-finance2';
import type { StockData, FinancialStatement, PricePoint, ProfitabilityYearPoint, HistoricalReturnPoint } from './types';
import { screenHalal, screenDividend } from './screening';
import { buildMockStock } from './mock-data';
import { cagr, average } from './utils';

// v3's default export is a class — instantiate once and reuse across requests.
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/**
 * NOTE ON API STABILITY
 * yahoo-finance2 wraps Yahoo Finance's unofficial, undocumented endpoints —
 * the same underlying data source the original brief explicitly avoided
 * (via yfinance) over ToS concerns. See the README for that tradeoff. This
 * file cannot be exercised against live Yahoo endpoints from the sandbox
 * that built it, so it leans on defensive parsing and console diagnostics
 * rather than assuming any one shape is correct.
 *
 * fundamentalsTimeSeries specifically: the library's own type signature
 * returns it as `Promise<any>` — i.e. no schema validation happens, so
 * "what shape does this actually come back in" is a real unknown rather
 * than something the library's docs settle. Two shapes are both plausible
 * and handled below: (a) one object per fiscal year with plain `annualXxx`
 * numeric fields, or (b) Yahoo's raw per-field shape, where each requested
 * field is its own array of `{ asOfDate, reportedValue: { raw, fmt } }`
 * entries. `normalizeFundamentals()` below handles both. If a section is
 * still wrong, check the server log for `[yahoo-api] raw sample` — it dumps
 * the actual shape for one call so the exact field names can be confirmed
 * instead of guessed again.
 */

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Finds the price history point closest to a given date (for building a real PE-by-year series). */
function closestPrice(priceHistory: PricePoint[], target: Date): number {
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

/** Aggregates raw dividend payments into per-calendar-year totals, ascending by year. */
function toAnnualDividends(events: Record<string, { amount: number; date: Date | number }>): { year: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const key of Object.keys(events ?? {})) {
    const e = events[key];
    const date = e.date instanceof Date ? e.date : new Date(Number(e.date) * 1000);
    const year = String(date.getFullYear());
    totals.set(year, (totals.get(year) ?? 0) + (e.amount ?? 0));
  }
  return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([year, amount]) => ({ year, amount }));
}

/** Consecutive years (most recent first) where the dividend was maintained or raised. */
function computeStreak(annual: { year: string; amount: number }[]): number {
  let streak = annual.length ? 1 : 0;
  for (let i = annual.length - 1; i > 0; i--) {
    if (annual[i].amount >= annual[i - 1].amount * 0.999) streak++;
    else break;
  }
  return Math.max(0, streak - 1);
}

function unwrapValue(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object') {
    if (typeof v.raw === 'number') return v.raw;
    if (v.raw && typeof v.raw.raw === 'number') return v.raw.raw;
  }
  return 0;
}

function yearFromEntry(entry: any): number | null {
  const raw = entry?.date ?? entry?.asOfDate;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
}

/**
 * Normalizes a fundamentalsTimeSeries response into { year -> { field: number } },
 * handling both a per-period-object shape and Yahoo's raw per-field shape.
 */
function normalizeFundamentals(raw: any): Map<number, Record<string, number>> {
  const yearMap = new Map<number, Record<string, number>>();

  let arr: any = raw;
  if (arr && !Array.isArray(arr)) {
    arr = arr.timeseries?.result ?? arr.result ?? arr;
  }
  if (!Array.isArray(arr)) return yearMap;

  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;

    const dataKeys = Object.keys(item).filter((k) => !['date', 'meta', 'timestamp'].includes(k));

    // Shape A: one object per fiscal year, with plain numeric `annualXxx` fields directly on it.
    if (item.date && dataKeys.some((k) => typeof item[k] === 'number' || (item[k] && typeof item[k] === 'object' && 'raw' in item[k]))) {
      const year = yearFromEntry(item);
      if (year == null) continue;
      const existing = yearMap.get(year) ?? {};
      for (const key of dataKeys) existing[key] = unwrapValue(item[key]);
      yearMap.set(year, existing);
      continue;
    }

    // Shape B: one object per FIELD, holding an array of { asOfDate, reportedValue } across periods.
    for (const key of dataKeys) {
      const value = item[key];
      if (!Array.isArray(value)) continue;
      for (const point of value) {
        const year = yearFromEntry(point);
        if (year == null) continue;
        const existing = yearMap.get(year) ?? {};
        existing[key] = unwrapValue(point.reportedValue ?? point.value ?? point);
        yearMap.set(year, existing);
      }
    }
  }

  return yearMap;
}

/** Multiple plausible field-name candidates per line item, tried in order. */
const FIELD_CANDIDATES: Record<string, string[]> = {
  totalRevenue: ['annualTotalRevenue', 'totalRevenue', 'trailingTotalRevenue'],
  grossProfit: ['annualGrossProfit', 'grossProfit', 'trailingGrossProfit'],
  operatingIncome: ['annualOperatingIncome', 'operatingIncome', 'trailingOperatingIncome'],
  netIncome: ['annualNetIncome', 'netIncome', 'trailingNetIncome', 'annualNetIncomeCommonStockholders'],
  ebitda: ['annualEBITDA', 'annualEbitda', 'EBITDA', 'ebitda', 'trailingEBITDA'],
  dilutedEPS: ['annualDilutedEPS', 'dilutedEPS', 'annualDilutedEps', 'trailingDilutedEPS'],
  basicEPS: ['annualBasicEPS', 'basicEPS', 'annualBasicEps', 'trailingBasicEPS'],
  totalAssets: ['annualTotalAssets', 'totalAssets'],
  totalLiabilities: ['annualTotalLiabilitiesNetMinorityInterest', 'totalLiabilitiesNetMinorityInterest', 'annualTotalLiab', 'totalLiab'],
  totalDebt: ['annualTotalDebt', 'totalDebt'],
  stockholdersEquity: ['annualStockholdersEquity', 'stockholdersEquity', 'annualCommonStockEquity', 'commonStockEquity'],
  cashAndEquivalents: [
    'annualCashAndCashEquivalents',
    'cashAndCashEquivalents',
    'annualCashCashEquivalentsAndShortTermInvestments',
    'cashCashEquivalentsAndShortTermInvestments',
  ],
  operatingCashFlow: ['annualOperatingCashFlow', 'operatingCashFlow', 'annualCashFlowFromContinuingOperatingActivities'],
  capitalExpenditure: ['annualCapitalExpenditure', 'capitalExpenditure'],
  freeCashFlow: ['annualFreeCashFlow', 'freeCashFlow'],
  cashDividendsPaid: ['annualCashDividendsPaid', 'cashDividendsPaid', 'annualCommonStockDividendPaid', 'commonStockDividendPaid'],
  repurchaseOfCapitalStock: ['annualRepurchaseOfCapitalStock', 'repurchaseOfCapitalStock', 'annualCommonStockPayments'],
};

function pickField(period: Record<string, number>, base: keyof typeof FIELD_CANDIDATES): number {
  for (const key of FIELD_CANDIDATES[base]) {
    const v = period[key];
    if (typeof v === 'number' && v !== 0) return v;
  }
  return 0;
}

/** Fetches + normalizes one annual fundamentals-time-series module; never throws. */
async function fetchAnnualTimeSeries(
  symbol: string,
  module: 'financials' | 'balance-sheet' | 'cash-flow',
  period1: string,
  period2: string
): Promise<Map<number, Record<string, number>>> {
  try {
    const raw = await yahooFinance.fundamentalsTimeSeries(symbol, { period1, period2, type: 'annual', module } as any);
    console.log(`[yahoo-api] raw sample (${module}):`, JSON.stringify(raw)?.slice(0, 1500));
    const normalized = normalizeFundamentals(raw);
    if (normalized.size === 0) {
      console.warn(`[yahoo-api] fundamentalsTimeSeries(${symbol}, module: '${module}') normalized to 0 periods`);
    }
    return normalized;
  } catch (err) {
    console.warn(`[yahoo-api] fundamentalsTimeSeries(${symbol}, module: '${module}') failed:`, err);
    return new Map();
  }
}

export async function getStockData(symbol: string): Promise<{ data: StockData; isSample: boolean }> {
  try {
    const now = new Date();
    const elevenYearsAgo = new Date(now);
    elevenYearsAgo.setFullYear(now.getFullYear() - 11);
    const period1 = toIsoDate(elevenYearsAgo);
    const period2 = toIsoDate(now);

    const [summary, chart, financialsMap, balanceMap, cashflowMap, newsResult] = await Promise.all([
      yahooFinance.quoteSummary(symbol, {
        modules: ['assetProfile', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'price', 'recommendationTrend', 'earnings'] as any,
      }) as any,
      yahooFinance.chart(symbol, {
        period1: elevenYearsAgo,
        period2: now,
        interval: '1mo',
        events: 'div',
      } as any) as any,
      fetchAnnualTimeSeries(symbol, 'financials', period1, period2),
      fetchAnnualTimeSeries(symbol, 'balance-sheet', period1, period2),
      fetchAnnualTimeSeries(symbol, 'cash-flow', period1, period2),
      yahooFinance.search(symbol, { newsCount: 2, quotesCount: 0 }).catch(() => ({ news: [] })),
    ]);

    if (!summary?.price) throw new Error(`No data found for "${symbol}"`);

    const profile = summary.assetProfile ?? {};
    const price = summary.price ?? {};
    const summaryDetail = summary.summaryDetail ?? {};
    const keyStats = summary.defaultKeyStatistics ?? {};
    const financialData = summary.financialData ?? {};

    const priceHistory: PricePoint[] = ((chart?.quotes ?? []) as any[])
      .filter((q) => q.close != null)
      .map((q) => ({ date: new Date(q.date).toISOString().slice(0, 10), close: q.close }));

    // Merge the three per-module maps by fiscal year.
    const yearMap = new Map<number, Record<string, number>>();
    for (const m of [financialsMap, balanceMap, cashflowMap]) {
      for (const [year, fields] of m.entries()) {
        yearMap.set(year, { ...(yearMap.get(year) ?? {}), ...fields });
      }
    }
    const periods = [...yearMap.entries()].sort(([a], [b]) => a - b).slice(-10).map(([year, fields]) => ({ year, ...fields }));
    const yearStrs = periods.map((p) => String(p.year));
    const latestPeriod = periods[periods.length - 1] ?? {};

    if (periods.length === 0) {
      console.warn(`[yahoo-api] No merged fundamentals periods for ${symbol} — statements, FCF coverage, EPS CAGR, and PE-by-year will be empty. Check the raw sample logs above.`);
    }

    const latestTotalAssets = pickField(latestPeriod, 'totalAssets');
    const debtRatio = latestTotalAssets ? (pickField(latestPeriod, 'totalDebt') / latestTotalAssets) * 100 : 0;

    // No mainstream API (Yahoo included) exposes a clean "% haram earnings"
    // field — see README for the standard non-permissible-income screen this
    // would approximate, and why it's left at 0 rather than guessed here.
    const haramEarningsRatio = 0;

    const halal = screenHalal({
      sector: profile.sector ?? 'Unknown',
      industry: profile.industry ?? '',
      debtRatio,
      haramEarningsRatio,
    });

    const dividendEvents = (chart?.events?.dividends ?? {}) as Record<string, { amount: number; date: Date | number }>;
    const annualDividends = toAnnualDividends(dividendEvents);
    const dividendGrowthStreak = computeStreak(annualDividends);
    const dividendYield = (summaryDetail.dividendYield ?? 0) * 100;
    const payoutRatio = (summaryDetail.payoutRatio ?? 0) * 100;

    const lastDividend = annualDividends[annualDividends.length - 1]?.amount ?? 0;
    const divSpan5 = Math.min(5, annualDividends.length - 1);
    const dividendCAGR5Y =
      divSpan5 > 0 ? cagr(annualDividends[annualDividends.length - 1 - divSpan5]?.amount ?? 0, lastDividend, divSpan5) : 0;
    const dividendCAGR10Y =
      annualDividends.length > 1 ? cagr(annualDividends[0]?.amount ?? 0, lastDividend, annualDividends.length - 1) : 0;

    // FCF coverage = |free cash flow / dividends paid|, averaged per-year over
    // the window (so 5yr and 10yr genuinely differ, rather than both echoing
    // one TTM snapshot).
    const coverageOverWindow = (n: number) => {
      const ratios = periods
        .slice(-n)
        .map((p) => {
          const dividends = pickField(p, 'cashDividendsPaid');
          return dividends ? Math.abs(pickField(p, 'freeCashFlow') / dividends) : 0;
        })
        .filter((v) => v > 0);
      return average(ratios);
    };
    const fcfCoverage5Y = coverageOverWindow(5);
    const fcfCoverage10Y = coverageOverWindow(10);

    const dividend = screenDividend({ dividendYield, payoutRatio, fcfCoverage5Y, dividendGrowthStreak, dividendCAGR5Y });

    // Real PE-by-year: match each fiscal year-end to the closest month-end
    // price, rather than repeating the current PE across years.
    const epsByYear = periods.map((p) => ({
      year: p.year,
      eps: pickField(p, 'dilutedEPS') || pickField(p, 'basicEPS'),
      price: closestPrice(priceHistory, new Date(p.year, 11, 31)),
    }));
    const peByYear = epsByYear.map((e) => ({ year: e.year, pe: e.eps > 0 ? e.price / e.eps : 0 }));
    const peValues = peByYear.map((p) => p.pe).filter((v) => v > 0);
    const avgPE5Y = average(peValues.slice(-5));
    const avgPE10Y = average(peValues);
    const ttmPE = summaryDetail.trailingPE ?? peValues[peValues.length - 1] ?? 0;
    const peVsAvg = avgPE10Y ? ((ttmPE - avgPE10Y) / avgPE10Y) * 100 : 0;

    const epsSpan5 = Math.min(5, epsByYear.length - 1);
    const epsCAGR5Y =
      epsSpan5 > 0
        ? cagr(epsByYear[epsByYear.length - 1 - epsSpan5]?.eps ?? 0, epsByYear[epsByYear.length - 1]?.eps ?? 0, epsSpan5)
        : 0;
    const epsCAGR10Y =
      epsByYear.length > 1 ? cagr(epsByYear[0]?.eps ?? 0, epsByYear[epsByYear.length - 1]?.eps ?? 0, epsByYear.length - 1) : 0;

    const fcfSpan5 = Math.min(5, periods.length - 1);
    const fcfCAGR5Y =
      fcfSpan5 > 0
        ? cagr(pickField(periods[periods.length - 1 - fcfSpan5] ?? {}, 'freeCashFlow'), pickField(latestPeriod, 'freeCashFlow'), fcfSpan5)
        : 0;

    const estimatedPE = avgPE10Y || ttmPE;
    const estimatedEPSGrowth5Y = epsCAGR5Y;
    const ttmEPS = keyStats.trailingEps ?? epsByYear[epsByYear.length - 1]?.eps ?? 0;
    const estimatedFairValue = financialData.targetMeanPrice ?? estimatedPE * ttmEPS;

    // Revenue/EPS-by-year, with a fallback to the (previously working)
    // quoteSummary `earnings` module if fundamentalsTimeSeries came back
    // empty or without revenue for this ticker.
    let revenueByYear = periods
      .map((p) => ({ year: p.year, revenue: pickField(p, 'totalRevenue') / 1e9, eps: pickField(p, 'dilutedEPS') || pickField(p, 'basicEPS') }))
      .filter((r) => r.revenue > 0);

    if (revenueByYear.length === 0) {
      const yearly = summary.earnings?.financialsChart?.yearly ?? [];
      const shares = keyStats.sharesOutstanding ?? 0;
      if (yearly.length > 0) {
        console.warn(`[yahoo-api] Using earnings.financialsChart fallback for revenue/EPS on ${symbol}`);
      }
      revenueByYear = yearly.map((e: any) => ({
        year: Number(e.date),
        revenue: (e.revenue ?? 0) / 1e9,
        eps: shares ? (e.earnings ?? 0) / shares : 0,
      }));
    }

    // This is the "dividends paid vs. FCF" chart's data — a prior version
    // accidentally used operating cash flow in place of free cash flow.
    const fcfByYear = periods.map((p) => ({
      year: p.year,
      fcf: pickField(p, 'freeCashFlow') / 1e9,
      dividendsPaid: Math.abs(pickField(p, 'cashDividendsPaid')) / 1e9,
    }));

    // --- Profitability tab ---
    const profitabilityByYear: ProfitabilityYearPoint[] = periods.map((p) => {
      const revenue = pickField(p, 'totalRevenue');
      const grossProfit = pickField(p, 'grossProfit');
      return {
        year: p.year,
        revenue: revenue / 1e9,
        costOfRevenue: (revenue - grossProfit) / 1e9,
        grossProfit: grossProfit / 1e9,
        netIncome: pickField(p, 'netIncome') / 1e9,
        eps: pickField(p, 'dilutedEPS') || pickField(p, 'basicEPS'),
        grossMargin: revenue ? (grossProfit / revenue) * 100 : 0,
      };
    });
    const revSpan5 = Math.min(5, periods.length - 1);
    const revenueCAGR5Y =
      revSpan5 > 0 ? cagr(pickField(periods[periods.length - 1 - revSpan5] ?? {}, 'totalRevenue'), pickField(latestPeriod, 'totalRevenue'), revSpan5) : 0;
    const revenueCAGR10Y =
      periods.length > 1 ? cagr(pickField(periods[0], 'totalRevenue'), pickField(latestPeriod, 'totalRevenue'), periods.length - 1) : 0;
    const netIncomeCAGR5Y =
      revSpan5 > 0 ? cagr(pickField(periods[periods.length - 1 - revSpan5] ?? {}, 'netIncome'), pickField(latestPeriod, 'netIncome'), revSpan5) : 0;
    const netIncomeCAGR10Y =
      periods.length > 1 ? cagr(pickField(periods[0], 'netIncome'), pickField(latestPeriod, 'netIncome'), periods.length - 1) : 0;
    const grossMarginAvg5Y = average(profitabilityByYear.slice(-5).map((p) => p.grossMargin));
    const grossMarginAvg10Y = average(profitabilityByYear.map((p) => p.grossMargin));
    const lastYearGrossMargin = profitabilityByYear[profitabilityByYear.length - 1]?.grossMargin ?? 0;

    // --- Sensitivity analysis tab ---
    // Reuses epsByYear (year/eps/price already matched above) plus each
    // year's per-share dividend to build a total-return and compounded-return
    // series across the same up-to-10-year window as everything else.
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

    const buildStatement = (fields: Record<string, keyof typeof FIELD_CANDIDATES>, divisor = 1e9): FinancialStatement => ({
      years: yearStrs,
      rows: Object.entries(fields).map(([metric, base]) => ({
        metric,
        values: Object.fromEntries(periods.map((p, i) => [yearStrs[i], Math.abs(pickField(p, base)) / divisor])),
      })),
    });

    const incomeStatement = buildStatement({
      'Total Revenue': 'totalRevenue',
      'Gross Profit': 'grossProfit',
      'Operating Income': 'operatingIncome',
      'Net Income': 'netIncome',
      EBITDA: 'ebitda',
    });
    const balanceSheet = buildStatement({
      'Total Assets': 'totalAssets',
      'Total Liabilities': 'totalLiabilities',
      'Total Debt': 'totalDebt',
      'Total Equity': 'stockholdersEquity',
      'Cash & Equivalents': 'cashAndEquivalents',
    });
    const cashFlow = buildStatement({
      'Operating Cash Flow': 'operatingCashFlow',
      'Capital Expenditures': 'capitalExpenditure',
      'Free Cash Flow': 'freeCashFlow',
      'Dividends Paid': 'cashDividendsPaid',
      'Share Buybacks': 'repurchaseOfCapitalStock',
    });

    const trend = summary.recommendationTrend?.trend?.[0] ?? {};
    const buckets = {
      buy: (trend.strongBuy ?? 0) + (trend.buy ?? 0),
      hold: trend.hold ?? 0,
      sell: (trend.sell ?? 0) + (trend.strongSell ?? 0),
    };
    const numberOfAnalysts = buckets.buy + buckets.hold + buckets.sell;
    const topBucket = (Object.entries(buckets).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'hold') as 'buy' | 'hold' | 'sell';
    const consensusLabel = topBucket === 'buy' ? 'Buy' : topBucket === 'sell' ? 'Sell' : 'Hold';

    const data: StockData = {
      symbol: price.symbol ?? symbol,
      name: price.longName ?? price.shortName ?? symbol,
      sector: profile.sector ?? 'Unknown',
      industry: profile.industry ?? 'Unknown',
      description: profile.longBusinessSummary ?? '',

      currentPrice: price.regularMarketPrice ?? 0,
      price52wHigh: summaryDetail.fiftyTwoWeekHigh ?? 0,
      price52wLow: summaryDetail.fiftyTwoWeekLow ?? 0,
      priceChangePct52w: price.regularMarketChangePercent ?? 0,
      priceHistory,

      dividendYield,
      dividendYieldChangeYoY: 0,
      annualDividend: summaryDetail.trailingAnnualDividendRate ?? 0,
      payoutRatio,
      dividendGrowthStreak,
      dividendHistory: annualDividends.slice(-8).map((d) => ({ date: d.year, amount: d.amount })),
      dividendCAGR5Y,
      dividendCAGR10Y,
      estimatedDividendGrowth5Y: dividendCAGR5Y,

      ttmPE,
      avgPE5Y,
      avgPE10Y,
      peByYear,
      peVsAvg,

      ttmEPS,
      epsCAGR5Y,
      epsCAGR10Y,
      revenueByYear,

      fcfCoverage5Y,
      fcfCoverage10Y,
      fcfCAGR5Y,
      fcfByYear,

      estimatedFairValue,
      estimatedPE,
      estimatedEPSGrowth5Y,

      isHalalCompliant: halal.isCompliant,
      halalReasons: halal.reasons,
      debtRatio,
      haramEarningsRatio,

      isDividendHealthy: dividend.isHealthy,
      dividendStatus: dividend.status,
      dividendReasons: dividend.reasons,

      analystRating: consensusLabel,
      analystConsensus: consensusLabel,
      numberOfAnalysts,

      incomeStatement,
      balanceSheet,
      cashFlow,

      recentNews: ((newsResult as any)?.news ?? []).slice(0, 2).map((n: any) => ({
        title: n.title,
        publisher: n.publisher ?? 'Unknown',
        date: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString().slice(0, 10) : '',
        url: n.link,
      })),
      stockSplits: [],

      profitabilityByYear,
      revenueCAGR5Y,
      revenueCAGR10Y,
      netIncomeCAGR5Y,
      netIncomeCAGR10Y,
      grossMarginAvg5Y,
      grossMarginAvg10Y,
      lastYearGrossMargin,

      historicalReturns,
    };

    return { data, isSample: false };
  } catch (err) {
    console.error('[yahoo-api] Falling back to sample data:', err);
    return { data: buildMockStock(symbol), isSample: true };
  }
}
