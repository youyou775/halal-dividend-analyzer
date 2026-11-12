'use client';

import { useState } from 'react';
import { Card } from '../../shared/ui';
import type { StockData, FinancialStatement } from '@/lib/6.types/types';
import { formatCompactBillions } from '@/lib/5.utils/utils';

const TABS = ['Income Statement', 'Balance Sheet', 'Cash Flow'] as const;
type Tab = (typeof TABS)[number];

export default function FinancialStatements({ data }: { data: StockData }) {
  const [tab, setTab] = useState<Tab>('Income Statement');
  const statement: FinancialStatement =
    tab === 'Income Statement' ? data.incomeStatement : tab === 'Balance Sheet' ? data.balanceSheet : data.cashFlow;

  return (
    <Card title="Financial statements" bodyClassName="flex flex-col">
      <div className="mb-2 flex shrink-0 gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-2 py-1 text-[12px] ${
              tab === t
                ? 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e8e8e8] text-left text-neutral-500 dark:border-neutral-700">
              <th className="sticky left-0 top-0 bg-white py-1 pr-2 font-medium dark:bg-neutral-800">Metric</th>
              {statement.years.map((y) => (
                <th key={y} className="sticky top-0 bg-white py-1 pl-2 text-right font-medium dark:bg-neutral-800">
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statement.rows.map((row) => (
              <tr key={row.metric} className="border-b border-[#f0f0f0] dark:border-neutral-800">
                <td className="sticky left-0 bg-white py-1 pr-2 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {row.metric}
                </td>
                {statement.years.map((y) => (
                  <td key={y} className="py-1 pl-2 text-right font-medium">
                    {formatCompactBillions(row.values[y])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
