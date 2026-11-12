import { Card, Delta, StatusBadge, ScoredRow, SCORE_LABELS } from '../../shared/ui';
import type { StockData } from '@/lib/6.types/types';
import { formatCurrency, formatMultiple, formatPercent, formatNumber, isMissing } from '@/lib/5.utils/utils';
import { scoreValuation } from '@/lib/4.screening/screening';

export default function SensitivityTab({ data }: { data: StockData }) {
  const score = scoreValuation(data);
  const fairValueDeltaPct = data.currentPrice ? ((data.estimatedFairValue - data.currentPrice) / data.currentPrice) * 100 : 0;
  const projectedEPS = (years: number) => data.ttmEPS * Math.pow(1 + data.estimatedEPSGrowth5Y / 100, years);
  // Fall back to the 5yr average, then TTM, if there isn't enough history for
  // a genuine 10yr average — keeps the grid from silently filling with NaN.
  const peBasis = !isMissing(data.avgPE10Y) && data.avgPE10Y > 0 ? data.avgPE10Y : !isMissing(data.avgPE5Y) && data.avgPE5Y > 0 ? data.avgPE5Y : data.ttmPE;
  const peScenarios = [
    { label: 'Bear', pe: peBasis * 0.85 },
    { label: 'Base', pe: peBasis },
    { label: 'Bull', pe: Math.max(peBasis, data.ttmPE) * 1.1 },
  ];
  const horizons = [1, 3, 5];
  return (
    <div className="grid h-full grid-cols-1 gap-2 md:gap-3 lg:grid-cols-12">
      <div className="flex min-h-0 flex-col gap-2 md:gap-3 lg:col-span-4">
        <div className="min-h-0 flex-1">
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">PE: current vs. average</h2>
              <StatusBadge status={score.status} label={SCORE_LABELS[score.status]} />
            </div>
            <div className="text-[13px]">
              <ScoredRow label="TTM PE" value={formatNumber(data.ttmPE)} hint={`<${formatNumber(data.avgPE10Y)} avg`} ok={data.ttmPE <= data.avgPE10Y} />
              <ScoredRow label="5yr avg PE" value={formatNumber(data.avgPE5Y)} />
              <ScoredRow label="10yr avg PE" value={formatNumber(data.avgPE10Y)} />
              <div className="flex items-center justify-between border-t border-[#f0f0f0] py-1 dark:border-neutral-800">
                <span className="text-neutral-500">TTM vs. 10yr avg</span>
                <Delta value={data.peVsAvg} />
              </div>
            </div>
          </Card>
        </div>
        <div className="min-h-0 flex-1">
          <Card title="Forward estimate (5yr)">
            <div className="text-[13px]">
              <ScoredRow label="Predicted EPS growth" value={formatPercent(data.estimatedEPSGrowth5Y)} hint=">0%" ok={data.estimatedEPSGrowth5Y > 0} />
              <ScoredRow label="Implied EPS CAGR" value={formatPercent(data.epsCAGR5Y)} />
              <ScoredRow label="Est. fair PE" value={formatMultiple(data.estimatedPE)} />
              <ScoredRow
                label="Est. fair value"
                value={formatCurrency(data.estimatedFairValue)}
                hint={`${fairValueDeltaPct >= 0 ? '+' : ''}${fairValueDeltaPct.toFixed(1)}% vs price`}
                ok={fairValueDeltaPct >= 0}
              />
            </div>
          </Card>
        </div>
        <div className="min-h-0 flex-[1.4]">
          <Card title="Price sensitivity grid" bodyClassName="flex flex-col">
            <p className="mb-1 shrink-0 text-[12px] text-neutral-500">Projected price = PE scenario × projected EPS</p>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#e8e8e8] text-left text-neutral-500 dark:border-neutral-700">
                    <th className="py-1 font-medium">PE scenario</th>
                    {horizons.map((h) => (
                      <th key={h} className="py-1 text-right font-medium">
                        {h}yr
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {peScenarios.map((s) => (
                    <tr key={s.label} className="border-b border-[#f0f0f0] dark:border-neutral-800">
                      <td className="py-1 text-neutral-600 dark:text-neutral-300">
                        {s.label} <span className="text-neutral-400">({s.pe.toFixed(1)}x)</span>
                      </td>
                      {horizons.map((h) => (
                        <td key={h} className="py-1 text-right font-medium">
                          {formatCurrency(s.pe * projectedEPS(h))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
      <div className="min-h-0 lg:col-span-8">
        <Card title="10-year history: EPS, PE, price & returns" bodyClassName="flex flex-col">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e8e8e8] text-left text-neutral-500 dark:border-neutral-700">
                  <th className="sticky left-0 top-0 bg-white py-1 pr-2 font-medium dark:bg-neutral-800">Year</th>
                  <th className="sticky top-0 bg-white py-1 pl-2 text-right font-medium dark:bg-neutral-800">EPS</th>
                  <th className="sticky top-0 bg-white py-1 pl-2 text-right font-medium dark:bg-neutral-800">PE</th>
                  <th className="sticky top-0 bg-white py-1 pl-2 text-right font-medium dark:bg-neutral-800">Price</th>
                  <th className="sticky top-0 bg-white py-1 pl-2 text-right font-medium dark:bg-neutral-800">Div/Share</th>
                  <th className="sticky top-0 bg-white py-1 pl-2 text-right font-medium dark:bg-neutral-800">Total Return</th>
                  <th className="sticky top-0 bg-white py-1 pl-2 text-right font-medium dark:bg-neutral-800">Compounded</th>
                </tr>
              </thead>
              <tbody>
                {data.historicalReturns.map((r, i) => (
                  <tr key={r.year} className="border-b border-[#f0f0f0] dark:border-neutral-800">
                    <td className="sticky left-0 bg-white py-1 pr-2 font-medium dark:bg-neutral-800">{r.year}</td>
                    <td className="py-1 pl-2 text-right">{formatCurrency(r.eps)}</td>
                    <td className="py-1 pl-2 text-right">{r.pe > 0 ? r.pe.toFixed(1) : '—'}</td>
                    <td className="py-1 pl-2 text-right">{formatCurrency(r.price)}</td>
                    <td className="py-1 pl-2 text-right">{formatCurrency(r.dividendPerShare)}</td>
                    <td className="py-1 pl-2 text-right">
                      {i === 0 ? <span className="text-neutral-400">—</span> : <Delta value={r.totalReturnPct} />}
                    </td>
                    <td className="py-1 pl-2 text-right">
                      {i === 0 ? <span className="text-neutral-400">—</span> : <Delta value={r.compoundedReturnPct} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}


