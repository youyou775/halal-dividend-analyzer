'use client';

import { useState, useEffect } from 'react';
import { Search, Moon, Sun } from 'lucide-react';

export default function Header({ symbol, onSearch }: { symbol: string; onSearch: (s: string) => void }) {
  const [query, setQuery] = useState('');
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim().toUpperCase());
      setQuery('');
    }
  }

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-[#e8e8e8] bg-white px-4 py-2 shadow-card dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex items-center gap-2 text-[15px] font-bold">
        <span aria-hidden>🕌</span>
        <span className="hidden sm:inline">Halal Dividend Analyzer</span>
      </div>
      <form onSubmit={handleSubmit} className="mx-2 flex w-full max-w-xs flex-1 items-center gap-2">
        <div className="flex w-full items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 dark:bg-neutral-700">
          <Search size={14} className="text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ticker (e.g. AAPL)"
            className="w-full bg-transparent text-[12px] outline-none placeholder:text-neutral-400"
          />
        </div>
      </form>
      <div className="flex items-center gap-3">
        <span className="text-[14px] font-bold">{symbol}</span>
        <button
          onClick={toggleDark}
          aria-label="Toggle dark mode"
          className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
