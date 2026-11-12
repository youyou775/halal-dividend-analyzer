import type { StockData } from '../6.types/types';
import type { RawYahooData } from '../1.api/yahoo-api';
import { screenHalal } from '../4.screening/screening';
import { FundamentalsTools } from '../3.tools/fundamentals-tools';
import { MarketTools } from '../3.tools/market-tools';

type OverviewFields = Pick<
  StockData,
  | 'symbol'
  | 'name'
  | 'sector'
  | 'industry'
  | 'description'
  | 'currentPrice'
  | 'price52wHigh'
  | 'price52wLow'
  | 'priceChangePct52w'
  | 'priceHistory'
  | 'dividendYield'
  | 'dividendYieldChangeYoY'
  | 'isHalalCompliant'
  | 'halalReasons'
  | 'debtRatio'
  | 'haramEarningsRatio'
  | 'recentNews'
  | 'stockSplits'
>;

/**
 * Feeds components/stock/overview/ (OverviewTab + Halal card).
 * Converts what this page needs out of Yahoo's raw response: profile and
 * price fields straight from the quoteSummary modules, price history via
 * MarketTools, the latest balance sheet via FundamentalsTools (for the debt
 * ratio the halal screen uses), and the news list.
 */
export function computeOverviewData(raw: RawYahooData): OverviewFields {
  const profile = raw.summary?.assetProfile ?? {};
  const price = raw.summary?.price ?? {};
  const detail = raw.summary?.summaryDetail ?? {};

  const periods = FundamentalsTools.annualPeriods(raw);
  const latest = periods[periods.length - 1];
  const debtRatio = latest?.totalAssets ? (latest.totalDebt / latest.totalAssets) * 100 : 0;

  // No mainstream API (Yahoo included) exposes a clean "% haram earnings}"
  // field — see README for the standard non-permissible-income screen this
  // would approximate, and why it's left at 0 rather than guessed here.
  const haramEarningsRatio = 0;

  const sector = profile.sector ?? 'Unknown';
  const industry = profile.industry ?? 'Unknown';
  const halal = screenHalal({ sector, industry, debtRatio, haramEarningsRatio });

  return {
    symbol: price.symbol ?? raw.symbol,
    name: price.longName ?? price.shortName ?? raw.symbol,
    sector,
    industry,
    description: profile.longBusinessSummary ?? '',

    currentPrice: price.regularMarketPrice ?? 0,
    price52wHigh: detail.fiftyTwoWeekHigh ?? 0,
    price52wLow: detail.fiftyTwoWeekLow ?? 0,
    priceChangePct52w: price.regularMarketChangePercent ?? 0,
    priceHistory: MarketTools.priceHistory(raw.chart),

    dividendYield: (detail.dividendYield ?? 0) * 100,
    dividendYieldChangeYoY: 0, // no prior-year yield source wired in yet

    isHalalCompliant: halal.isCompliant,
    halalReasons: halal.reasons,
    debtRatio,
    haramEarningsRatio,

    recentNews: ((raw.news?.news ?? []) as any[]).slice(0, 2).map((n) => ({
      title: n.title,
      publisher: n.publisher ?? 'Unknown',
      date: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString().slice(0, 10) : '',
      url: n.link,
    })),
    stockSplits: [], // not sourced yet — see ROADMAP.md
  };
}