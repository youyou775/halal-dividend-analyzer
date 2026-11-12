import { ComingSoon } from '@/components/planned/ComingSoon';

export default function ImportPage() {
  return (
    <ComingSoon
      title="Import Portfolio"
      description="Upload a holdings export from your brokerage to power the portfolio-level pages (Diversification, Purification, Income & Growth). Charles Schwab first."
      scope={[
        'Schwab CSV export parser first (their positions/holdings export format)',
        'Generic CSV/XLS fallback with a column-mapping step for other brokerages',
        'Normalize into one internal Holding[] shape: symbol, shares, cost basis, account',
        'Persist the imported portfolio (needs a storage decision — see ARCHITECTURE.md)',
        'Re-fetch each holding\u2019s StockData via the existing getStockData() pipeline to power the other portfolio pages',
      ]}
    />
  );
}
