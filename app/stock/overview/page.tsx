'use client';

import { useStockData } from '@/components/layout/StockDataContext';
import OverviewTab from '@/components/stock/overview';

export default function OverviewPage() {
  const { data } = useStockData();
  if (!data) return null;
  return <OverviewTab data={data} />;
}
