import { Card } from './ui';
import type { StockData } from '@/lib/types';

export default function CompanyInfo({ data }: { data: StockData }) {
  return (
    <Card title="Company info">
      <p className="line-clamp-4 text-[11px] text-neutral-600 dark:text-neutral-300">{data.description}</p>
    </Card>
  );
}
