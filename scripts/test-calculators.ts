/**
 * Run with: npm run test:data
 *
 * Feeds hand-built, Yahoo-shaped raw data (the same shape lib/yahoo-api.ts
 * returns, modelled on real AAPL logs) through the conversion tools in
 * lib/tools/ and the five page converters in lib/data/. No network, no
 * Next.js, no mocking of yahoo-finance2 — because the API file only fetches,
 * everything after it is a plain function you can call directly.
 *
 * To add a case: tweak a fixture via makeRaw(), call the converter you're
 * working on, add a `check(...)`. A failed check throws, so the run exits
 * non-zero.
 */
import type { RawYahooData, RawStatements } from '../lib/1.api/yahoo-api';
import { FundamentalsTools } from '../lib/3.tools/fundamentals-tools';
import { MarketTools } from '../lib/3.tools/market-tools';
import { computeOverviewData } from '../lib/2.data/overview';
import { computeDividendData } from '../lib/2.data/dividend';
import { computeProfitabilityData } from '../lib/2.data/profitability';
import { computeSensitivityData } from '../lib/2.data/sensitivity';
import { computeFinancialsData } from '../lib/2.data/financials';
import { isMissing } from '../lib/5.utils/utils';
import { buildMockStock } from '../lib/7.mock/mock-data';

let passed = 0;
function check(label: string, condition: boolean, detail?: unknown) {
  if (!condition) {
    console.error(`  FAIL: ${label}`, detail !== undefined ? `-> ${JSON.stringify(detail)}` : '');
    throw new Error(`Check failed: ${label}`);
  }
  passed++;
  console.log(`  ok: ${label}`);
}
const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// Years are relative to today so the "current year is incomplete" rule is exercised for real.
const THIS_YEAR = new Date().getFullYear();
const LAST = THIS_YEAR - 1;
/** n complete fiscal years ending last year. */
const years = (n: number) => Array.from({ length: n }, (_, i) => LAST - (n - 1) + i);

// Everything is a function of the year, so annual and quarterly fixtures agree.
const k = (year: number) => year - (THIS_YEAR - 12);
const revenue = (year: number) => 100e9 * Math.pow(1.1, k(year));
const eps = (year: number) => 5 * Math.pow(1.08, k(year));
const fcf = (year: number) => revenue(year) * 0.27 * Math.pow(1.05, k(year));
const fyEnd = (year: number) => new Date(Date.UTC(year, 8, 30)); // Sept 30 — a non-calendar fiscal year, like Apple's

/** Annual rows in Yahoo's real shape: one row per year per statement, bare field names, Date objects, negative cash outflows. */
function annualStatements(ys: number[], debtOfAssets = 0.3, scale = 1): RawStatements {
  return {
    financials: ys.map((y) => ({ TYPE: 'FINANCIALS', date: fyEnd(y), periodType: '12M', totalRevenue: revenue(y) * scale, grossProfit: revenue(y) * 0.4 * scale, operatingIncome: revenue(y) * 0.3 * scale, netIncome: revenue(y) * 0.25 * scale, EBITDA: revenue(y) * 0.33 * scale, dilutedEPS: eps(y) * scale, basicEPS: eps(y) * 1.02 * scale })),
    balanceSheet: ys.map((y) => ({ TYPE: 'BALANCE_SHEET', date: fyEnd(y), periodType: '12M', totalAssets: revenue(y) * 3, totalLiabilitiesNetMinorityInterest: revenue(y) * 2.5, totalDebt: revenue(y) * 3 * debtOfAssets, stockholdersEquity: revenue(y) * 0.5, cashAndCashEquivalents: revenue(y) * 0.2 })),
    cashFlow: ys.map((y) => ({ TYPE: 'CASH_FLOW', date: fyEnd(y), periodType: '12M', operatingCashFlow: revenue(y) * 0.3, capitalExpenditure: -revenue(y) * 0.03, freeCashFlow: fcf(y) * scale, commonStockDividendPaid: -revenue(y) * 0.04, repurchaseOfCapitalStock: -revenue(y) * 0.2 })),
  } as unknown as RawStatements;
}

