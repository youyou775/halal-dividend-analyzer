import HalalCard from './HalalCard';
import MetricGrid from './MetricGrid';
import PriceChart from './PriceChart';
import RecentNews from './RecentNews';
import { TabSummaryCard } from './TabSummaryCard';
import type { StockData, ScoreStatus } from '@/lib/6.types/types';
import { formatCurrency, formatPercent, formatNumber, formatMultiple } from '@/lib/5.utils/utils';
import { scoreProfitability, scoreValuation, PROFITABILITY_BENCHMARKS, SCREENING_THRESHOLDS } from '@/lib/4.screening/screening';

const b = PROFITABILITY_BENCHMARKS;
const t = SCREENING_THRESHOLDS;

function consensusStatus(consensus: string): ScoreStatus {
  const c = consensus.toLowerCase();
  if (c.includes('buy')) return 'healthy';
  if (c.includes('sell')) return 'poor';
  return 'mixed';
}

export default function OverviewTab({ data }: { data: StockData }) {
  const fairValueDeltaPct = data.currentPrice ? ((data.estimatedFairValue - data.currentPrice) / data.currentPrice) * 100 : 0;
  const latestIncomeYear = data.incomeStatement.years[data.incomeStatement.years.length - 1];
  const latestNetIncome = data.incomeStatement.rows.find((r) => r.metric === 'Net Income')?.values[latestIncomeYear] ?? 0;
  const profitabilityScore = scoreProfitability(data);
  const valuationScore = scoreValuation(data);
  const financialsStatus = consensusStatus(data.analystConsensus);

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
          status={data.dividendStatus}
          takeaway={data.dividendReasons[0] ?? 'Meets the core screening criteria, including the growth benchmarks.'}
          stats={[
            { label: 'Payout ratio', value: formatPercent(data.payoutRatio, 0), hint: `<${t.maxPayoutRatio}%`, ok: data.payoutRatio <= t.maxPayoutRatio },
            { label: 'FCF coverage', value: formatMultiple(data.fcfCoverage5Y), hint: `>${t.minFcfCoverage}x`, ok: data.fcfCoverage5Y >= t.minFcfCoverage },
            { label: '5yr Div CAGR', value: formatPercent(data.dividendCAGR5Y), hint: `>${t.dividendGrowthBenchmark}%`, ok: data.dividendCAGR5Y >= t.dividendGrowthBenchmark },
            { label: '5yr FCF CAGR', value: formatPercent(data.fcfCAGR5Y), hint: `>${t.fcfGrowthBenchmark}%`, ok: data.fcfCAGR5Y >= t.fcfGrowthBenchmark },
          ]}
          href="/stock/dividend"
        />
        <TabSummaryCard
          title="Profitability"
          status={profitabilityScore.status}
          takeaway={profitabilityScore.reasons[0] ?? 'Growth and margin both beat the benchmark.'}
          stats={[
            { label: 'Revenue CAGR 5Y', value: formatPercent(data.revenueCAGR5Y), hint: `>${b.revenueGrowthBenchmark}%`, ok: data.revenueCAGR5Y >= b.revenueGrowthBenchmark },
            { label: 'Net income CAGR 5Y', value: formatPercent(data.netIncomeCAGR5Y), hint: `>${b.netIncomeGrowthBenchmark}%`, ok: data.netIncomeCAGR5Y >= b.netIncomeGrowthBenchmark },
            { label: 'Gross margin (5Y avg)', value: formatPercent(data.grossMarginAvg5Y, 0), hint: `>${b.grossMarginBenchmark}%`, ok: data.grossMarginAvg5Y >= b.grossMarginBenchmark },
            { label: 'Net income (last yr)', value: `$${latestNetIncome.toFixed(1)}B` },
          ]}
          href="/stock/profitability"
        />
        <TabSummaryCard
          title="Sensitivity analysis"
          status={valuationScore.status}
          takeaway={`Trading ${fairValueDeltaPct >= 0 ? 'below' : 'above'} the model's fair value estimate by ${Math.abs(fairValueDeltaPct).toFixed(1)}%.`}
          stats={[
            { label: 'TTM PE', value: formatNumber(data.ttmPE), hint: `<${formatNumber(data.avgPE10Y)} avg`, ok: data.ttmPE <= data.avgPE10Y },
            { label: 'Avg PE (10Y)', value: formatNumber(data.avgPE10Y) },
            { label: 'Est. fair value', value: formatCurrency(data.estimatedFairValue), hint: `${fairValueDeltaPct >= 0 ? '+' : ''}${fairValueDeltaPct.toFixed(1)}%`, ok: fairValueDeltaPct >= 0 },
            { label: 'Est. EPS growth 5Y', value: formatPercent(data.estimatedEPSGrowth5Y), hint: '>0%', ok: data.estimatedEPSGrowth5Y > 0 },
          ]}
          href="/stock/sensitivity"
        />
        <TabSummaryCard
          title="Financials & info"
          status={financialsStatus}
          takeaway={`Analyst consensus: ${data.analystConsensus}, based on ${data.numberOfAnalysts || 'a handful of'} analysts.`}
          stats={[
            { label: 'Sector', value: data.sector },
            { label: 'Analyst rating', value: data.analystRating },
            { label: 'Debt ratio', value: formatPercent(data.debtRatio, 0), hint: `<${t.maxDebtRatio}%`, ok: data.debtRatio < t.maxDebtRatio },
            { label: 'FCF coverage 5Y', value: formatMultiple(data.fcfCoverage5Y), hint: `>${t.minFcfCoverage}x`, ok: data.fcfCoverage5Y >= t.minFcfCoverage },
          ]}
          href="/stock/financials"
        />
      </div>
    </div>
  );
}
