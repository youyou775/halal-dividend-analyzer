export interface PricePoint {
  date: string;
  close: number;
}

export interface DividendPoint {
  date: string;
  amount: number;
}

export interface PEYearPoint {
  year: number;
  pe: number;
}

export interface RevenueYearPoint {
  year: number;
  revenue: number;
  eps: number;
}

export interface FcfYearPoint {
  year: number;
  fcf: number;
  dividendsPaid: number;
}

export interface NewsItem {
  title: string;
  publisher: string;
  date: string;
  url: string;
}

export interface StockSplit {
  date: string;
  ratio: string;
}

export interface FinancialStatementRow {
  metric: string;
  values: Record<string, number>;
}

export interface FinancialStatement {
  years: string[];
  rows: FinancialStatementRow[];
}

/** Three-way health read the UI needs; not present in the original brief's
 * boolean-only interface, added because "Healthy / Mixed / Poor" can't be
 * represented by isDividendHealthy alone. */
export type DividendStatus = 'healthy' | 'mixed' | 'poor';

export interface StockData {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  description: string;

  currentPrice: number;
  price52wHigh: number;
  price52wLow: number;
  priceChangePct52w: number;
  priceHistory: PricePoint[];

  dividendYield: number;
  dividendYieldChangeYoY: number;
  annualDividend: number;
  payoutRatio: number;
  dividendGrowthStreak: number;
  dividendHistory: DividendPoint[];
  dividendCAGR5Y: number;
  dividendCAGR10Y: number;
  estimatedDividendGrowth5Y: number;

  ttmPE: number;
  avgPE5Y: number;
  avgPE10Y: number;
  peByYear: PEYearPoint[];
  peVsAvg: number;

  ttmEPS: number;
  epsCAGR5Y: number;
  epsCAGR10Y: number;
  revenueByYear: RevenueYearPoint[];

  fcfCoverage5Y: number;
  fcfCoverage10Y: number;
  fcfCAGR5Y: number;
  fcfByYear: FcfYearPoint[];

  estimatedFairValue: number;
  estimatedPE: number;
  estimatedEPSGrowth5Y: number;

  isHalalCompliant: boolean;
  halalReasons: string[];
  debtRatio: number;
  haramEarningsRatio: number;

  isDividendHealthy: boolean;
  dividendStatus: DividendStatus;
  dividendReasons: string[];

  analystRating: string;
  analystConsensus: string;
  numberOfAnalysts: number;

  incomeStatement: FinancialStatement;
  balanceSheet: FinancialStatement;
  cashFlow: FinancialStatement;

  recentNews: NewsItem[];
  stockSplits: StockSplit[];
}
