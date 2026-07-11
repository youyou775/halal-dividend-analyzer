import { Card, StatusBadge } from './ui';
import type { StockData } from '@/lib/types';

const LABELS: Record<string, string> = { healthy: 'Healthy', mixed: 'Mixed', poor: 'Poor' };

export default function DividendCard({ data }: { data: StockData }) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold">Dividend</h2>
        <StatusBadge status={data.dividendStatus} label={LABELS[data.dividendStatus]} />
      </div>
      <div className="space-y-1 text-[11px]">
        <Row label="Payout ratio" value={`${data.payoutRatio.toFixed(0)}%`} hint="<70%" ok={data.payoutRatio < 70} />
        <Row label="Div yield" value={`${data.dividendYield.toFixed(2)}%`} hint=">2.0%" ok={data.dividendYield > 2} />
        <Row label="5yr Div CAGR" value={`${data.dividendCAGR5Y.toFixed(1)}%`} hint=">5%" ok={data.dividendCAGR5Y > 5} />
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
