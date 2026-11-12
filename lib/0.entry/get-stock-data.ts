import type { StockData } from '../6.types/types';
import { fetchRawStockData } from '../1.api/yahoo-api';
import { buildMockStock } from '../7.mock/mock-data';
import { computeOverviewData } from '../2.data/overview';
import { computeDividendData } from '../2.data/dividend';
import { computeProfitabilityData } from '../2.data/profitability';
import { computeSensitivityData } from '../2.data/sensitivity';
import { computeFinancialsData } from '../2.data/financials';

/**
 * The single entry point the API route calls (app/api/stock/[symbol]/route.ts).
 *
 *   lib/1.api/yahoo-api.ts   fetchRawStockData()  -> Yahoo's raw responses, untouched
 *   lib/2.data/*.ts          one file per components/stock/<page>/ page; each converts
 *                            the values ITS page needs out of the raw responses
 *   lib/3.tools/*.ts         the reusable conversion classes those files share
 *                            (FundamentalsTools, MarketTools)
 *
 *   lib/2.data/overview.ts      -> components/stock/overview/index.tsx
 *   lib/2.data/dividend.ts      -> components/stock/dividend/index.tsx
 *   lib/2.data/profitability.ts -> components/stock/profitability/index.tsx
 *   lib/2.data/sensitivity.ts   -> components/stock/sensitivity/index.tsx
 *   lib/2.data/financials.ts    -> components/stock/financials/index.tsx
 *
 * The five converters own disjoint slices of StockData, so spreading them
 * together can't produce conflicting values. Falls back to lib/7.mock/mock-data.ts's
 * fabricated (but internally consistent) StockData on any failure.
 *
 * TO SWAP DATA PROVIDERS: replace lib/1.api/yahoo-api.ts with a file that fetches
 * from the new source, then update lib/3.tools/ and the raw-field reads at the
 * top of each lib/2.data/*.ts file to match its response shape. The tabs in
 * components/stock/ never change — they only ever see StockData.
 */
export async function getStockData(symbol: string): Promise<{ data: StockData; isSample: boolean }> {
  try {
    const raw = await fetchRawStockData(symbol);

    const data: StockData = {
      ...computeOverviewData(raw),
      ...computeDividendData(raw),
      ...computeProfitabilityData(raw),
      ...computeSensitivityData(raw),
      ...computeFinancialsData(raw),
    };

    return { data, isSample: false };
  } catch (err) {
    console.error('[get-stock-data] Falling back to sample data:', err);
    return { data: buildMockStock(symbol), isSample: true };
  }
}