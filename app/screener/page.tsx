import { ComingSoon } from '@/components/planned/ComingSoon';

export default function ScreenerPage() {
  return (
    <ComingSoon
      title="Top 10 Discounted Stocks"
      description="Screens a universe of halal-compliant, dividend-paying stocks using this app's own analysis, and ranks the 10 trading at the largest discount to estimated fair value."
      scope={[
        'Needs a ticker universe to screen (a curated halal-compliant list, or a broader index filtered by isHalalCompliant)',
        'Run each candidate through the existing getStockData() + screening pipeline',
        'Rank by fair-value discount (estimatedFairValue vs. currentPrice, from the Sensitivity tab\u2019s model)',
        'Filter out isDividendHealthy === false and isHalalCompliant === false candidates',
        'Rate-limit / batch requests — screening many tickers means many API calls per run',
      ]}
    />
  );
}