/** Four quarters per year; flow fields are a quarter of the annual figure, balance fields grow to the annual value by Q4. */
function quarterlyStatements(ys: number[], scale = 1): RawStatements {
  const quarters = (y: number) => [0, 1, 2, 3].map((q) => ({ q, date: new Date(Date.UTC(y, 2 + 3 * q, q % 2 === 0 ? 31 : 30)), stockFrac: [0.94, 0.96, 0.98, 1][q] }));
  const rows = (make: (y: number, q: ReturnType<typeof quarters>[number]) => object) => ys.flatMap((y) => quarters(y).map((q) => make(y, q)));
  return {
    financials: rows((y, q) => ({ TYPE: 'FINANCIALS', date: q.date, periodType: '3M', totalRevenue: (revenue(y) / 4) * scale, grossProfit: (revenue(y) * 0.4 / 4) * scale, netIncome: (revenue(y) * 0.25 / 4) * scale, dilutedEPS: (eps(y) / 4) * scale })),
    balanceSheet: rows((y, q) => ({ TYPE: 'BALANCE_SHEET', date: q.date, periodType: '3M', totalAssets: revenue(y) * 3 * q.stockFrac, totalDebt: revenue(y) * 0.9 * q.stockFrac })),
    cashFlow: rows((y, q) => ({ TYPE: 'CASH_FLOW', date: q.date, periodType: '3M', freeCashFlow: (fcf(y) / 4) * scale, commonStockDividendPaid: (-revenue(y) * 0.04) / 4 })),
  } as unknown as RawStatements;
}

interface Opts {
  annualYears: number[];
  quarterlyYears?: number[];
  quarterlyScale?: number;
  debtOfAssets?: number;
  sector?: string;
  industry?: string;
}
function makeRaw(o: Opts): RawYahooData {
  // Monthly closes on the 1st. October = 100, December = 1000, else 500 — so matching a Sept-30 fiscal
  // year-end to the right price (Oct 1 -> 100) is distinguishable from wrongly assuming Dec 31 (-> 1000).
  const quotes: { date: Date; close: number | null }[] = [];
  for (let y = THIS_YEAR - 12; y <= THIS_YEAR; y++) for (let m = 0; m < 12; m++) quotes.push({ date: new Date(Date.UTC(y, m, 1)), close: m === 9 ? 100 : m === 11 ? 1000 : 500 });
  quotes.push({ date: new Date(Date.UTC(THIS_YEAR, 11, 15)), close: null }); // Yahoo does emit null closes

  // Two half-dividends per complete year, plus a partial current year that must be ignored.
  const dividendYears = [...o.annualYears.filter((y) => y < THIS_YEAR), THIS_YEAR];
  const dividends = dividendYears.flatMap((y) => [3, 9].map((m) => ({ date: new Date(Date.UTC(y, m, 15)), amount: 0.5 * Math.pow(1.07, k(y)) })));

  return {
    symbol: 'TEST',
    summary: {
      price: { symbol: 'TEST', longName: 'Test Corp', regularMarketPrice: 200, regularMarketChangePercent: 5 },
      assetProfile: { sector: o.sector ?? 'Technology', industry: o.industry ?? 'Software', longBusinessSummary: 'A test company.' },
      summaryDetail: { dividendYield: 0.005, payoutRatio: 0.2, trailingAnnualDividendRate: 1, trailingPE: 30, fiftyTwoWeekHigh: 210, fiftyTwoWeekLow: 150 },
      defaultKeyStatistics: { trailingEps: 6.67, sharesOutstanding: 1e9 },
      financialData: { targetMeanPrice: 0 },
      recommendationTrend: { trend: [{ strongBuy: 8, buy: 12, hold: 8, sell: 1, strongSell: 1 }] },
    },
    chart: { quotes, events: { dividends } },
    annual: annualStatements(o.annualYears, o.debtOfAssets),
    quarterly: o.quarterlyYears ? quarterlyStatements(o.quarterlyYears, o.quarterlyScale) : { financials: [], balanceSheet: [], cashFlow: [] },
    news: { news: [{ title: 'Headline', publisher: 'Wire', providerPublishTime: 1_700_000_000, link: 'https://example.com' }] },
  };
}

