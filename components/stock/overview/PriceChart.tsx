'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../../shared/ui';
import type { StockData } from '@/lib/6.types/types';

const RANGES = ['YTD', '1Y', '5Y', '10Y', 'All'] as const;
type Range = (typeof RANGES)[number];

export default function PriceChart({ data }: { data: StockData }) {
  const [range, setRange] = useState<Range>('5Y');

  const filtered = useMemo(() => {
    const hist = data.priceHistory;
    if (range === 'All' || hist.length === 0) return hist;
    const now = new Date(hist[hist.length - 1].date);
    const cutoff = new Date(now);
    if (range === 'YTD') cutoff.setMonth(0, 1);
    if (range === '1Y') cutoff.setFullYear(now.getFullYear() - 1);
    if (range === '5Y') cutoff.setFullYear(now.getFullYear() - 5);
    if (range === '10Y') cutoff.setFullYear(now.getFullYear() - 10);
    return hist.filter((p) => new Date(p.date) >= cutoff);
  }, [data.priceHistory, range]);

  return (
    <Card title="Price chart" bodyClassName="flex flex-col">
      <div className="mb-1 flex shrink-0 justify-end gap-1">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded px-2 py-0.5 text-[12px] ${
              range === r
                ? 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 13 }} formatter={(v: number) => [`$${v.toFixed(2)}`, 'Price']} />
            <Line type="monotone" dataKey="close" stroke="#333333" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
