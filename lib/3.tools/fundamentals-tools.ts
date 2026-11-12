import type { FundamentalsTimeSeriesResult } from 'yahoo-finance2/modules/fundamentalsTimeSeries';
import type { FiscalPeriod } from '../6.types/types';
import type { RawStatements, RawYahooData } from '../1.api/yahoo-api';

type Fields = Record<string, number>;
interface Bucket {
  date: Date;
  fields: Fields;
}

/**
 * Yahoo statement fields this project reads, by how a quarter rolls up into a
 * year. Bare names (`totalRevenue`, not `annualTotalRevenue`) — the library's
 * own doc examples show prefixed names, but both the library's type
 * declarations and real AAPL logs show bare names.
 *
 * FLOW fields are amounts earned/spent during a period, so a year is the SUM
 * of its quarters. STOCK fields are balances at a point in time, so a year is
 * its LAST quarter's value.
 */
const FLOW_FIELDS = [
  'totalRevenue',
  'grossProfit',
  'operatingIncome',
  'netIncome',
  'EBITDA',
  'dilutedEPS',
  'basicEPS',
  'operatingCashFlow',
  'capitalExpenditure',
  'freeCashFlow',
  'commonStockDividendPaid',
  'cashDividendsPaid',
  'repurchaseOfCapitalStock',
];
const STOCK_FIELDS = ['totalAssets', 'totalLiabilitiesNetMinorityInterest', 'totalDebt', 'stockholdersEquity', 'cashAndCashEquivalents'];
const ALL_FIELDS = [...FLOW_FIELDS, ...STOCK_FIELDS];

/** First non-zero value among the given field names, else 0. */
function pick(f: Fields, ...names: string[]): number {
  for (const n of names) {
    const v = f[n];
    if (typeof v === 'number' && v !== 0) return v;
  }
  return 0;
}

/**
 * Reusable converters from Yahoo's raw fundamentals rows to FiscalPeriod[].
 * Static methods — nothing to instantiate. Every page file in lib/2.data/ that
 * needs statement numbers calls `FundamentalsTools.annualPeriods(raw)`.
 *
 * Things learned from real Yahoo responses, all handled here:
 *  - SHALLOW HISTORY. The annual call often returns only ~4 fiscal years even
 *    when 10 are requested. Quarterly rows are used to try to fill in older
 *    years (summing flow fields, taking the last quarter's balance fields).
 *    Confirmed to work mechanically, but it can only add what Yahoo has.
 *  - FISCAL YEARS DON'T END IN DECEMBER. AAPL's periods end Sept 30, so each
 *    period keeps its real end date (used to match EPS to the right price).
 *  - THE CURRENT YEAR IS INCOMPLETE. Quarters assembled for the in-progress
 *    year are a partial total that reads as a fake dip, so the current
 *    calendar year is excluded.
 *  - SIGNS. Yahoo reports capex, dividends paid and buybacks as negatives;
 *    dividends and buybacks come out here as positive amounts.
 */
export class FundamentalsTools {
  /** Conversion runs once per request even though several page files ask for it. */
  private static cache = new WeakMap<RawYahooData, FiscalPeriod[]>();

