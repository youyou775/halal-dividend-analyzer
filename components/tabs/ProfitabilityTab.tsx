'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Card } from '../ui';
import type { StockData } from '@/lib/types';
import { formatCompactBillions, formatCurrency, formatPercent } from '@/lib/utils';

export default function ProfitabilityTab({ data }: { data: StockData }) {
  const latest = data.profitabilityByYear[data.profitabilityByYear.length - 1];
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
            <Card className="!p-2">
              <p className="text-[10px] text-neutral-500">Revenue (last yr)</p>
              <p className="text-[16px] font-bold leading-tight">{latest ? formatCompactBillions(latest.revenue) : '—'}</p>
            </Card>
            <Card className="!p-2">
              <p className="text-[10px] text-neutral-500">Gross Profit</p>
              <p className="text-[16px] font-bold leading-tight">{latest ? formatCompactBillions(latest.grossProfit) : '—'}</p>
            </Card>
            <Card className="!p-2">
              <p className="text-[10px] text-neutral-500">Net Income</p>
              <p className="text-[16px] font-bold leading-tight">{latest ? formatCompactBillions(latest.netIncome) : '—'}</p>
            </Card>
            <Card className="!p-2">
              <p className="text-[10px] text-neutral-500">EPS</p>
              <p className="text-[16px] font-bold leading-tight">{latest ? formatCurrency(latest.eps) : '—'}</p>
            </Card>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <Card title="Growth & margin">
            <div className="space-y-2 text-[11px]">
              <div>
                <p className="mb-1 font-semibold">Revenue CAGR</p>
                <Row label="5 year" value={formatPercent(data.revenueCAGR5Y)} />
                <Row label="10 year" value={formatPercent(data.revenueCAGR10Y)} />
              </div>
              <div>
                <p className="mb-1 font-semibold">Net income CAGR</p>
                <Row label="5 year" value={formatPercent(data.netIncomeCAGR5Y)} />
                <Row label="10 year" value={formatPercent(data.netIncomeCAGR10Y)} />
              </div>
              <div>
                <p className="mb-1 font-semibold">Gross profit ratio</p>
                <Row label="5yr avg" value={formatPercent(data.grossMarginAvg5Y, 0)} />
                <Row label="10yr avg" value={formatPercent(data.grossMarginAvg10Y, 0)} />
                <Row label="Last year" value={formatPercent(data.lastYearGrossMargin, 0)} />
              </div>
            </div>
          </Card>
        </div>
      </div>
      <div className="min-h-0 lg:col-span-9">
        <Card title="Revenue vs. cost of revenue" bodyClassName="flex flex-col">
          <div className="min-h-0 flex-[1.4]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Revenue" fill="#333333" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Cost of Revenue" fill="#cccccc" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 min-h-0 flex-1 shrink-0 border-t border-[#e8e8e8] pt-2 dark:border-neutral-700">
            <p className="mb-1 shrink-0 text-[10px] text-neutral-500">Gross margin trend (%)</p>
            <div className="h-[calc(100%-16px)]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v}%`, 'Gross Margin']} />
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
