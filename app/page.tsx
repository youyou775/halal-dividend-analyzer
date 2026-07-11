'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import HalalCard from '@/components/HalalCard';
import DividendCard from '@/components/DividendCard';
import MetricGrid from '@/components/MetricGrid';
import SentimentCard from '@/components/SentimentCard';
import DividendGrowthSection from '@/components/DividendGrowthSection';
import ValuationSection from '@/components/ValuationSection';
import PriceChart from '@/components/PriceChart';
import RecentNews from '@/components/RecentNews';
import CompanyInfo from '@/components/CompanyInfo';
import FinancialStatements from '@/components/FinancialStatements';
import { LoadingState, ErrorState, SampleBanner } from '@/components/StatusViews';
import type { StockData } from '@/lib/types';

export default function DashboardPage() {
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
    <div className="flex h-screen flex-col gap-2 overflow-hidden p-2 md:gap-3 md:p-3">
      <Header symbol={symbol} onSearch={loadStock} />
      {isSample && !loading && <SampleBanner />}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && <LoadingState />}
        {error && !loading && <ErrorState message={error} onRetry={() => loadStock(symbol)} />}
        {data && !loading && !error && (
          <div className="grid h-full grid-cols-1 gap-2 md:gap-3 lg:grid-cols-12">
            <div className="flex min-h-0 flex-col gap-2 md:gap-3 lg:col-span-2">
              <div className="min-h-0 flex-1">
                <HalalCard data={data} />
              </div>
              <div className="min-h-0 flex-1">
                <DividendCard data={data} />
              </div>
              <div className="min-h-0 flex-[1.3]">
                <MetricGrid data={data} />
              </div>
              <div className="min-h-0 flex-1">
                <SentimentCard data={data} />
              </div>
            </div>
            <div className="flex min-h-0 flex-col gap-2 md:gap-3 lg:col-span-5">
              <div className="min-h-0 flex-1">
                <DividendGrowthSection data={data} />
              </div>
              <div className="min-h-0 flex-1">
                <ValuationSection data={data} />
              </div>
            </div>
            <div className="flex min-h-0 flex-col gap-2 md:gap-3 lg:col-span-5">
              <div className="min-h-0 flex-1">
                <PriceChart data={data} />
              </div>
              <div className="min-h-0 flex-[0.7]">
                <RecentNews data={data} />
              </div>
              <div className="min-h-0 flex-[0.7]">
                <CompanyInfo data={data} />
              </div>
              <div className="min-h-0 flex-[1.6]">
                <FinancialStatements data={data} />
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="shrink-0 text-center text-[9px] text-neutral-400">
        Automated Shariah and dividend screening is approximate and for informational purposes only — not
        financial or religious advice. Verify with a qualified advisor before investing.
      </p>
    </div>
  );
}
