'use client';

import { useStockData } from '@/components/layout/StockDataContext';
import SensitivityTab from '@/components/stock/sensitivity';

export default function SensitivityPage() {
  const { data } = useStockData();
  if (!data) return null;
  return <SensitivityTab data={data} />;
}
