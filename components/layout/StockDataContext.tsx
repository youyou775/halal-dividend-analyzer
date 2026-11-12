'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { StockData } from '@/lib/6.types/types';

interface StockDataContextValue {
  symbol: string;
  data: StockData | null;
  isSample: boolean;
  loading: boolean;
  error: string | null;
  loadStock: (symbol: string) => Promise<void>;
}

const StockDataContext = createContext<StockDataContextValue | null>(null);

/**
 * Wraps the five /stock/* routes (see app/stock/layout.tsx) so they share one
 * fetch instead of each tab re-fetching independently. This is the only
 * place that knows how to talk to /api/stock/[symbol] — everything else
 * (tab components, pages) just reads `data` off this context.
 */
export function StockDataProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbol] = useState('AAPL');
  const [data, setData] = useState<StockData | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStock = useCallback(async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(sym)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Symbol not found');
      setData(json.data);
      setIsSample(Boolean(json.isSample));
      setSymbol(sym.toUpperCase());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStock('AAPL');
  }, [loadStock]);

  return (
    <StockDataContext.Provider value={{ symbol, data, isSample, loading, error, loadStock }}>
      {children}
    </StockDataContext.Provider>
  );
}

export function useStockData(): StockDataContextValue {
  const ctx = useContext(StockDataContext);
  if (!ctx) throw new Error('useStockData must be called within a StockDataProvider (see app/stock/layout.tsx)');
  return ctx;
}
