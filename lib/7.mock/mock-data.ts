import type { StockData, ProfitabilityYearPoint, HistoricalReturnPoint } from '../6.types/types';
import { screenHalal, screenDividend } from '../4.screening/screening';
import { cagrOverSeries, average } from '../5.utils/utils';

const YEARS_10 = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

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

export function buildMockStock(symbol: string): StockData {
  const currentPrice = 271.4;
  const priceHistory = generatePriceHistory(currentPrice);
  const periods = [
    { year: 2015, revenue: 200, grossProfit: 90, operatingIncome: 60, netIncome: 48, ebitda: 68, dilutedEPS: 2.5 },
    { year: 2016, revenue: 215, grossProfit: 97, operatingIncome: 65, netIncome: 52, ebitda: 73, dilutedEPS: 2.8 },
    { year: 2017, revenue: 229, grossProfit: 103, operatingIncome: 69, netIncome: 55, ebitda: 78, dilutedEPS: 3.0 },
    { year: 2018, revenue: 265, grossProfit: 119, operatingIncome: 79, netIncome: 64, ebitda: 90, dilutedEPS: 3.4 },
    { year: 2019, revenue: 260, grossProfit: 117, operatingIncome: 78, netIncome: 62, ebitda: 88, dilutedEPS: 3.6 },
    { year: 2020, revenue: 275, grossProfit: 124, operatingIncome: 83, netIncome: 66, ebitda: 94, dilutedEPS: 4.2 },
    { year: 2021, revenue: 346, grossProfit: 156, operatingIncome: 104, netIncome: 83, ebitda: 118, dilutedEPS: 5.8 },
    { year: 2022, revenue: 391, grossProfit: 180, operatingIncome: 123, netIncome: 93, ebitda: 134, dilutedEPS: 6.6 },
    { year: 2023, revenue: 383, grossProfit: 169, operatingIncome: 114, netIncome: 97, ebitda: 125, dilutedEPS: 7.1 },
    { year: 2024, revenue: 394, grossProfit: 170, operatingIncome: 119, netIncome: 99, ebitda: 130, dilutedEPS: 7.98 },
  ];

  const profitabilityByYear = periods.map((p) => ({
    year: p.year,
    revenue: p.revenue / 1e9,
    costOfRevenue: (p.revenue - p.grossProfit) / 1e9,
    grossProfit: p.grossProfit / 1e9,
    netIncome: p.netIncome / 1e9,
    eps: p.dilutedEPS,
    grossMargin: p.revenue ? (p.grossProfit / p.revenue) * 100 : 0,
  }));

  const revenueCAGR5Y = cagrOverSeries(periods, 4, (p) => p.revenue);
  const revenueCAGR10Y = cagrOverSeries(periods, 9, (p) => p.revenue);
  const netIncomeCAGR5Y = cagrOverSeries(periods, 4, (p) => p.netIncome);
  const netIncomeCAGR10Y = cagrOverSeries(periods, 9, (p) => p.netIncome);

  const margins = profitabilityByYear.map((p) => p.grossMargin);
  const grossMarginAvg5Y = average(margins.slice(-5));
  const grossMarginAvg10Y = average(margins.slice(-10));
  const lastYearGrossMargin = profitabilityByYear[profitabilityByYear.length - 1]?.grossMargin ?? 0;

  const annualDividends = YEARS_10.map((year, i) => ({ year: String(year), amount: DIVIDEND_PER_SHARE_10[i] }));

  const dividendCAGR5Y = cagrOverSeries(annualDividends, 4, (d) => d.amount);
  const dividendCAGR10Y = cagrOverSeries(annualDividends, 9, (d) => d.amount);

  const fcfByYear = periods.map((p, i) => ({
    year: p.year,
    fcf: FREE_CASH_FLOW_10[i] / 1e9,
    dividendsPaid: DIVIDENDS_PAID_10[i] / 1e9,
  }));

  const fcfCoverage5Y = 6.93;
  const fcfCoverage10Y = 7.2;
  const fcfCAGR5Y = cagrOverSeries(periods, 4, (p) => p.revenue * 0.25);
  const fcfCAGR10Y = cagrOverSeries(periods, 9, (p) => p.revenue * 0.25);

  const dividend = screenDividend({
    payoutRatio: 13,
    fcfCoverage5Y,
    dividendCAGR5Y: Number.isNaN(dividendCAGR5Y) ? 0 : dividendCAGR5Y,
    fcfCAGR5Y: Number.isNaN(fcfCAGR5Y) ? 0 : fcfCAGR5Y,
  });

  const halal = screenHalal({
    sector: 'Technology',
    industry: 'Consumer Electronics',
    debtRatio: 27,
    haramEarningsRatio: 0,
  });

  return {
    symbol,
    name: 'Sample Company Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    description: 'Illustrative sample company — not real market data.',

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

    ttmPE: 34,
    avgPE5Y: 26.8,
    avgPE10Y: 25.3,
    peByYear: YEARS_10.map((year, i) => ({
      year,
      pe: [14.0, 15.2, 16.5, 18.2, 20.1, 30.5, 27.8, 22.4, 29.0, 34.0][i],
    })),
    peVsAvg: 34.4,

    ttmEPS: 7.98,
    epsCAGR5Y: 9.8,
    epsCAGR10Y: 11.2,

    estimatedFairValue: 199.9,
    estimatedPE: 28.5,
    estimatedEPSGrowth5Y: 9.5,

    isHalalCompliant: halal.isCompliant,
    halalReasons: halal.reasons,
    debtRatio: 27,
    haramEarningsRatio: 0,

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

    historicalReturns: profitabilityByYear.map((p, i) => ({
      year: p.year,
      eps: p.eps,
      pe: p.eps > 0 ? (28 + (currentPrice - 28) * Math.pow(i / 9, 1.3)) / p.eps : 0,
      price: 28 + (currentPrice - 28) * Math.pow(i / 9, 1.3),
      dividendPerShare: DIVIDEND_PER_SHARE_10[i],
      totalReturnPct: i > 0 ? ((p.revenue - periods[i - 1].revenue + DIVIDEND_PER_SHARE_10[i]) / periods[i - 1].revenue) * 100 : 0,
      compoundedReturnPct: 0,
    })),
  };
}
