import type { StockData, ProfitabilityYearPoint, HistoricalReturnPoint } from './types';
import { screenHalal, screenDividend } from './screening';
import { cagr, average } from './utils';

const YEARS_10 = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const YEARS_8 = YEARS_10.slice(-8);

// Single source of truth for the income-statement-derived series — reused by
// the financial statements table, the profitability tab, and (via price/eps)
// the sensitivity analysis tab, so everything stays internally consistent.
const REVENUE_10 = [200, 215, 229, 265, 260, 275, 346, 391, 383, 394];
const GROSS_PROFIT_10 = [90, 97, 103, 119, 117, 124, 156, 180, 169, 170];
const OPERATING_INCOME_10 = [60, 65, 69, 79, 78, 83, 104, 123, 114, 119];
const NET_INCOME_10 = [48, 52, 55, 64, 62, 66, 83, 93, 97, 99];
const EBITDA_10 = [68, 73, 78, 90, 88, 94, 118, 134, 125, 130];
const EPS_10 = [2.5, 2.8, 3.0, 3.4, 3.6, 4.2, 5.8, 6.6, 7.1, 7.98];
const DIVIDEND_PER_SHARE_10 = [0.55, 0.59, 0.63, 0.72, 0.75, 0.8, 0.79, 0.73, 0.7, 0.65];

const TOTAL_ASSETS_10 = [235, 250, 265, 285, 300, 315, 330, 345, 352, 365];
const TOTAL_LIABILITIES_10 = [180, 190, 205, 220, 230, 245, 260, 290, 291, 280];
const TOTAL_DEBT_10 = [55, 60, 65, 75, 80, 85, 92, 100, 105, 98.6];
const TOTAL_EQUITY_10 = [55, 60, 60, 65, 70, 70, 70, 55, 61, 85];
const CASH_10 = [30, 33, 35, 38, 40, 43, 46, 48, 50, 61];

const OPERATING_CASH_FLOW_10 = [70, 75, 80, 85, 90, 95, 105, 122, 110, 118];
const CAPEX_10 = [8, 8.5, 9, 9.2, 9.5, 9.8, 10, 10.5, 9.8, 9.5];
const FREE_CASH_FLOW_10 = [62, 66.5, 71, 75.8, 80.5, 85.2, 95, 111.5, 100.2, 108.5];
const DIVIDENDS_PAID_10 = [12.8, 13.5, 14, 14.5, 14.9, 15, 15.1, 15.2, 15.4, 15.66];
const SHARE_BUYBACKS_10 = [40, 45, 50, 55, 60, 65, 75, 90, 85, 95];

function byYear(values: number[]): Record<string, number> {
  return Object.fromEntries(YEARS_10.map((y, i) => [String(y), values[i]]));
}

function generatePriceHistory(endPrice: number): { date: string; close: number }[] {
  const points: { date: string; close: number }[] = [];
  const startYear = 2016;
  const totalMonths = 10 * 12;
  const startPrice = 28;
  for (let i = 0; i <= totalMonths; i++) {
    const year = startYear + Math.floor(i / 12);
    const month = (i % 12) + 1;
    const t = i / totalMonths;
    const trend = startPrice + (endPrice - startPrice) * Math.pow(t, 1.3);
    const wave = Math.sin(i / 5) * (3 + t * 10);
    const close = Math.max(5, Math.round((trend + wave) * 100) / 100);
    points.push({ date: `${year}-${String(month).padStart(2, '0')}-01`, close });
  }
  points[points.length - 1].close = endPrice;
  return points;
}

function closestPrice(priceHistory: { date: string; close: number }[], target: Date): number {
  let best = priceHistory[0];
  let bestDiff = Infinity;
  for (const p of priceHistory) {
    const diff = Math.abs(new Date(p.date).getTime() - target.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      best = p;
    }
  }
  return best.close;
}

