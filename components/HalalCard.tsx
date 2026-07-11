import { Card, StatusBadge } from './ui';
import type { StockData } from '@/lib/types';

export default function HalalCard({ data }: { data: StockData }) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold">Halal</h2>
        <StatusBadge
          status={data.isHalalCompliant ? 'compliant' : 'noncompliant'}
          label={data.isHalalCompliant ? 'Compliant' : 'Not Compliant'}
        />
      </div>
      <div className="space-y-1 text-[11px]">
        <Row label="Sector" value={data.sector} hint="Permissible" ok={data.isHalalCompliant} />
        <Row label="Debt ratio" value={`${data.debtRatio.toFixed(0)}%`} hint="<33%" ok={data.debtRatio < 33} />
        <Row label="Haram earnings" value={`${data.haramEarningsRatio.toFixed(0)}%`} hint="<5%" ok={data.haramEarningsRatio < 5} />
      </div>
    </Card>
  );
}

function Row({ label, value, hint, ok }: { label: string; value: string; hint: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-[#f0f0f0] pt-1 first:border-0 first:pt-0 dark:border-neutral-800">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium">{value}</span>
      <span className={`text-[10px] ${ok ? 'text-positive' : 'text-negative'}`}>{hint}</span>
    </div>
  );
}
