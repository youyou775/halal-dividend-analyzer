import { Card } from './ui';

export function TabSummaryCard({
  title,
  takeaway,
  stats,
  onOpen,
}: {
  title: string;
  takeaway: string;
  stats: { label: string; value: string }[];
  onOpen: () => void;
}) {
  return (
    <Card className="!p-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold">{title}</h3>
        <button onClick={onOpen} className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
          View →
        </button>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-neutral-500 dark:text-neutral-400">{takeaway}</p>
      <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
        {stats.map((s) => (
          <div key={s.label} className="flex justify-between text-[10px]">
            <span className="text-neutral-400">{s.label}</span>
            <span className="font-medium">{s.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