/**
 * Illustrative sample data, not real market data for any specific company.
 * Numbers are internally consistent (debt ratio ties to the balance sheet,
 * FCF coverage ties to the cash flow statement, profitability/sensitivity
 * figures derive from the same revenue/EPS/price series as everything
 * else) so the screening engine and every chart/tab produce a coherent,
 * realistic-looking demo.
 */
export function buildMockStock(symbol: string): StockData {
  const currentPrice = 271.4;
  const priceHistory = generatePriceHistory(currentPrice);

  const halal = screenHalal({
    sector: 'Technology',
    industry: 'Consumer Electronics',
    debtRatio: 27,
    haramEarningsRatio: 0,
  });

  const dividend = screenDividend({
    dividendYield: 0.38,
    payoutRatio: 13,
    fcfCoverage5Y: 6.93,
    dividendGrowthStreak: 10,
    dividendCAGR5Y: -2.9,
  });

  // --- Profitability tab ---
  const profitabilityByYear: ProfitabilityYearPoint[] = YEARS_10.map((year, i) => ({
    year,
    revenue: REVENUE_10[i],
    costOfRevenue: REVENUE_10[i] - GROSS_PROFIT_10[i],
    grossProfit: GROSS_PROFIT_10[i],
    netIncome: NET_INCOME_10[i],
    eps: EPS_10[i],
    grossMargin: (GROSS_PROFIT_10[i] / REVENUE_10[i]) * 100,
  }));
  const revenueCAGR5Y = cagr(REVENUE_10[4], REVENUE_10[9], 5);
  const revenueCAGR10Y = cagr(REVENUE_10[0], REVENUE_10[9], 9);
  const netIncomeCAGR5Y = cagr(NET_INCOME_10[4], NET_INCOME_10[9], 5);
  const netIncomeCAGR10Y = cagr(NET_INCOME_10[0], NET_INCOME_10[9], 9);
  const grossMarginAvg5Y = average(profitabilityByYear.slice(-5).map((p) => p.grossMargin));
  const grossMarginAvg10Y = average(profitabilityByYear.map((p) => p.grossMargin));
  const lastYearGrossMargin = profitabilityByYear[profitabilityByYear.length - 1].grossMargin;

  // --- Sensitivity analysis tab ---
  const peSeries = YEARS_10.map((_, i) => {
    const price = closestPrice(priceHistory, new Date(YEARS_10[i], 11, 31));
    return EPS_10[i] > 0 ? price / EPS_10[i] : 0;
  });
  const historicalReturns: HistoricalReturnPoint[] = YEARS_10.map((year, i) => {
    const price = closestPrice(priceHistory, new Date(year, 11, 31));
    const prevPrice = i > 0 ? closestPrice(priceHistory, new Date(YEARS_10[i - 1], 11, 31)) : null;
    const totalReturnPct = prevPrice ? ((price - prevPrice + DIVIDEND_PER_SHARE_10[i]) / prevPrice) * 100 : 0;
    return { year, eps: EPS_10[i], pe: peSeries[i], price, dividendPerShare: DIVIDEND_PER_SHARE_10[i], totalReturnPct, compoundedReturnPct: 0 };
  });
  let compounding = 1;
  for (let i = 0; i < historicalReturns.length; i++) {
    if (i > 0) compounding *= 1 + historicalReturns[i].totalReturnPct / 100;
    historicalReturns[i].compoundedReturnPct = (compounding - 1) * 100;
  }

  return {
    symbol,
    name: `${symbol} — Sample Data`,
    sector: 'Technology',
    industry: 'Consumer Electronics',
    description:
      '[Sample data] Illustrative financials for demonstration purposes — this is not real market data for this ticker. Live data loads automatically once the symbol is reachable.',

    currentPrice,
    price52wHigh: 279.86,
    price52wLow: 198.5,
    priceChangePct52w: -0.98,
    priceHistory,

    dividendYield: 0.38,
    dividendYieldChangeYoY: 16,
    annualDividend: 0.96,
    payoutRatio: 13,
    dividendGrowthStreak: 10,
    dividendHistory: YEARS_8.map((year, i) => ({ date: String(year), amount: DIVIDEND_PER_SHARE_10.slice(-8)[i] })),
    dividendCAGR5Y: -2.9,
    dividendCAGR10Y: 3.6,
    estimatedDividendGrowth5Y: -0.9,

    ttmPE: 34,
    avgPE5Y: 26.8,
    avgPE10Y: 25.3,
    peByYear: YEARS_8.map((year, i) => ({
      year,
      pe: [16.5, 18.2, 20.1, 30.5, 27.8, 22.4, 29.0, 34.0][i],
    })),
    peVsAvg: 34.4,

    ttmEPS: 7.98,
    epsCAGR5Y: 9.8,
    epsCAGR10Y: 11.2,
    revenueByYear: YEARS_8.map((year, i) => ({
      year,
      revenue: REVENUE_10.slice(-8)[i],
      eps: EPS_10.slice(-8)[i],
    })),

    fcfCoverage5Y: 6.93,
    fcfCoverage10Y: 7.2,
    fcfCAGR5Y: 5.39,
    fcfByYear: YEARS_8.map((year, i) => ({
      year,
      fcf: FREE_CASH_FLOW_10.slice(-8)[i],
      dividendsPaid: DIVIDENDS_PAID_10.slice(-8)[i],
    })),

    estimatedFairValue: 199.9,
    estimatedPE: 28.5,
    estimatedEPSGrowth5Y: 9.5,

    isHalalCompliant: halal.isCompliant,
    halalReasons: halal.reasons,
    debtRatio: 27,
    haramEarningsRatio: 0,

    isDividendHealthy: dividend.isHealthy,
    dividendStatus: dividend.status,
    dividendReasons: dividend.reasons,

    analystRating: 'Buy',
    analystConsensus: 'Hold',
    numberOfAnalysts: 34,

    incomeStatement: {
      years: YEARS_10.map(String),
      rows: [
        { metric: 'Total Revenue', values: byYear(REVENUE_10) },
        { metric: 'Gross Profit', values: byYear(GROSS_PROFIT_10) },
        { metric: 'Operating Income', values: byYear(OPERATING_INCOME_10) },
        { metric: 'Net Income', values: byYear(NET_INCOME_10) },
        { metric: 'EBITDA', values: byYear(EBITDA_10) },
      ],
    },
    balanceSheet: {
      years: YEARS_10.map(String),
      rows: [
        { metric: 'Total Assets', values: byYear(TOTAL_ASSETS_10) },
        { metric: 'Total Liabilities', values: byYear(TOTAL_LIABILITIES_10) },
        { metric: 'Total Debt', values: byYear(TOTAL_DEBT_10) },
        { metric: 'Total Equity', values: byYear(TOTAL_EQUITY_10) },
        { metric: 'Cash & Equivalents', values: byYear(CASH_10) },
      ],
    },
    cashFlow: {
      years: YEARS_10.map(String),
      rows: [
        { metric: 'Operating Cash Flow', values: byYear(OPERATING_CASH_FLOW_10) },
        { metric: 'Capital Expenditures', values: byYear(CAPEX_10) },
        { metric: 'Free Cash Flow', values: byYear(FREE_CASH_FLOW_10) },
        { metric: 'Dividends Paid', values: byYear(DIVIDENDS_PAID_10) },
        { metric: 'Share Buybacks', values: byYear(SHARE_BUYBACKS_10) },
      ],
    },

    recentNews: [
      {
        title: '[Sample] Company beats quarterly earnings estimates',
        publisher: 'Sample Market Wire',
        date: '2026-06-28',
        url: '#',
      },
      {
        title: '[Sample] Analysts weigh in on next product cycle',
        publisher: 'Sample Finance Daily',
        date: '2026-06-20',
        url: '#',
      },
    ],
    stockSplits: [{ date: '2020-08-31', ratio: '4:1' }],

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
}
