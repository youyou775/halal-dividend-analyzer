'use client';

import { useStockData } from '@/components/layout/StockDataContext';
import ProfitabilityTab from '@/components/stock/profitability';

export default function ProfitabilityPage() {
  const { data } = useStockData();
  if (!data) return null;
  return <ProfitabilityTab data={data} />;
}