console.log('\n[1] The exact AAPL situation from the logs: only 4 genuine fiscal years');
{
  const raw = makeRaw({ annualYears: years(4) });
  const prof = computeProfitabilityData(raw);
  check('5yr revenue CAGR is missing (needs 5 points, have 4) — not silently reusing a shorter span', isMissing(prof.revenueCAGR5Y), prof.revenueCAGR5Y);
  check('10yr revenue CAGR is missing', isMissing(prof.revenueCAGR10Y));
  check('5yr and 10yr are never the same number (the original collapse bug)', !(prof.revenueCAGR5Y === prof.revenueCAGR10Y && !isMissing(prof.revenueCAGR5Y)));
  check('profitabilityByYear has all 4 real years', prof.profitabilityByYear.length === 4);
  check('gross margin computed correctly (40%)', near(prof.lastYearGrossMargin, 40), prof.lastYearGrossMargin);
  check('revenue scaled to billions', near(prof.profitabilityByYear[3].revenue, revenue(LAST) / 1e9));

  const sens = computeSensitivityData(raw);
  check('10yr avg PE is missing with 4 points', isMissing(sens.avgPE10Y));
  check('PE-by-year has 4 entries', sens.peByYear.length === 4);
  check('first year has no prior-year return', sens.historicalReturns.length === 4 && sens.historicalReturns[0].totalReturnPct === 0);

  const div = computeDividendData(raw);
  check('5yr FCF CAGR missing with 4 points', isMissing(div.fcfCAGR5Y));
  check('fcfByYear has all 4 real years', div.fcfByYear.length === 4);
  check('payout ratio read from quoteSummary and scaled to % (0.2 -> 20)', near(div.payoutRatio, 20), div.payoutRatio);
  check('dividend screening still yields a status despite missing windows', ['healthy', 'mixed', 'poor'].includes(div.dividendStatus), div.dividendStatus);
}

console.log('\n[2] Exactly 5 years: 5yr figures appear, 10yr still missing');
{
  const raw = makeRaw({ annualYears: years(5) });
  const prof = computeProfitabilityData(raw);
  check('5yr revenue CAGR present and ~10%', !isMissing(prof.revenueCAGR5Y) && near(prof.revenueCAGR5Y, 10, 1e-4), prof.revenueCAGR5Y);
  check('10yr revenue CAGR still missing', isMissing(prof.revenueCAGR10Y));
  const sens = computeSensitivityData(raw);
  check('5yr avg PE present, 10yr avg PE missing', !isMissing(sens.avgPE5Y) && isMissing(sens.avgPE10Y));
  check('5yr EPS CAGR ~8%', near(sens.epsCAGR5Y, 8, 1e-4), sens.epsCAGR5Y);
  check('5yr dividend CAGR ~7% (from chart events, summed per year)', near(computeDividendData(raw).dividendCAGR5Y, 7, 1e-3), computeDividendData(raw).dividendCAGR5Y);
}

