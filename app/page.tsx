'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import TabNav, { TABS, type TabId } from '@/components/TabNav';
import OverviewTab from '@/components/tabs/OverviewTab';
import DividendTab from '@/components/tabs/DividendTab';
import ProfitabilityTab from '@/components/tabs/ProfitabilityTab';
import SensitivityTab from '@/components/tabs/SensitivityTab';
import FinancialsTab from '@/components/tabs/FinancialsTab';
import { LoadingState, ErrorState, SampleBanner } from '@/components/StatusViews';
import type { StockData } from '@/lib/types';

export default function DashboardPage() {
  const [symbol, setSymbol] = useState('AAPL');
  const [data, setData] = useState<StockData | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(TABS[0]);

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
    <div className="flex h-screen flex-col gap-2 overflow-hidden p-2 md:gap-3 md:p-3">
      <Header symbol={symbol} onSearch={loadStock} />
      <TabNav active={activeTab} onChange={setActiveTab} />
      {isSample && !loading && <SampleBanner />}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && <LoadingState />}
        {error && !loading && <ErrorState message={error} onRetry={() => loadStock(symbol)} />}
        {data && !loading && !error && (
          <>
            {activeTab === 'Overview' && <OverviewTab data={data} onNavigate={setActiveTab} />}
            {activeTab === 'Dividend Growth' && <DividendTab data={data} />}
            {activeTab === 'Profitability' && <ProfitabilityTab data={data} />}
            {activeTab === 'Sensitivity Analysis' && <SensitivityTab data={data} />}
            {activeTab === 'Financials & Info' && <FinancialsTab data={data} />}
          </>
        )}
      </div>
      <p className="shrink-0 text-center text-[9px] text-neutral-400">
        Automated Shariah and dividend screening, and the sensitivity/projection figures, are approximate and for
        informational purposes only — not financial or religious advice. Verify with a qualified advisor before
        investing.
      </p>
    </div>
  );
}
