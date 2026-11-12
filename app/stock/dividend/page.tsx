'use client';

import { useStockData } from '@/components/layout/StockDataContext';
import DividendTab from '@/components/stock/dividend';

export default function DividendPage() {
  const { data } = useStockData();
  if (!data) return null;
  return <DividendTab data={data} />;
}
