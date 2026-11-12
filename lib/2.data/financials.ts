import type { StockData, FiscalPeriod, FinancialStatement } from '../6.types/types';
import type { RawYahooData } from '../1.api/yahoo-api';
import { FundamentalsTools } from '../3.tools/fundamentals-tools';

type FinancialsFields = Pick<StockData, 'incomeStatement' | 'balanceSheet' | 'cashFlow' | 'analystRating' | 'analystConsensus' | 'numberOfAnalysts'>;

/**
 * Feeds components/stock/financials/. The three statements come from
 * FundamentalsTools; the analyst consensus is read straight from
 * quoteSummary's recommendationTrend.
 */
export function computeFinancialsData(raw: RawYahooData): FinancialsFields {
  const periods = FundamentalsTools.annualPeriods(raw);
  const yearStrs = periods.map((p) => String(p.year));

  const buildStatement = (fields: Record<string, (p: FiscalPeriod) => number>): FinancialStatement => ({
    years: yearStrs,
    rows: Object.entries(fields).map(([metric, getValue]) => ({
      metric,
      values: Object.fromEntries(periods.map((p, i) => [yearStrs[i], Math.abs(getValue(p)) / 1e9])),
    })),
  });

  const incomeStatement = buildStatement({
    'Total Revenue': (p) => p.revenue,
    'Gross Profit': (p) => p.grossProfit,
    'Operating Income': (p) => p.operatingIncome,
    'Net Income': (p) => p.netIncome,
    EBITDA: (p) => p.ebitda,
  });
  const balanceSheet = buildStatement({
    'Total Assets': (p) => p.totalAssets,
    'Total Liabilities': (p) => p.totalLiabilities,
    'Total Debt': (p) => p.totalDebt,
    'Total Equity': (p) => p.stockholdersEquity,
    'Cash & Equivalents': (p) => p.cashAndEquivalents,
  });
  const cashFlow = buildStatement({
    'Operating Cash Flow': (p) => p.operatingCashFlow,
    'Capital Expenditures': (p) => p.capitalExpenditure,
    'Free Cash Flow': (p) => p.freeCashFlow,
    'Dividends Paid': (p) => p.dividendsPaid,
    'Share Buybacks': (p) => p.buybacks,
  });

  const trend = raw.summary?.recommendationTrend?.trend?.[0] ?? {};
  const buy: number = (trend.strongBuy ?? 0) + (trend.buy ?? 0);
  const hold: number = trend.hold ?? 0;
  const sell: number = (trend.sell ?? 0) + (trend.strongSell ?? 0);
  const numberOfAnalysts = buy + hold + sell;
  const buckets: [string, number][] = [
    ['buy', buy],
    ['hold', hold],
    ['sell', sell],
  ];
  const topBucket = buckets.sort((a, b) => b[1] - a[1])[0][0];
  const consensusLabel = topBucket === 'buy' ? 'Buy' : topBucket === 'sell' ? 'Sell' : 'Hold';

  return {
    incomeStatement,
    balanceSheet,
    cashFlow,
    analystRating: consensusLabel,
    analystConsensus: consensusLabel,
    numberOfAnalysts,
  };
}