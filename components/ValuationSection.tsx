'use client';

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Card } from './ui';
import type { StockData } from '@/lib/types';
import { formatCurrency, formatMultiple, formatPercent } from '@/lib/utils';

export default function ValuationSection({ data }: { data: StockData }) {
  const fairValueDeltaPct = data.currentPrice
    ? ((data.estimatedFairValue - data.currentPrice) / data.currentPrice) * 100
    : 0;

  return (
    <Card title="Valuation analysis" bodyClassName="flex flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <div className="flex min-h-0 flex-col">
          <p className="mb-1 shrink-0 text-[10px] text-neutral-500">PE ratio (trailing)</p>
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.peByYear} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <ReferenceLine y={data.avgPE10Y} stroke="#999999" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="pe" stroke="#333333" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <p className="mb-1 shrink-0 text-[10px] text-neutral-500">Revenue ($B) & EPS ($)</p>
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.revenueByYear} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="revenue" fill="#cccccc" radius={[2, 2, 0, 0]} />
                <Line yAxisId="right" dataKey="eps" stroke="#333333" strokeWidth={1.5} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-3 grid shrink-0 grid-cols-2 gap-3 border-t border-[#e8e8e8] pt-2 text-[11px] dark:border-neutral-700">
        <div>
          <p className="mb-1 font-semibold">Future estimates (5yr)</p>
          <Row label="Div growth" value={formatPercent(data.estimatedDividendGrowth5Y)} />
          <Row label="Fair PE" value={formatMultiple(data.estimatedPE)} />
          <Row label="EPS growth" value={formatPercent(data.estimatedEPSGrowth5Y)} />
        </div>
        <div>
          <p className="mb-1 font-semibold">Fair value estimate</p>
          <Row label="Price" value={formatCurrency(data.currentPrice)} />
          <Row label="Est. fair value" value={formatCurrency(data.estimatedFairValue)} />
          <div className="mt-1 flex justify-end">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                fairValueDeltaPct >= 0 ? 'bg-[#d4f4dd] text-[#2e7d32]' : 'bg-[#ffcccc] text-[#c62828]'
              }`}
            >
              {fairValueDeltaPct >= 0 ? '+' : ''}
              {fairValueDeltaPct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 grid shrink-0 grid-cols-3 gap-2 border-t border-[#e8e8e8] pt-2 text-[11px] dark:border-neutral-700">
        <div>
          <p className="text-neutral-500">EPS 5Y CAGR</p>
          <p className="font-semibold">{formatPercent(data.epsCAGR5Y)}</p>
        </div>
        <div>
          <p className="text-neutral-500">EPS 10Y CAGR</p>
          <p className="font-semibold">{formatPercent(data.epsCAGR10Y)}</p>
        </div>
        <div>
          <p className="text-neutral-500">FCF 5Y CAGR</p>
          <p className="font-semibold">{formatPercent(data.fcfCAGR5Y)}</p>
        </div>
      </div>
    </Card>
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
