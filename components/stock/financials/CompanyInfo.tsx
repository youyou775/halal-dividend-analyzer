import { Card } from '../../shared/ui';
import type { StockData } from '@/lib/6.types/types';

export default function CompanyInfo({ data }: { data: StockData }) {
  return (
    <Card title="Company info">
      <p className="line-clamp-4 text-[13px] text-neutral-600 dark:text-neutral-300">{data.description}</p>
    </Card>
  );
}
