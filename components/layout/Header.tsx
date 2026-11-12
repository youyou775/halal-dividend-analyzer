'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export default function Header({ symbol, onSearch }: { symbol: string; onSearch: (s: string) => void }) {
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim().toUpperCase());
      setQuery('');
    }
  }

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-[#e8e8e8] bg-white px-4 py-2 shadow-card dark:border-neutral-700 dark:bg-neutral-800">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-1 items-center gap-2">
        <div className="flex w-full items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 dark:bg-neutral-700">
          <Search size={14} className="text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ticker (e.g. AAPL)"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-neutral-400"
          />
        </div>
      </form>
      <div className="flex items-center gap-3">
        <span className="text-[16px] font-bold">{symbol}</span>
      </div>
    </header>
  );
}
