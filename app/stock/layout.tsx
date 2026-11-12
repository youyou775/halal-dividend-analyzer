'use client';

import Header from '@/components/layout/Header';
import { LoadingState, ErrorState, SampleBanner } from '@/components/layout/StatusViews';
import { StockDataProvider, useStockData } from '@/components/layout/StockDataContext';

function StockShell({ children }: { children: React.ReactNode }) {
  const { symbol, data, isSample, loading, error, loadStock } = useStockData();

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-2 md:gap-3 md:p-3">
      <Header symbol={symbol} onSearch={loadStock} />
      {isSample && !loading && <SampleBanner />}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && <LoadingState />}
        {error && !loading && <ErrorState message={error} onRetry={() => loadStock(symbol)} />}
        {data && !loading && !error && children}
      </div>
      <p className="shrink-0 text-center text-[11px] text-neutral-400">
        Automated Shariah and dividend screening, and the sensitivity/projection figures, are approximate and for
        informational purposes only — not financial or religious advice. Verify with a qualified advisor before
        investing.
      </p>
    </div>
  );
}

/**
 * Everything under /stock/* shares one fetched StockData via
 * StockDataProvider (components/layout/StockDataContext.tsx), so switching tabs
 * (now real routes) doesn't re-fetch. See ARCHITECTURE.md.
 */
export default function StockLayout({ children }: { children: React.ReactNode }) {
  return (
    <StockDataProvider>
      <StockShell>{children}</StockShell>
    </StockDataProvider>
  );
}
