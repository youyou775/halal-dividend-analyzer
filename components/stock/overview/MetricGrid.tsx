import { Card, Delta } from '../../shared/ui';
import type { StockData } from '@/lib/6.types/types';

export default function MetricGrid({ data }: { data: StockData }) {
  const items = [
    { label: 'Price', value: `$${data.currentPrice.toFixed(2)}`, delta: data.priceChangePct52w, hint: '52wk' },
    { label: 'Div Yield', value: `${data.dividendYield.toFixed(2)}%`, delta: data.dividendYieldChangeYoY, hint: 'vs prev yr' },
    { label: 'TTM PE', value: data.ttmPE.toFixed(0), delta: data.peVsAvg, hint: 'vs avg' },
    { label: 'Div Streak', value: `${data.dividendGrowthStreak}yrs`, delta: 0, hint: '' },
  ];

  return (
    <div className="grid h-full grid-cols-2 gap-2">
      {items.map((item) => (
        <Card key={item.label} className="!p-2.5">
          <p className="text-[12px] text-neutral-500">{item.label}</p>
          <p className="text-[20px] font-bold leading-tight">{item.value}</p>
          {item.hint && (
            <div className="mt-0.5 flex items-center gap-1">
              <Delta value={item.delta} />
              <span className="text-[11px] text-neutral-400">{item.hint}</span>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
