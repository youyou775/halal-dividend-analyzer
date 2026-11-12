# Halal Dividend Analyzer (Next.js)

A Shariah-compliance + dividend-health screening dashboard, rebuilt from a
Python/Dash MVP into Next.js 14 (App Router) + TypeScript + Tailwind +
Recharts. Growing into a broader portfolio analysis tool — see
[`ROADMAP.md`](./ROADMAP.md) for what's planned and
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for how it's built to support that.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 (redirects to `/stock/overview`). Data comes from
`yahoo-finance2` — **no API key needed**. If a lookup fails (bad symbol,
network issue, Yahoo rate-limiting), the app falls back to an
internally-consistent sample dataset with a yellow "Showing sample data"
banner so it's never mistaken for live data.

**Worth knowing:** `yahoo-finance2` wraps Yahoo Finance's unofficial,
undocumented endpoints — the same kind of data source the original brief
steered away from (via `yfinance`) over ToS concerns. It's free and widely
used, but not an official, supported API. Swapping it out later is a
one-file change — see "Data provider decoupling" in `ARCHITECTURE.md`.

## Where to edit what

| I want to change... | Edit this |
|---|---|
| What gets requested from Yahoo | `lib/1.api/yahoo-api.ts` (it only fetches — check its `[yahoo-api] raw sample` logs first when data looks wrong) |
| How statement rows become numbers (field names, quarterly fill-in, current-year rule) | `lib/3.tools/fundamentals-tools.ts` |
| How prices / dividend events become numbers | `lib/3.tools/market-tools.ts` |
| Dividend tab's math | `lib/2.data/dividend.ts` |
| Profitability tab's math | `lib/2.data/profitability.ts` |
| Sensitivity tab's math | `lib/2.data/sensitivity.ts` |
| Financial statement tables, analyst consensus | `lib/2.data/financials.ts` |
| Overview basics, halal screening inputs | `lib/2.data/overview.ts` |
| A pass/fail threshold or benchmark (6% growth, 70% payout, etc.) | `lib/4.screening/screening.ts` |

Each `lib/2.data/*.ts` file matches one page folder in `components/stock/*/` and converts
the values its page needs out of Yahoo's raw response. See `ARCHITECTURE.md`
for the data-flow diagram and what switching providers would involve.

## Testing

```bash
npm run test:data
```

Runs `scripts/test-calculators.ts`: Yahoo-shaped raw data (modelled on real
AAPL logs) goes through the tools and all five page converters — no network,
no Next.js. It includes the "only 4 years of data" case, the quarterly
fill-in, the Sept-30 fiscal-year price matching, and a completeness check
against `StockData`'s fields. To test a change: edit the relevant
`lib/data/*.ts` file, add a `check(...)` line, re-run.

## Deploy

Push to a GitHub repo and import it in Vercel, or run `npx vercel`. No
environment variables are required for the default Yahoo-backed setup.

## What's here today

**Sidebar navigation** (`components/Sidebar.tsx`) is the single source of
truth for the app's pages — both built and planned. Planned pages show as
disabled with a "Coming soon" tag rather than being left out of the nav
entirely, so the intended shape of the whole project is always visible.

**Stock Analysis** (`/stock/*`) — search any ticker, then five tabs:

1. **Overview** — halal screening, key metrics, price chart, news, and a
   live summary card per other tab (click "View →" to jump there).
2. **Dividend Growth** — dividend health + screening detail, and the
   dividend/FCF-coverage growth charts.
3. **Profitability** — revenue vs. cost of revenue chart, gross margin
   trend, revenue/net income CAGR (5yr & 10yr), gross margin ratio (5yr avg,
   10yr avg, last year), current revenue/gross profit/net income/EPS.
4. **Sensitivity Analysis** — TTM vs. average PE, a 10-year history table
   (EPS, PE, price, dividend/share, total return, compounded return),
   predicted 5yr EPS growth, and a PE-scenario × time-horizon price
   projection grid. This one's the newest and most opinionated — see
   "Sensitivity analysis methodology" below before trusting it too far.
5. **Financials & Info** — tabbed financial statements (10 years), market
   sentiment, company info.

**Portfolio Tools** (`/portfolio/*`, `/screener`) — planned, currently
"Coming soon" stub pages with their intended scope written out. See
`ROADMAP.md` for the task breakdown.