console.log('\n[3] A full 10 years: every window present, statements span 10 years');
{
  const raw = makeRaw({ annualYears: years(10) });
  const prof = computeProfitabilityData(raw);
  check('5yr and 10yr revenue CAGR both present', !isMissing(prof.revenueCAGR5Y) && !isMissing(prof.revenueCAGR10Y));
  const fin = computeFinancialsData(raw);
  check('income statement spans all 10 years', fin.incomeStatement.years.length === 10);
  check('statement values scaled to billions', near(fin.incomeStatement.rows[0].values[String(LAST)], revenue(LAST) / 1e9));
  check('capex shown as a positive magnitude despite Yahoo reporting it negative', fin.cashFlow.rows[1].values[String(LAST)] > 0);
  check('analyst consensus is the largest bucket (strongBuy+buy = 20 -> Buy)', fin.analystConsensus === 'Buy', fin.analystConsensus);
  check('analyst count sums all buckets (8+12+8+1+1)', fin.numberOfAnalysts === 30, fin.numberOfAnalysts);
}

console.log('\n[4] Overview: profile fields, halal screening, news');
{
  const ok = computeOverviewData(makeRaw({ annualYears: years(4) }));
  check('symbol/name/price come from summary.price', ok.symbol === 'TEST' && ok.name === 'Test Corp' && ok.currentPrice === 200);
  check('dividend yield scaled to % (0.005 -> 0.5)', near(ok.dividendYield, 0.5), ok.dividendYield);
  check('tech company with 30% debt ratio is compliant', ok.isHalalCompliant && near(ok.debtRatio, 30), ok.debtRatio);
  check('news mapped: unix time -> date string', ok.recentNews[0].title === 'Headline' && ok.recentNews[0].date === '2023-11-14', ok.recentNews[0]);
  check('price history drops null closes', ok.priceHistory.every((p) => typeof p.close === 'number'));
  const bank = computeOverviewData(makeRaw({ annualYears: years(4), sector: 'Financial Services', industry: 'Banks' }));
  check('a bank is not compliant', !bank.isHalalCompliant && bank.halalReasons.length > 0, bank.halalReasons);
  const leveraged = computeOverviewData(makeRaw({ annualYears: years(4), debtOfAssets: 0.5 }));
  check('50% debt ratio breaches the 33% limit', !leveraged.isHalalCompliant && near(leveraged.debtRatio, 50), leveraged.debtRatio);
}

console.log('\n[5] Empty / minimal responses degrade gracefully instead of throwing');
{
  const empty: RawYahooData = { symbol: 'EMPTY', summary: { price: {} }, chart: {}, annual: { financials: [], balanceSheet: [], cashFlow: [] }, quarterly: { financials: [], balanceSheet: [], cashFlow: [] }, news: {} };
  computeOverviewData(empty);
  computeDividendData(empty);
  computeProfitabilityData(empty);
  computeSensitivityData(empty);
  computeFinancialsData(empty);
  check('all five converters accept an empty response without throwing', true);
}

