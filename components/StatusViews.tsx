import { AlertCircle, RefreshCw } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-[12px] text-neutral-400">
      <RefreshCw size={14} className="animate-spin" /> Loading stock data…
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-[12px] text-neutral-500">
      <AlertCircle size={20} className="text-negative" />
      <p>{message}</p>
      <button
        onClick={onRetry}
        className="rounded-md bg-neutral-800 px-3 py-1 text-[11px] text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        Try again
      </button>
    </div>
  );
}

export function SampleBanner() {
  return (
    <div className="shrink-0 rounded-lg border border-yellow-200 bg-yellow-50 py-1 text-center text-[10px] text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
      Showing sample data — add an FMP_API_KEY in .env.local for live data.
    </div>
  );
}
