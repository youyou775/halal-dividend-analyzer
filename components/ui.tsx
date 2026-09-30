import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

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
        <h2 className="mb-2 shrink-0 border-b border-[#e8e8e8] pb-2 text-[13px] font-semibold dark:border-neutral-700">
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
}

export function Delta({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${positive ? 'text-positive' : 'text-negative'}`}>
      {positive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}
