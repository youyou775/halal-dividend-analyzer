import { Card, StatusBadge, ScoredRow, SCORE_LABELS } from '../../shared/ui';
import type { StockData } from '@/lib/6.types/types';
import { SCREENING_THRESHOLDS } from '@/lib/4.screening/screening';
import { formatPercent, formatMultiple } from '@/lib/5.utils/utils';

const t = SCREENING_THRESHOLDS;

export default function DividendCard({ data }: { data: StockData }) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Dividend</h2>
        <StatusBadge status={data.dividendStatus} label={SCORE_LABELS[data.dividendStatus]} />
      </div>
      <div className="text-[13px]">
        <ScoredRow label="Payout ratio" value={`${data.payoutRatio.toFixed(0)}%`} hint={`<${t.maxPayoutRatio}%`} ok={data.payoutRatio <= t.maxPayoutRatio} />
        <ScoredRow label="FCF coverage" value={formatMultiple(data.fcfCoverage5Y)} hint={`>${t.minFcfCoverage}x`} ok={data.fcfCoverage5Y >= t.minFcfCoverage} />
        <ScoredRow
          label="5yr Div CAGR"
          value={formatPercent(data.dividendCAGR5Y)}
          hint={`vs ${t.dividendGrowthBenchmark}% benchmark`}
          ok={data.dividendCAGR5Y >= t.dividendGrowthBenchmark}
        />
        <ScoredRow
          label="10yr Div CAGR"
          value={formatPercent(data.dividendCAGR10Y)}
          hint={`vs ${t.dividendGrowthBenchmark}% benchmark`}
          ok={data.dividendCAGR10Y >= t.dividendGrowthBenchmark}
        />
        <ScoredRow
          label="5yr FCF CAGR"
          value={formatPercent(data.fcfCAGR5Y)}
          hint={`vs ${t.fcfGrowthBenchmark}% benchmark`}
          ok={data.fcfCAGR5Y >= t.fcfGrowthBenchmark}
        />
        <ScoredRow
          label="10yr FCF CAGR"
          value={formatPercent(data.fcfCAGR10Y)}
          hint={`vs ${t.fcfGrowthBenchmark}% benchmark`}
          ok={data.fcfCAGR10Y >= t.fcfGrowthBenchmark}
        />
      </div>
    </Card>
  );
}