console.log('\n[6] FundamentalsTools: the Yahoo quirks, one by one');
{
  // Annual rows include the current year (partial) — it must be dropped.
  const withCurrent = makeRaw({ annualYears: [...years(4), THIS_YEAR] });
  const p1 = FundamentalsTools.annualPeriods(withCurrent);
  check('current (incomplete) year is excluded from annual rows', p1.every((p) => p.year < THIS_YEAR) && p1.length === 4, p1.map((p) => p.year));

  // Quarterly fills older years the annual call lacks; never overrides real annual years.
  // The quarterly fixture is scaled by Q_SCALE so its numbers visibly differ from the annual ones.
  const Q_SCALE = 2;
  const raw = makeRaw({ annualYears: years(4), quarterlyYears: [LAST - 6, LAST - 5, LAST - 4, LAST - 3, THIS_YEAR], quarterlyScale: Q_SCALE });
  const periods = FundamentalsTools.annualPeriods(raw);
  const byYear = new Map(periods.map((p) => [p.year, p]));
  check('older years are filled in from quarterly data (7 total, current year excluded)', periods.length === 7 && periods[0].year === LAST - 6, periods.map((p) => p.year));
  const filled = byYear.get(LAST - 5)!;
  check('flow fields are SUMMED across the 4 quarters (revenue)', near(filled.revenue, Q_SCALE * revenue(LAST - 5)), filled.revenue);
  check('EPS is summed across quarters, not taken from the last one', near(filled.dilutedEPS, Q_SCALE * eps(LAST - 5)), filled.dilutedEPS);
  check('balance fields take the LAST quarter (total assets)', near(filled.totalAssets, revenue(LAST - 5) * 3), filled.totalAssets);
  const real = byYear.get(LAST - 3)!;
  check('a real annual year is not overridden by (deliberately 2x different) quarterly data', near(real.revenue, revenue(LAST - 3)), real.revenue);
  check('the current year from quarterly data is excluded too', !byYear.has(THIS_YEAR));
  check('result is ascending by year', periods.every((p, i) => i === 0 || p.year > periods[i - 1].year));

  const twelve = FundamentalsTools.annualPeriods(makeRaw({ annualYears: years(12) }));
  check('capped at the most recent 10 years', twelve.length === 10 && twelve[9].year === LAST && twelve[0].year === LAST - 9);

  const one = FundamentalsTools.annualPeriods(makeRaw({ annualYears: years(4) }))[0];
  check('real fiscal period-end date kept (Sept, not an assumed Dec 31)', one.periodDate.getUTCMonth() === 8, one.periodDate);
  check('dividends paid and buybacks come out positive despite Yahoo reporting negatives', one.dividendsPaid > 0 && one.buybacks > 0);
  check('"commonStockDividendPaid" is the field used for dividends paid', near(one.dividendsPaid, revenue(one.year) * 0.04), one.dividendsPaid);

  const memo = makeRaw({ annualYears: years(4) });
  check('conversion is memoized per request (same array back)', FundamentalsTools.annualPeriods(memo) === FundamentalsTools.annualPeriods(memo));
}

console.log('\n[7] The fiscal-year fix, end to end: PE must use the price at the real period-end');
{
  const raw = makeRaw({ annualYears: years(4) });
  const sens = computeSensitivityData(raw);
  const first = FundamentalsTools.annualPeriods(raw)[0];
  check('PE = price near Sept 30 (Oct 1 close = 100) / EPS — NOT the Dec 31 price (1000)', near(sens.peByYear[0].pe, 100 / first.dilutedEPS), sens.peByYear[0]);
}

console.log('\n[8] MarketTools');
{
  const raw = makeRaw({ annualYears: years(4) });
  const divs = MarketTools.annualDividends(raw.chart);
  check('dividends summed per calendar year (two half-payments per year)', near(divs[0].amount, 1 * Math.pow(1.07, k(LAST - 3)), 1e-9), divs[0]);
  check('current year excluded from dividends', divs.every((d) => Number(d.year) < THIS_YEAR) && divs.length === 4, divs.map((d) => d.year));
  check('handles a missing chart without throwing', MarketTools.annualDividends(undefined).length === 0 && MarketTools.priceHistory(undefined).length === 0);
}

console.log('\n[9] The five converters together cover every StockData field the UI reads');
{
  const raw = makeRaw({ annualYears: years(5) });
  const assembled: Record<string, unknown> = {
    ...computeOverviewData(raw),
    ...computeDividendData(raw),
    ...computeProfitabilityData(raw),
    ...computeSensitivityData(raw),
    ...computeFinancialsData(raw),
  };
  const expected = Object.keys(buildMockStock('X')).sort(); // the mock is a complete StockData
  const got = Object.keys(assembled).sort();
  check('no StockData field is missing from the combined output', expected.every((key) => got.includes(key)), expected.filter((key) => !got.includes(key)));
  check('no converter emits a field StockData does not have', got.every((key) => expected.includes(key)), got.filter((key) => !expected.includes(key)));
  check('no field is undefined (missing windows must be NaN/null, never undefined)', Object.values(assembled).every((v) => v !== undefined));
}

console.log(`\nAll ${passed} checks passed.\n`);
