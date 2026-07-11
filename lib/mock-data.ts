import type { StockData } from './types';
import { screenHalal, screenDividend } from './screening';

const YEARS_8 = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

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

/**
 * Illustrative sample data, not real market data for any specific company.
 * Numbers are internally consistent (debt ratio ties to the balance sheet,
 * FCF coverage ties to the cash flow statement, etc.) so the screening
 * engine and every chart produce a coherent, realistic-looking demo.
 */
export function buildMockStock(symbol: string): StockData {
  const currentPrice = 271.4;

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
    priceHistory: generatePriceHistory(currentPrice),

    dividendYield: 0.38,
    dividendYieldChangeYoY: 16,
    annualDividend: 0.96,
    payoutRatio: 13,
    dividendGrowthStreak: 10,
    dividendHistory: [
      { date: '2017', amount: 0.63 },
      { date: '2018', amount: 0.72 },
      { date: '2019', amount: 0.75 },
      { date: '2020', amount: 0.8 },
      { date: '2021', amount: 0.79 },
      { date: '2022', amount: 0.73 },
      { date: '2023', amount: 0.7 },
      { date: '2024', amount: 0.65 },
    ],
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
      revenue: [229, 265, 260, 275, 346, 391, 383, 394][i],
      eps: [3.0, 3.4, 3.6, 4.2, 5.8, 6.6, 7.1, 7.98][i],
    })),

    fcfCoverage5Y: 6.93,
    fcfCoverage10Y: 7.2,
    fcfCAGR5Y: 5.39,
    fcfByYear: YEARS_8.map((year, i) => ({
      year,
      fcf: [65, 72, 75, 80, 95, 111.5, 100.2, 108.5][i],
      dividendsPaid: [12.8, 13.5, 14.0, 14.5, 14.9, 15.2, 15.4, 15.66][i],
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
      years: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
      rows: [
        {
          metric: 'Total Revenue',
          values: { '2015': 200, '2016': 215, '2017': 229, '2018': 265, '2019': 260, '2020': 275, '2021': 346, '2022': 391, '2023': 383, '2024': 394 },
        },
        {
          metric: 'Gross Profit',
          values: { '2015': 90, '2016': 97, '2017': 103, '2018': 119, '2019': 117, '2020': 124, '2021': 156, '2022': 180, '2023': 169, '2024': 170 },
        },
        {
          metric: 'Operating Income',
          values: { '2015': 60, '2016': 65, '2017': 69, '2018': 79, '2019': 78, '2020': 83, '2021': 104, '2022': 123, '2023': 114, '2024': 119 },
        },
        {
          metric: 'Net Income',
          values: { '2015': 48, '2016': 52, '2017': 55, '2018': 64, '2019': 62, '2020': 66, '2021': 83, '2022': 93, '2023': 97, '2024': 99 },
        },
        {
          metric: 'EBITDA',
          values: { '2015': 68, '2016': 73, '2017': 78, '2018': 90, '2019': 88, '2020': 94, '2021': 118, '2022': 134, '2023': 125, '2024': 130 },
        },
      ],
    },
    balanceSheet: {
      years: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
      rows: [
        {
          metric: 'Total Assets',
          values: { '2015': 235, '2016': 250, '2017': 265, '2018': 285, '2019': 300, '2020': 315, '2021': 330, '2022': 345, '2023': 352, '2024': 365 },
        },
        {
          metric: 'Total Liabilities',
          values: { '2015': 180, '2016': 190, '2017': 205, '2018': 220, '2019': 230, '2020': 245, '2021': 260, '2022': 290, '2023': 291, '2024': 280 },
        },
        {
          metric: 'Total Debt',
          values: { '2015': 55, '2016': 60, '2017': 65, '2018': 75, '2019': 80, '2020': 85, '2021': 92, '2022': 100, '2023': 105, '2024': 98.6 },
        },
        {
          metric: 'Total Equity',
          values: { '2015': 55, '2016': 60, '2017': 60, '2018': 65, '2019': 70, '2020': 70, '2021': 70, '2022': 55, '2023': 61, '2024': 85 },
        },
        {
          metric: 'Cash & Equivalents',
          values: { '2015': 30, '2016': 33, '2017': 35, '2018': 38, '2019': 40, '2020': 43, '2021': 46, '2022': 48, '2023': 50, '2024': 61 },
        },
      ],
    },
    cashFlow: {
      years: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
      rows: [
        {
          metric: 'Operating Cash Flow',
          values: { '2015': 70, '2016': 75, '2017': 80, '2018': 85, '2019': 90, '2020': 95, '2021': 105, '2022': 122, '2023': 110, '2024': 118 },
        },
        {
          metric: 'Capital Expenditures',
          values: { '2015': 8, '2016': 8.5, '2017': 9, '2018': 9.2, '2019': 9.5, '2020': 9.8, '2021': 10, '2022': 10.5, '2023': 9.8, '2024': 9.5 },
        },
        {
          metric: 'Free Cash Flow',
          values: { '2015': 62, '2016': 66.5, '2017': 71, '2018': 75.8, '2019': 80.5, '2020': 85.2, '2021': 95, '2022': 111.5, '2023': 100.2, '2024': 108.5 },
        },
        {
          metric: 'Dividends Paid',
          values: { '2015': 12.8, '2016': 13.5, '2017': 14, '2018': 14.5, '2019': 14.9, '2020': 15, '2021': 15.1, '2022': 15.2, '2023': 15.4, '2024': 15.66 },
        },
        {
          metric: 'Share Buybacks',
          values: { '2015': 40, '2016': 45, '2017': 50, '2018': 55, '2019': 60, '2020': 65, '2021': 75, '2022': 90, '2023': 85, '2024': 95 },
        },
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
  };
}
