'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Card, StatusBadge, ScoredRow, SCORE_LABELS } from '../../shared/ui';
import type { StockData } from '@/lib/6.types/types';
import { formatCompactBillions, formatCurrency, formatPercent } from '@/lib/5.utils/utils';
import { scoreProfitability, PROFITABILITY_BENCHMARKS } from '@/lib/4.screening/screening';

const b = PROFITABILITY_BENCHMARKS;

export default function ProfitabilityTab({ data }: { data: StockData }) {
  const latest = data.profitabilityByYear[data.profitabilityByYear.length - 1];
  const score = scoreProfitability(data);
  const chartData = data.profitabilityByYear.map((p) => ({
    year: p.year,
    Revenue: p.revenue,
    'Cost of Revenue': p.costOfRevenue,
    'Gross Margin': Number(p.grossMargin.toFixed(1)),
  }));

  return (
    <div className="grid h-full grid-cols-1 gap-2 md:gap-3 lg:grid-cols-12">
      <div className="flex min-h-0 flex-col gap-2 md:gap-3 lg:col-span-3">
        <div className="min-h-0 flex-1">
          <div className="grid h-full grid-cols-2 gap-2">
            <Card className="!p-2.5">
              <p className="text-[12px] text-neutral-500">Revenue (last yr)</p>
              <p className="text-[18px] font-bold leading-tight">{latest ? formatCompactBillions(latest.revenue) : '—'}</p>
            </Card>
            <Card className="!p-2.5">
              <p className="text-[12px] text-neutral-500">Gross Profit</p>
              <p className="text-[18px] font-bold leading-tight">{latest ? formatCompactBillions(latest.grossProfit) : '—'}</p>
            </Card>
            <Card className="!p-2.5">
              <p className="text-[12px] text-neutral-500">Net Income</p>
              <p className="text-[18px] font-bold leading-tight">{latest ? formatCompactBillions(latest.netIncome) : '—'}</p>
            </Card>
            <Card className="!p-2.5">
              <p className="text-[12px] text-neutral-500">EPS</p>
              <p className="text-[18px] font-bold leading-tight">{latest ? formatCurrency(latest.eps) : '—'}</p>
            </Card>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Growth & margin</h2>
              <StatusBadge status={score.status} label={SCORE_LABELS[score.status]} />
            </div>
            <div className="space-y-2 text-[13px]">
              <div>
                <p className="mb-1 font-semibold">Revenue CAGR</p>
                <ScoredRow label="5 year" value={formatPercent(data.revenueCAGR5Y)} hint={`>${b.revenueGrowthBenchmark}%`} ok={data.revenueCAGR5Y >= b.revenueGrowthBenchmark} />
                <ScoredRow label="10 year" value={formatPercent(data.revenueCAGR10Y)} hint={`>${b.revenueGrowthBenchmark}%`} ok={data.revenueCAGR10Y >= b.revenueGrowthBenchmark} />
              </div>
              <div>
                <p className="mb-1 font-semibold">Net income CAGR</p>
                <ScoredRow label="5 year" value={formatPercent(data.netIncomeCAGR5Y)} hint={`>${b.netIncomeGrowthBenchmark}%`} ok={data.netIncomeCAGR5Y >= b.netIncomeGrowthBenchmark} />
                <ScoredRow label="10 year" value={formatPercent(data.netIncomeCAGR10Y)} hint={`>${b.netIncomeGrowthBenchmark}%`} ok={data.netIncomeCAGR10Y >= b.netIncomeGrowthBenchmark} />
              </div>
              <div>
                <p className="mb-1 font-semibold">Gross profit ratio</p>
                <ScoredRow label="5yr avg" value={formatPercent(data.grossMarginAvg5Y, 0)} hint={`>${b.grossMarginBenchmark}%`} ok={data.grossMarginAvg5Y >= b.grossMarginBenchmark} />
                <ScoredRow label="10yr avg" value={formatPercent(data.grossMarginAvg10Y, 0)} hint={`>${b.grossMarginBenchmark}%`} ok={data.grossMarginAvg10Y >= b.grossMarginBenchmark} />
                <ScoredRow label="Last year" value={formatPercent(data.lastYearGrossMargin, 0)} hint={`>${b.grossMarginBenchmark}%`} ok={data.lastYearGrossMargin >= b.grossMarginBenchmark} />
              </div>
            </div>
          </Card>
        </div>
      </div>
      <div className="min-h-0 lg:col-span-9">
        <Card title="Revenue vs. cost of revenue (10yr)" bodyClassName="flex flex-col">
          <div className="min-h-0 flex-[1.4]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Revenue" fill="#333333" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Cost of Revenue" fill="#cccccc" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 min-h-0 flex-1 shrink-0 border-t border-[#e8e8e8] pt-2 dark:border-neutral-700">
            <p className="mb-1 shrink-0 text-[12px] text-neutral-500">Gross margin trend (%, 10yr)</p>
            <div className="h-[calc(100%-16px)]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 13 }} formatter={(v: number) => [`${v}%`, 'Gross Margin']} />
                  <Line type="monotone" dataKey="Gross Margin" stroke="#333333" strokeWidth={1.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
