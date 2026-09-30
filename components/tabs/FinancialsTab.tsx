import SentimentCard from '../SentimentCard';
import CompanyInfo from '../CompanyInfo';
import FinancialStatements from '../FinancialStatements';
import type { StockData } from '@/lib/types';

export default function FinancialsTab({ data }: { data: StockData }) {
  return (
    <div className="grid h-full grid-cols-1 gap-2 md:gap-3 lg:grid-cols-12">
      <div className="flex min-h-0 flex-col gap-2 md:gap-3 lg:col-span-3">
        <div className="min-h-0 flex-1">
          <SentimentCard data={data} />
        </div>
        <div className="min-h-0 flex-1">
          <CompanyInfo data={data} />
        </div>
      </div>
      <div className="min-h-0 lg:col-span-9">
        <FinancialStatements data={data} />
      </div>
    </div>
  );
}