Also in place:
- Dark mode (toggle in the sidebar; persisted; respects OS preference on
  first load).
- Mobile responsive: columns stack and scroll below the `lg` breakpoint.
- Halal + dividend screening engine (`lib/4.screening/screening.ts`) — pure functions,
  used server-side, fully decoupled from where the numbers came from.
- Yahoo Finance integration (`lib/1.api/yahoo-api.ts`) with per-request fallback
  to sample data on any error, and diagnostic console logging
  (`[yahoo-api] ...`) if the underlying data shape is ever unexpected.

## Dividend scoring

Deliberately doesn't use yield. Yield is a function of price (a cheap stock
and an expensive one can pay the identical dollar dividend at very different
yields), so it says little about whether the dividend itself is safe or
growing. Instead:

- **Safety (hard criteria):** payout ratio ≤ 70%, FCF coverage ≥ 1.0x.
- **Quality (benchmarked):** 5yr dividend CAGR and 5yr FCF CAGR, each
  compared against a benchmark growth rate (`dividendGrowthBenchmark` /
  `fcfGrowthBenchmark` in `lib/screening.ts`, currently a placeholder 6%
  each — an approximation of "what a healthy dividend-growth stock's
  long-run growth looks like," not a fetched peer/index average). Healthy
  requires passing both safety criteria and beating both benchmarks; Mixed
  requires passing at least one bucket; otherwise Poor.

## Sensitivity analysis methodology (v1 — worth refining)

- **Historical returns table**: each year's EPS and PE come from the same
  fundamentals + price-matching logic used elsewhere. Total return =
  `(price change + dividend per share) / prior year price`. Compounded
  return = cumulative product of `(1 + total return)` across the window.
- **Price sensitivity grid**: `projected price = PE scenario × EPS ×
  (1 + estimated EPS growth)^years`. The three PE scenarios (Bear/Base/Bull)
  are a naive ±15% off the 10yr average — a starting point, not a
  statistically grounded model (no volatility, no distribution). Genuine
  sensitivity analysis (Monte Carlo over historical return volatility, or
  explicit bear/base/bull growth assumptions) is a good next iteration.
- **Predicted EPS growth**: reuses the 5yr historical EPS CAGR as the
  forward assumption — no analyst forward-estimate source wired in yet.

## Historical depth: the "5yr and 10yr are identical" bug

If 5-year and 10-year figures (CAGRs, PE averages, financial statement
years) ever show identical or suspiciously shallow numbers again, here's
the history: the original calculations used a pattern like
`Math.min(5, periods.length - 1)` to pick how many years back to compare.
Once Yahoo returned fewer than ~6 years of annual fundamentals for a ticker
(common — Yahoo's free "annual" bucket is often shallow), that `Math.min`
silently collapsed the "5yr" and "10yr" windows to the exact same span,
producing identical numbers under different labels.

Fixed in `lib/5.utils/utils.ts`'s `cagrOverSeries()` / `averageOverWindow()`: these
return `NaN` — never a silently shorter substitute — when a series doesn't
actually have enough history for the requested window, and the existing
`formatPercent`/`formatCurrency`/`formatNumber` helpers already render `NaN`
as `—`. `ScoredRow` (`components/shared/ui.tsx`) goes one step further and shows a
neutral gray "N/A" instead of a misleading red "fail" whenever it detects
that `—`.

Separately, `FundamentalsTools` (`lib/3.tools/fundamentals-tools.ts`) makes a
best-effort attempt to extend a shallow annual history by aggregating
Yahoo's quarterly rows (summing flow fields like revenue and EPS across 4
quarters, taking the last quarter's value for balance-sheet fields) — see
`aggregateQuarters()`. On real AAPL data this has so far only produced the
current, incomplete year (which is then excluded), so it hasn't yet added
usable history. The server log line
`[fundamentals-tools] SYMBOL: N annual year(s), +M from quarterly, K complete
year(s) used` shows what it did for a given ticker; a following "only K
complete year(s) available" warning means that's Yahoo's depth limit, not a
bug.

## The NaN-to-null crash (if you ever see `Cannot read properties of null (reading 'toFixed')`)

This bit us once already, so it's worth understanding rather than
re-debugging blind: the fix above (returning `NaN` from `cagrOverSeries`/
`averageOverWindow` when there isn't enough history) works correctly
server-side, but `NextResponse.json()` calls `JSON.stringify` under the
hood — and **`JSON.stringify` silently converts `NaN` to `null`**. A value
that's genuinely `NaN` in `lib/1.api/yahoo-api.ts` arrives in the browser as
`null`, not `NaN`. Code that only checks `Number.isNaN(value)` lets that
`null` straight through to `.toFixed()`, which throws.

The fix is `isMissing()` in `lib/5.utils/utils.ts` — treats `null`, `undefined`, and
`NaN` as equivalent "no value," and every formatter
(`formatPercent`/`formatCurrency`/`formatMultiple`/`formatNumber`) and
`ScoredRow`/`Delta` route through it. **Any new code that reads one of the
"might not have enough history" fields** (the CAGR/average fields in
`lib/6.types/types.ts`, all computed via `cagrOverSeries`/`averageOverWindow`) must
use `isMissing()` rather than a bare `Number.isNaN()` check, or format
through one of the existing helpers rather than calling `.toFixed()`
directly on a raw field.

## Three more bugs found from real AAPL logs

Your raw log output was ground truth, not just a report — it let me find and
fix real bugs rather than guess again:

1. **The current (incomplete) year was included in every fundamentals
   chart.** Apple's quarterly extension correctly added a 5th year, but that
   year is assembled from however many quarters have reported so far — for
   the current fiscal year, that's a partial total, not a real annual
   figure. It showed up as an artificial dip at the end of every
   fundamentals-derived chart (revenue, cost of revenue, gross margin, FCF —
   everything except the price chart, which has its own always-current data
   source and was correctly left alone). Now excluded in
   `FundamentalsTools.annualPeriods()` (statements) and
   `MarketTools.annualDividends()` (dividends), so it can't reappear in just
   one chart and not another.

2. **PE ratios were wrong because Apple's fiscal year doesn't end in
   December.** Your raw log showed `"date":"2022-09-30"` — Apple's fiscal
   year ends in September. The code was matching each year's EPS to a
   December 31 stock price as a stand-in for "year-end price," a ~3-month
   mismatch that measurably skews PE for any company on a non-calendar
   fiscal year (which is common — retailers, many tech companies, etc.).
   Fixed by threading the *actual* period-end date through
   (`FiscalPeriod.periodDate`, set in `lib/3.tools/fundamentals-tools.ts`) instead of assuming December.

3. **"5yr" and "10yr" used inconsistent definitions of a "year."** "10yr"
   figures required 10 data points; "5yr" figures required 6 — so a ticker
   with exactly 5 or 6 years of history could show a valid 10yr-labeled
   figure's little sibling as N/A for no good reason. Both now consistently
   mean "N data points" (`cagrOverSeries`'s doc comment in `lib/5.utils/utils.ts`
   explains the convention and why it was picked over the alternative).

**Setting expectations for AAPL specifically:** even with all three fixes,
AAPL will still show "N/A" for 5yr figures, because Yahoo's annual
fundamentals bucket plus the quarterly extension together only produced 4
genuinely complete fiscal years for this ticker — one short of what even
the loosened 5-data-point convention needs. That's a real Yahoo data-depth
ceiling, not a bug left to chase; the "N/A" is the correct, honest answer
for a ticker where this data genuinely isn't available. Tickers with more
available history should now show real 5yr figures that they were
incorrectly missing.

## Known gaps

- "Single screen, no scroll" per tab holds at typical desktop
  widths/heights; below roughly 700–750px viewport height the content area
  falls back to scrolling rather than compressing cards past legibility.
- News is minimal by design — just the top 2 results from
  `yahooFinance.search()`.
- Automated tests live in `scripts/test-calculators.ts` (run `npm run test:data`): 52 offline,
  Yahoo-shaped checks covering the shallow-history case, the quarterly fill-in,
  the current-year exclusion, the Sept-30 fiscal-year price matching, and a
  completeness check against `StockData`'s fields.

For anything deeper — the data-provider decoupling point, the full
directory layout, the open decision on portfolio-level state, or how to add
a new page — see [`ARCHITECTURE.md`](./ARCHITECTURE.md). For what to build
next and in what order, see [`ROADMAP.md`](./ROADMAP.md).
