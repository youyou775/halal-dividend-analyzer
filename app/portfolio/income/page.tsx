import { ComingSoon } from '@/components/planned/ComingSoon';

export default function IncomePage() {
  return (
    <ComingSoon
      title="Income & Growth"
      description="Tracks total dividend income and its growth trajectory across your whole portfolio, not just one stock."
      scope={[
        'Aggregate annual dividend income across all holdings (shares × dividend per share)',
        'Portfolio-level income CAGR, reusing the per-stock CAGR math already in lib/utils.ts',
        'Forward income projection using each holding\u2019s estimatedDividendGrowth5Y',
        'Income calendar — which months/holdings pay, for cash-flow planning',
        'Highlight holdings dragging down portfolio income growth',
      ]}
    />
  );
}
