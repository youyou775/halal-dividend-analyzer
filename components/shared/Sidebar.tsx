'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Construction } from 'lucide-react';

/**
 * Single source of truth for the app's navigation structure. Add a page
 * here (built or planned) and it shows up in the sidebar — this is meant to
 * double as the project's visible roadmap, not just a menu. `status:
 * 'planned'` pages render as disabled with a "Coming soon" tag rather than
 * being left out, per the project's "plan pages before building them" goal.
 * See ARCHITECTURE.md for how a planned page becomes a built one.
 */
const NAV_SECTIONS: {
  label: string;
  items: { label: string; href: string; status: 'built' | 'planned' }[];
}[] = [
  {
    label: 'Stock Analysis',
    items: [
      { label: 'Overview', href: '/stock/overview', status: 'built' },
      { label: 'Dividend Growth', href: '/stock/dividend', status: 'built' },
      { label: 'Profitability', href: '/stock/profitability', status: 'built' },
      { label: 'Sensitivity Analysis', href: '/stock/sensitivity', status: 'built' },
      { label: 'Financials & Info', href: '/stock/financials', status: 'built' },
    ],
  },
  {
    label: 'Portfolio Tools',
    items: [
      { label: 'Diversification', href: '/portfolio/diversification', status: 'planned' },
      { label: 'Purification', href: '/portfolio/purification', status: 'planned' },
      { label: 'Income & Growth', href: '/portfolio/income', status: 'planned' },
      { label: 'Top 10 Discounts', href: '/screener', status: 'planned' },
      { label: 'Import Portfolio', href: '/portfolio/import', status: 'planned' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // localStorage may be unavailable (e.g. private browsing) — theme just won't persist
    }
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r border-[#e8e8e8] bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex items-center gap-2 px-1 text-[16px] font-bold">
        <span aria-hidden>🕌</span>
        <span>Halal Analyzer</span>
      </div>

      <nav className="flex flex-1 flex-col gap-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-1 px-1 text-[12px] font-semibold uppercase tracking-wide text-neutral-400">{section.label}</p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                if (item.status === 'planned') {
                  return (
                    <div
                      key={item.href}
                      title="Planned — not built yet"
                      className="flex cursor-not-allowed items-center justify-between rounded-lg px-2 py-1.5 text-[14px] text-neutral-400 dark:text-neutral-500"
                    >
                      <span>{item.label}</span>
                      <Construction size={11} className="shrink-0" />
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-2 py-1.5 text-[14px] font-medium transition-colors ${
                      active
                        ? 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900'
                        : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={toggleDark}
        aria-label="Toggle dark mode"
        className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-[14px] text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
      >
        {dark ? <Sun size={14} /> : <Moon size={14} />}
        {dark ? 'Light mode' : 'Dark mode'}
      </button>
    </aside>
  );
}
