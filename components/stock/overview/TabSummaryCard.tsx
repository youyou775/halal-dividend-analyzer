import Link from 'next/link';
import { Card, StatusBadge, SCORE_LABELS } from '../../shared/ui';
import type { ScoreStatus } from '@/lib/6.types/types';

export function TabSummaryCard({
  title,
  status,
  takeaway,
  stats,
  href,
}: {
  title: string;
  status: ScoreStatus;
  takeaway: string;
  stats: { label: string; value: string; hint?: string; ok?: boolean }[];
  href: string;
}) {
  return (
    <Card className="!p-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        <StatusBadge status={status} label={SCORE_LABELS[status]} />
      </div>
      <p className="mt-1 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">{takeaway}</p>
      <div className="mt-1.5 space-y-0.5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-2 text-[12px]">
            <span className="text-neutral-400">{s.label}</span>
            <span className="font-medium">{s.value}</span>
            {s.hint !== undefined && s.ok !== undefined && (
              <span className={`shrink-0 text-[11px] font-medium ${s.ok ? 'text-positive' : 'text-negative'}`}>{s.hint}</span>
            )}
          </div>
        ))}
      </div>
      <Link
        href={href}
        className="mt-2 block text-center text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
      >
        View details →
      </Link>
    </Card>
  );
}
