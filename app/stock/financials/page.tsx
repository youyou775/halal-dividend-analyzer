'use client';

import { useStockData } from '@/components/layout/StockDataContext';
import FinancialsTab from '@/components/stock/financials';

export default function FinancialsPage() {
  const { data } = useStockData();
  if (!data) return null;
  return <FinancialsTab data={data} />;
}
