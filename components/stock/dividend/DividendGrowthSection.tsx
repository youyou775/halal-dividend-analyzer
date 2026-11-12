'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, ScoredRow } from '../../shared/ui';
import type { StockData } from '@/lib/6.types/types';
import { formatMultiple, formatPercent } from '@/lib/5.utils/utils';
import { SCREENING_THRESHOLDS } from '@/lib/4.screening/screening';

const t = SCREENING_THRESHOLDS;

export default function DividendGrowthSection({ data }: { data: StockData }) {
  const fcfChartData = data.fcfByYear.map((d) => ({ year: d.year, Dividends: d.dividendsPaid, FCF: d.fcf }));
  const divPerShareData = data.dividendHistory.map((d) => ({ year: d.date, Dividend: d.amount }));

  return (
    <Card title="Dividend growth" bodyClassName="flex flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <div className="flex min-h-0 flex-col">
          <p className="mb-1 shrink-0 text-[12px] text-neutral-500">Dividends paid vs. FCF ($B)</p>
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fcfChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 13 }} />
                <Bar dataKey="Dividends" fill="#333333" radius={[2, 2, 0, 0]} />
                <Bar dataKey="FCF" fill="#cccccc" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <p className="mb-1 shrink-0 text-[12px] text-neutral-500">Annual dividend per share ($)</p>
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={divPerShareData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 13 }} />
                <Bar dataKey="Dividend" fill="#333333" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-3 grid shrink-0 grid-cols-2 gap-3 border-t border-[#e8e8e8] pt-2 text-[13px] dark:border-neutral-700">
        <div>
          <p className="mb-1 font-semibold">Dividend CAGR</p>
          <ScoredRow label="5 year" value={formatPercent(data.dividendCAGR5Y)} hint={`>${t.dividendGrowthBenchmark}%`} ok={data.dividendCAGR5Y >= t.dividendGrowthBenchmark} />
          <ScoredRow label="10 year" value={formatPercent(data.dividendCAGR10Y)} hint={`>${t.dividendGrowthBenchmark}%`} ok={data.dividendCAGR10Y >= t.dividendGrowthBenchmark} />
          <ScoredRow label="Est. 5yr" value={formatPercent(data.estimatedDividendGrowth5Y)} />
        </div>
        <div>
          <p className="mb-1 font-semibold">Free cash flow coverage</p>
          <ScoredRow label="5 year" value={formatMultiple(data.fcfCoverage5Y)} hint={`>${t.minFcfCoverage}x`} ok={data.fcfCoverage5Y >= t.minFcfCoverage} />
          <ScoredRow label="10 year" value={formatMultiple(data.fcfCoverage10Y)} hint={`>${t.minFcfCoverage}x`} ok={data.fcfCoverage10Y >= t.minFcfCoverage} />
        </div>
      </div>
    </Card>
  );
}
