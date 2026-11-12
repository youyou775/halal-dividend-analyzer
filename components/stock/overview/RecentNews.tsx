import { ExternalLink } from 'lucide-react';
import { Card } from '../../shared/ui';
import type { StockData } from '@/lib/6.types/types';

export default function RecentNews({ data }: { data: StockData }) {
  return (
    <Card title="Recent news">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {data.recentNews.slice(0, 2).map((item, i) => (
          <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="group text-[13px]">
            <p className="flex items-start gap-1 font-medium leading-snug group-hover:underline">
              {item.title}
              <ExternalLink size={10} className="mt-0.5 shrink-0 text-neutral-400" />
            </p>
            <p className="mt-0.5 text-[12px] text-neutral-400">
              {item.publisher} • {item.date}
            </p>
          </a>
        ))}
      </div>
    </Card>
  );
}
