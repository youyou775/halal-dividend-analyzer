import { Card, StatusBadge, ScoredRow } from '../../shared/ui';
import type { StockData } from '@/lib/6.types/types';

export default function HalalCard({ data }: { data: StockData }) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Halal</h2>
        <StatusBadge
          status={data.isHalalCompliant ? 'compliant' : 'noncompliant'}
          label={data.isHalalCompliant ? 'Compliant' : 'Not Compliant'}
        />
      </div>
      <div className="text-[13px]">
        <ScoredRow label="Sector" value={data.sector} hint="Permissible" ok={data.isHalalCompliant} />
        <ScoredRow label="Debt ratio" value={`${data.debtRatio.toFixed(0)}%`} hint="<33%" ok={data.debtRatio < 33} />
        <ScoredRow label="Haram earnings" value={`${data.haramEarningsRatio.toFixed(0)}%`} hint="<5%" ok={data.haramEarningsRatio < 5} />
      </div>
    </Card>
  );
}
