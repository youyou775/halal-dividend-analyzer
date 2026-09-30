import HalalCard from '../HalalCard';
import MetricGrid from '../MetricGrid';
import PriceChart from '../PriceChart';
import RecentNews from '../RecentNews';
import { TabSummaryCard } from '../TabSummaryCard';
import type { StockData } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { TabId } from '../TabNav';

const DIVIDEND_LABEL: Record<string, string> = { healthy: 'Healthy', mixed: 'Mixed', poor: 'Poor' };

export default function OverviewTab({ data, onNavigate }: { data: StockData; onNavigate: (t: TabId) => void }) {
  const fairValueDeltaPct = data.currentPrice ? ((data.estimatedFairValue - data.currentPrice) / data.currentPrice) * 100 : 0;
  const latestIncomeYear = data.incomeStatement.years[data.incomeStatement.years.length - 1];
  const latestNetIncome = data.incomeStatement.rows.find((r) => r.metric === 'Net Income')?.values[latestIncomeYear] ?? 0;

  return (
    <div className="grid h-full grid-cols-1 gap-2 md:gap-3 lg:grid-cols-12">
      <div className="flex min-h-0 flex-col gap-2 md:gap-3 lg:col-span-3">
        <div className="min-h-0 flex-1">
          <HalalCard data={data} />
        </div>
        <div className="min-h-0 flex-[1.3]">
          <MetricGrid data={data} />
        </div>
      </div>
      <div className="flex min-h-0 flex-col gap-2 md:gap-3 lg:col-span-5">
        <div className="min-h-0 flex-1">
          <PriceChart data={data} />
        </div>
        <div className="min-h-0 flex-1">
          <RecentNews data={data} />
        </div>
      </div>
      <div className="flex min-h-0 flex-col gap-2 md:gap-3 lg:col-span-4">
        <TabSummaryCard
          title="Dividend growth"
          takeaway={`${DIVIDEND_LABEL[data.dividendStatus]} — ${data.dividendReasons[0] ?? 'meets the core screening criteria.'}`}
          stats={[
            { label: '5yr CAGR', value: formatPercent(data.dividendCAGR5Y) },
            { label: 'Payout ratio', value: formatPercent(data.payoutRatio, 0) },
            { label: 'Yield', value: formatPercent(data.dividendYield, 2) },
            { label: 'Streak', value: `${data.dividendGrowthStreak}yrs` },
          ]}
          onOpen={() => onNavigate('Dividend Growth')}
        />
        <TabSummaryCard
          title="Profitability"
          takeaway={`Gross margin ${data.lastYearGrossMargin.toFixed(0)}% last year, revenue growing ${formatPercent(data.revenueCAGR5Y)} annually (5yr).`}
          stats={[
            { label: 'Revenue CAGR 5Y', value: formatPercent(data.revenueCAGR5Y) },
            { label: 'Net income CAGR 5Y', value: formatPercent(data.netIncomeCAGR5Y) },
            { label: 'Gross margin (5Y avg)', value: formatPercent(data.grossMarginAvg5Y, 0) },
            { label: 'Net income (last yr)', value: `$${latestNetIncome.toFixed(1)}B` },
          ]}
          onOpen={() => onNavigate('Profitability')}
        />
        <TabSummaryCard
          title="Sensitivity analysis"
          takeaway={`Trading ${fairValueDeltaPct >= 0 ? 'below' : 'above'} the model's fair value estimate by ${Math.abs(fairValueDeltaPct).toFixed(1)}%.`}
          stats={[
            { label: 'TTM PE', value: data.ttmPE.toFixed(1) },
            { label: 'Avg PE (10Y)', value: data.avgPE10Y.toFixed(1) },
            { label: 'Est. fair value', value: formatCurrency(data.estimatedFairValue) },
            { label: 'Est. EPS growth 5Y', value: formatPercent(data.estimatedEPSGrowth5Y) },
          ]}
          onOpen={() => onNavigate('Sensitivity Analysis')}
        />
        <TabSummaryCard
          title="Financials & info"
          takeaway={`Analyst consensus: ${data.analystConsensus}, based on ${data.numberOfAnalysts || 'a handful of'} analysts.`}
          stats={[
            { label: 'Sector', value: data.sector },
            { label: 'Analyst rating', value: data.analystRating },
            { label: 'Debt ratio', value: formatPercent(data.debtRatio, 0) },
            { label: 'FCF coverage 5Y', value: `${data.fcfCoverage5Y.toFixed(1)}x` },
          ]}
          onOpen={() => onNavigate('Financials & Info')}
        />
      </div>
    </div>
  );
}
