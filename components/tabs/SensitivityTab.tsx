import { Card, Delta } from '../ui';
import type { StockData } from '@/lib/types';
import { formatCurrency, formatMultiple, formatPercent } from '@/lib/utils';

export default function SensitivityTab({ data }: { data: StockData }) {
  const projectedEPS = (years: number) => data.ttmEPS * Math.pow(1 + data.estimatedEPSGrowth5Y / 100, years);
  const peScenarios = [
    { label: 'Bear', pe: data.avgPE10Y * 0.85 },
    { label: 'Base', pe: data.avgPE10Y || data.ttmPE },
    { label: 'Bull', pe: Math.max(data.avgPE10Y, data.ttmPE) * 1.1 },
  ];
  const horizons = [1, 3, 5];

  return (
    <div className="grid h-full grid-cols-1 gap-2 md:gap-3 lg:grid-cols-12">
      <div className="flex min-h-0 flex-col gap-2 md:gap-3 lg:col-span-4">
        <div className="min-h-0 flex-1">
          <Card title="PE: current vs. average">
            <div className="space-y-1 text-[11px]">
              <Row label="TTM PE" value={data.ttmPE.toFixed(1)} />
              <Row label="5yr avg PE" value={data.avgPE5Y.toFixed(1)} />
              <Row label="10yr avg PE" value={data.avgPE10Y.toFixed(1)} />
              <div className="flex items-center justify-between border-t border-[#f0f0f0] pt-1 dark:border-neutral-800">
                <span className="text-neutral-500">TTM vs. 10yr avg</span>
                <Delta value={data.peVsAvg} />
              </div>
            </div>
          </Card>
        </div>
        <div className="min-h-0 flex-1">
          <Card title="Forward estimate (5yr)">
            <div className="space-y-1 text-[11px]">
              <Row label="Predicted EPS growth" value={formatPercent(data.estimatedEPSGrowth5Y)} />
              <Row label="Implied EPS CAGR" value={formatPercent(data.epsCAGR5Y)} />
              <Row label="Est. fair PE" value={formatMultiple(data.estimatedPE)} />
              <Row label="Est. fair value" value={formatCurrency(data.estimatedFairValue)} />
            </div>
          </Card>
        </div>
        <div className="min-h-0 flex-[1.4]">
          <Card title="Price sensitivity grid" bodyClassName="flex flex-col">
            <p className="mb-1 shrink-0 text-[10px] text-neutral-500">Projected price = PE scenario × projected EPS</p>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-[11px]">
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
            <table className="w-full text-[11px]">
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
