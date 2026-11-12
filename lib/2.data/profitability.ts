import type { StockData, ProfitabilityYearPoint } from '../6.types/types';
import type { RawYahooData } from '../1.api/yahoo-api';
import { cagrOverSeries, averageOverWindow } from '../5.utils/utils';
import { FundamentalsTools } from '../3.tools/fundamentals-tools';

type ProfitabilityFields = Pick<
  StockData,
  | 'profitabilityByYear'
  | 'revenueCAGR5Y'
  | 'revenueCAGR10Y'
  | 'netIncomeCAGR5Y'
  | 'netIncomeCAGR10Y'
  | 'grossMarginAvg5Y'
  | 'grossMarginAvg10Y'
  | 'lastYearGrossMargin'
>;

/**
 * Feeds components/stock/profitability/. Everything here comes from the
 * statement rows, converted once by FundamentalsTools.
 */
export function computeProfitabilityData(raw: RawYahooData): ProfitabilityFields {
  const periods = FundamentalsTools.annualPeriods(raw);

  const profitabilityByYear: ProfitabilityYearPoint[] = periods.map((p) => ({
    year: p.year,
    revenue: p.revenue / 1e9,
    costOfRevenue: p.costOfRevenue / 1e9,
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
  const grossMarginAvg5Y = averageOverWindow(margins, 5);
  const grossMarginAvg10Y = averageOverWindow(margins, 10);
  const lastYearGrossMargin = profitabilityByYear[profitabilityByYear.length - 1]?.grossMargin ?? 0;

  return {
    profitabilityByYear,
    revenueCAGR5Y,
    revenueCAGR10Y,
    netIncomeCAGR5Y,
    netIncomeCAGR10Y,
    grossMarginAvg5Y,
    grossMarginAvg10Y,
    lastYearGrossMargin,
  };
}