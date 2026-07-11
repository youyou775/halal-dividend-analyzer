import { Card, StatusBadge } from './ui';
import type { StockData } from '@/lib/types';

function toStatus(rating: string): 'buy' | 'hold' | 'sell' {
  const r = rating.toLowerCase();
  if (r.includes('buy')) return 'buy';
  if (r.includes('sell')) return 'sell';
  return 'hold';
}

export default function SentimentCard({ data }: { data: StockData }) {
  return (
    <Card title="Market sentiment">
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">Yahoo Finance</span>
          <StatusBadge status={toStatus(data.analystRating)} label={data.analystRating} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">Analyst consensus</span>
          <StatusBadge status={toStatus(data.analystConsensus)} label={data.analystConsensus} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-500"># of analysts</span>
          <span className="font-medium">{data.numberOfAnalysts}</span>
        </div>
      </div>
    </Card>
  );
}
