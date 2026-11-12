import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { ScoreStatus } from '@/lib/6.types/types';
import { isMissing } from '@/lib/5.utils/utils';

export const SCORE_LABELS: Record<ScoreStatus, string> = { healthy: 'Healthy', mixed: 'Mixed', poor: 'Poor' };

export function Card({
  title,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-xl border border-[#e8e8e8] bg-white p-3 shadow-card dark:border-neutral-700 dark:bg-neutral-800 ${className ?? ''}`}
    >
      {title && (
        <h2 className="mb-2 shrink-0 border-b border-[#e8e8e8] pb-2 text-[15px] font-semibold dark:border-neutral-700">
          {title}
        </h2>
      )}
      <div className={`min-h-0 flex-1 ${bodyClassName ?? ''}`}>{children}</div>
    </div>
  );
}

type Status = 'compliant' | 'noncompliant' | 'healthy' | 'mixed' | 'poor' | 'buy' | 'hold' | 'sell';

const STATUS_STYLES: Record<Status, string> = {
  compliant: 'bg-[#d4f4dd] text-[#2e7d32] dark:bg-green-900/40 dark:text-green-300',
  healthy: 'bg-[#d4f4dd] text-[#2e7d32] dark:bg-green-900/40 dark:text-green-300',
  buy: 'bg-[#d4f4dd] text-[#2e7d32] dark:bg-green-900/40 dark:text-green-300',
  noncompliant: 'bg-[#ffcccc] text-[#c62828] dark:bg-red-900/40 dark:text-red-300',
  poor: 'bg-[#ffcccc] text-[#c62828] dark:bg-red-900/40 dark:text-red-300',
  sell: 'bg-[#ffcccc] text-[#c62828] dark:bg-red-900/40 dark:text-red-300',
  mixed: 'bg-[#fff9c4] text-[#f57f17] dark:bg-yellow-900/30 dark:text-yellow-300',
  hold: 'bg-[#fff9c4] text-[#f57f17] dark:bg-yellow-900/30 dark:text-yellow-300',
};

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap ${STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
}

/**
 * The label/value/vs-benchmark row pattern used throughout (Halal card,
 * Dividend card, Profitability and Sensitivity tabs). Pass `hint` + `ok`
 * together to show a colored comparison against a good-value benchmark;
 * omit both for a plain, uncolored row.
 */
export function ScoredRow({ label, value, hint, ok }: { label: string; value: string; hint?: string; ok?: boolean }) {
  // formatPercent/formatMultiple/formatNumber all render NaN (insufficient
  // history for this window) as "—" — catch that here so an unavailable
  // value never shows as a misleading red "fail".
  const unavailable = value === '—';
  return (
    <div className="flex items-center justify-between gap-2 border-t border-[#f0f0f0] py-1 first:border-0 first:pt-0 dark:border-neutral-800">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium">{value}</span>
      {unavailable ? (
        <span className="shrink-0 text-[12px] text-neutral-400">N/A</span>
      ) : (
        hint !== undefined &&
        ok !== undefined && <span className={`shrink-0 text-[12px] font-medium ${ok ? 'text-positive' : 'text-negative'}`}>{hint}</span>
      )}
    </div>
  );
}

export function Delta({ value, suffix = '%' }: { value: number | null | undefined; suffix?: string }) {
  if (isMissing(value)) {
    return <span className="text-[12px] text-neutral-400">N/A</span>;
  }
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[12px] font-medium ${positive ? 'text-positive' : 'text-negative'}`}>
      {positive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}
