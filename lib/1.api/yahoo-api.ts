import YahooFinance from 'yahoo-finance2';
import type { FundamentalsTimeSeriesResult } from 'yahoo-finance2/modules/fundamentalsTimeSeries';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/**
 * THE ONLY FILE THAT CALLS YAHOO — and it does nothing else. No renaming,
 * no merging, no filtering, no math: it returns what Yahoo returned.
 *
 * Turning these raw responses into numbers for each page happens in the page
 * files (lib/2.data/*.ts, one per components/stock/<page>/ page), using the reusable
 * conversion tools in lib/3.tools/. See ARCHITECTURE.md.
 *
 * Yahoo quirks worth knowing live next to the code that deals with them, in
 * lib/3.tools/fundamentals-tools.ts (field names, shallow history, fiscal
 * years that don't end in December, the incomplete current year).
 */

export interface RawStatements {
  financials: FundamentalsTimeSeriesResult[];
  balanceSheet: FundamentalsTimeSeriesResult[];
  cashFlow: FundamentalsTimeSeriesResult[];
}

/** Everything fetched for one symbol, exactly as Yahoo returned it. */
export interface RawYahooData {
  /** The symbol that was requested (Yahoo's own copy is in summary.price.symbol). */
  symbol: string;
  summary: any; // quoteSummary: assetProfile, summaryDetail, defaultKeyStatistics, financialData, price, recommendationTrend
  chart: any; // monthly quotes + dividend events
  annual: RawStatements;
  quarterly: RawStatements;
  news: any; // search() result
}

type StatementModule = 'financials' | 'balance-sheet' | 'cash-flow';

/** One fundamentals-time-series call, raw. Returns [] (and logs) instead of
 * throwing, so one failed statement doesn't discard everything else. */
async function fetchRawTimeSeries(
  symbol: string,
  module: StatementModule,
  type: 'annual' | 'quarterly',
  period1: string,
  period2: string
): Promise<FundamentalsTimeSeriesResult[]> {
  try {
    const raw = await yahooFinance.fundamentalsTimeSeries(symbol, { period1, period2, type, module });
    console.log(`[yahoo-api] raw sample (${type} ${module}):`, JSON.stringify(raw)?.slice(0, 1500));
    return raw;
  } catch (err) {
    console.warn(`[yahoo-api] fundamentalsTimeSeries(${symbol}, ${type}, ${module}) failed:`, err);
    return [];
  }
}

function fetchRawAnnualTimeSeries(symbol: string, module: StatementModule, period1: string, period2: string) {
  return fetchRawTimeSeries(symbol, module, 'annual', period1, period2);
}

/** Raw quarterly rows. Yahoo's annual history is often shallow, so the
 * converters use these to try to fill in older years (see FundamentalsTools). */
function fetchRawQuarterlyExtension(symbol: string, module: StatementModule, period1: string, period2: string) {
  return fetchRawTimeSeries(symbol, module, 'quarterly', period1, period2);
}

export async function fetchRawStockData(symbol: string): Promise<RawYahooData> {
  const now = new Date();
  const elevenYearsAgo = new Date(now);
  elevenYearsAgo.setFullYear(now.getFullYear() - 11);
  const period1 = elevenYearsAgo.toISOString().slice(0, 10);
  const period2 = now.toISOString().slice(0, 10);

  const [summary, chart, annualFin, annualBal, annualCash, quarterlyFin, quarterlyBal, quarterlyCash, news] = await Promise.all([
    yahooFinance.quoteSummary(symbol, {
      modules: ['assetProfile', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'price', 'recommendationTrend'] as any,
    }) as any,
    yahooFinance.chart(symbol, { period1: elevenYearsAgo, period2: now, interval: '1mo', events: 'div' } as any) as any,
    fetchRawAnnualTimeSeries(symbol, 'financials', period1, period2),
    fetchRawAnnualTimeSeries(symbol, 'balance-sheet', period1, period2),
    fetchRawAnnualTimeSeries(symbol, 'cash-flow', period1, period2),
    fetchRawQuarterlyExtension(symbol, 'financials', period1, period2),
    fetchRawQuarterlyExtension(symbol, 'balance-sheet', period1, period2),
    fetchRawQuarterlyExtension(symbol, 'cash-flow', period1, period2),
    yahooFinance.search(symbol, { newsCount: 2, quotesCount: 0 }).catch(() => ({ news: [] })),
  ]);

  if (!summary?.price) throw new Error(`No data found for \"${symbol}\"`);

  return {
    symbol,
    summary,
    chart,
    annual: { financials: annualFin, balanceSheet: annualBal, cashFlow: annualCash },
    quarterly: { financials: quarterlyFin, balanceSheet: quarterlyBal, cashFlow: quarterlyCash },
    news,
  };
}