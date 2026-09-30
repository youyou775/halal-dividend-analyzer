import DividendCard from '../DividendCard';
import DividendGrowthSection from '../DividendGrowthSection';
import { Card } from '../ui';
import type { StockData } from '@/lib/types';

export default function DividendTab({ data }: { data: StockData }) {
  return (
    <div className="grid h-full grid-cols-1 gap-2 md:gap-3 lg:grid-cols-12">
      <div className="flex min-h-0 flex-col gap-2 md:gap-3 lg:col-span-3">
        <div className="min-h-0 flex-1">
          <DividendCard data={data} />
        </div>
        <div className="min-h-0 flex-1">
          <Card title="Screening detail" bodyClassName="overflow-y-auto">
            {data.dividendReasons.length === 0 ? (
              <p className="text-[11px] text-neutral-500">Meets every dividend screening criterion, including the preferred ones.</p>
            ) : (
              <ul className="space-y-1.5 text-[11px] text-neutral-600 dark:text-neutral-300">
                {data.dividendReasons.map((r, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-neutral-400">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
      <div className="min-h-0 lg:col-span-9">
        <DividendGrowthSection data={data} />
      </div>
    </div>
  );
}
