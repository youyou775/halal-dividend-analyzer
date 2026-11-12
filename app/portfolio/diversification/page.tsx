import { ComingSoon } from '@/components/planned/ComingSoon';

export default function DiversificationPage() {
  return (
    <ComingSoon
      title="Portfolio Diversification"
      description="Analyzes how concentrated your portfolio is across industries, market cap tiers, and geography, and flags where you're most exposed."
      scope={[
        'Import a portfolio (see Import Portfolio) or enter holdings manually',
        'Group by sector/industry and show allocation % per group',
        'Break down market-cap exposure (mega/large/mid/small cap)',
        'Break down geographic exposure (by exchange/country of listing)',
        'Flag concentration risk (e.g. >25% in one sector or one holding)',
      ]}
    />
  );
}