  /** Up to 10 complete fiscal years, oldest first. */
  static annualPeriods(raw: RawYahooData): FiscalPeriod[] {
    const cached = FundamentalsTools.cache.get(raw);
    if (cached) return cached;

    const annual = FundamentalsTools.mergeByYear(FundamentalsTools.toBuckets(raw.annual));
    const annualCount = annual.size;

    const extension = FundamentalsTools.aggregateQuarters(FundamentalsTools.toBuckets(raw.quarterly), new Set(annual.keys()));
    for (const [year, bucket] of extension) annual.set(year, bucket);

    const currentYear = new Date().getFullYear();
    if (annual.has(currentYear)) {
      console.log(`[fundamentals-tools] ${raw.symbol}: excluding ${currentYear} (current year, likely in
`);
      annual.delete(currentYear);
    }

    const years = [...annual.keys()].sort((a, b) => a - b);
    const capped = years.slice(-10);
    const result = capped.map((year) => FundamentalsTools.toFiscalPeriod(year, annual.get(year)!));
    FundamentalsTools.cache.set(raw, result);
    return result;
  }
  static toBuckets(statements: RawStatements): Bucket[] {
    const byDate = new Map<number, Bucket>();
    const rows: FundamentalsTimeSeriesResult[] = [...statements.financials, ...statements.balanceSheet, ...statements.cashFlow];
    for (const row of rows) {
      const date = new Date(row.date);
      if (Number.isNaN(date.getTime())) continue;
      const bucket = byDate.get(date.getTime()) ?? { date, fields: {} };
      const record = row as unknown as Record<string, unknown>;
      for (const name of ALL_FIELDS) {
        const v = record[name];
        if (typeof v === 'number') bucket.fields[name] = v;
      }
      byDate.set(date.getTime(), bucket);
    }
    return [...byDate.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /** Annual buckets -> one per calendar year of its period-end date (the later date wins). */
  static mergeByYear(buckets: Bucket[]): Map<number, Bucket> {
    const byYear = new Map<number, Bucket>();
    for (const b of buckets) {
      const year = b.date.getFullYear();
      const existing = byYear.get(year);
      byYear.set(year, existing ? { date: b.date, fields: { ...existing.fields, ...b.fields } } : b);
    }
    return byYear;
  }

  /** Quarterly buckets -> annual buckets, skipping years we already have real annual data for. */
  static aggregateQuarters(quarters: Bucket[], skipYears: Set<number>): Map<number, Bucket> {
    const grouped = new Map<number, Bucket[]>();
    for (const q of quarters) {
      const year = q.date.getFullYear();
      if (skipYears.has(year)) continue;
      grouped.set(year, [...(grouped.get(year) ?? []), q]);
    }

    const result = new Map<number, Bucket>();
    for (const [year, qs] of grouped) {
      const sorted = [...qs].sort((a, b) => a.date.getTime() - b.date.getTime());
      const fields: Fields = {};
      for (const name of FLOW_FIELDS) {
        const values = sorted.map((q) => q.fields[name]).filter((v): v is number => typeof v === 'number');
        if (values.length) fields[name] = values.reduce((a, b) => a + b, 0);
      }
      for (const name of STOCK_FIELDS) {
        const values = sorted.map((q) => q.fields[name]).filter((v): v is number => typeof v === 'number');
        if (values.length) fields[name] = values[values.length - 1];
      }
      if (Object.keys(fields).length > 0) result.set(year, { date: sorted[sorted.length - 1].date, fields });
    }
    return result;
  }

  /** One bucket -> the friendly-named period every page file works with. */
  static toFiscalPeriod(year: number, bucket: Bucket): FiscalPeriod {
    const f = bucket.fields;
    const revenue = pick(f, 'totalRevenue');
    const grossProfit = pick(f, 'grossProfit');
    return {
      year,
      periodDate: bucket.date,
      revenue,
      costOfRevenue: revenue - grossProfit,
      grossProfit,
      operatingIncome: pick(f, 'operatingIncome'),
      netIncome: pick(f, 'netIncome'),
      ebitda: pick(f, 'EBITDA'),
      totalAssets: pick(f, 'totalAssets'),
      totalLiabilities: pick(f, 'totalLiabilitiesNetMinorityInterest'),
      totalDebt: pick(f, 'totalDebt'),
      stockholdersEquity: pick(f, 'stockholdersEquity'),
      cashAndEquivalents: pick(f, 'cashAndCashEquivalents'),
      operatingCashFlow: pick(f, 'operatingCashFlow'),
      capitalExpenditure: pick(f, 'capitalExpenditure'),
      freeCashFlow: pick(f, 'freeCashFlow'),
      dividendsPaid: Math.abs(pick(f, 'commonStockDividendPaid', 'cashDividendsPaid')),
      buybacks: Math.abs(pick(f, 'repurchaseOfCapitalStock')),
      dilutedEPS: pick(f, 'dilutedEPS', 'basicEPS'),
    };
  }
}