'use client';

export const TABS = ['Overview', 'Dividend Growth', 'Profitability', 'Sensitivity Analysis', 'Financials & Info'] as const;
export type TabId = (typeof TABS)[number];

export default function TabNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="flex shrink-0 gap-1 overflow-x-auto rounded-xl border border-[#e8e8e8] bg-white p-1 shadow-card dark:border-neutral-700 dark:bg-neutral-800">
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
            active === t
              ? 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900'
              : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
