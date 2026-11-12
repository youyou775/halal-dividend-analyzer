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

export interface ProfitabilityYearPoint {
  year: number;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  netIncome: number;
  eps: number;
  grossMargin: number; // %
}

export interface HistoricalReturnPoint {
  year: number;
  eps: number;
  pe: number;
  price: number;
  dividendPerShare: number;
  totalReturnPct: number; // this year's price change + dividend yield
  compoundedReturnPct: number; // cumulative return from the start of the window through this year
}

/** Three-way health read the UI needs; not present in the original brief's
 * boolean-only interface, added because "Healthy / Mixed / Poor" can't be
 * represented by isDividendHealthy alone. */
/** Shared 3-way score used wherever a dimension (dividend, profitability,
 * valuation) gets summarized into a single Healthy/Mixed/Poor read. */
export type ScoreStatus = 'healthy' | 'mixed' | 'poor';
/** @deprecated use ScoreStatus — kept as an alias so existing imports don't break. */
export type DividendStatus = ScoreStatus;

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

  fcfCoverage5Y: number;
  fcfCoverage10Y: number;
  fcfCAGR5Y: number;
  fcfCAGR10Y: number;
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

  // Profitability tab
  profitabilityByYear: ProfitabilityYearPoint[];
  revenueCAGR5Y: number;
  revenueCAGR10Y: number;
  netIncomeCAGR5Y: number;
  netIncomeCAGR10Y: number;
  grossMarginAvg5Y: number;
  grossMarginAvg10Y: number;
  lastYearGrossMargin: number;

  // Sensitivity analysis tab
  historicalReturns: HistoricalReturnPoint[];
}

/**
 * One fiscal year of fundamentals, in plain dollars (not yet scaled to
 * billions) with friendly field names. Produced by
 * FundamentalsTools.annualPeriods() (lib/3.tools/fundamentals-tools.ts) from
 * Yahoo's raw statement rows — the page files in lib/2.data/ call that tool
 * and then read `p.revenue`, `p.netIncome`, etc. instead of each re-deriving
 * them from Yahoo's field names.
 */
export interface FiscalPeriod {
  year: number;
  /** Actual fiscal period-end date — NOT assumed to be Dec 31; many
   * companies (Apple included) don't run a calendar fiscal year. */
  periodDate: Date;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  ebitda: number;
  totalAssets: number;
  totalLiabilities: number;
  totalDebt: number;
  stockholdersEquity: number;
  cashAndEquivalents: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  dividendsPaid: number;
  buybacks: number;
  dilutedEPS: number;
}