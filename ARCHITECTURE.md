# Architecture

This document exists so any future work session — with or without the
history of how this got built — can pick up exactly where the last one left
off. If you're about to build one of the planned pages, read the relevant
section here first.

## How data flows (read this first)

```
app/api/stock/[symbol]/route.ts
        │ calls
        ▼
lib/get-stock-data.ts ── getStockData(symbol) => { data: StockData, isSample }
        │
        ├─ 1. lib/1.api/yahoo-api.ts ── fetchRawStockData(symbol) => RawYahooData
        │        ONLY file that calls Yahoo. Returns Yahoo's responses untouched.
        │
        ├─ 2. lib/2.data/*.ts ── one file per components/stock/*/ page
        │        each converts the values ITS page needs out of RawYahooData
        │        │ using the shared conversion classes:
        │        ▼
        │     lib/3.tools/fundamentals-tools.ts  FundamentalsTools  (statements -> FiscalPeriod[])
        │     lib/3.tools/market-tools.ts        MarketTools        (prices, dividends)
        │
        └─ 3. spreads the five results into one StockData (falls back to lib/7.mock/mock-data.ts on any failure)
```

| Page (components/stock/*/) | Converter (lib/2.data/) | Reads from the raw response |
|---|---|---|
| OverviewTab | overview.ts | quoteSummary profile/price/detail, chart (prices), balance sheet (debt ratio), news |
| DividendTab | dividend.ts | chart dividend events, cash-flow statement, payout ratio |
| ProfitabilityTab | profitability.ts | income statement |
| SensitivityTab | sensitivity.ts | income statement (EPS), chart (prices + dividends), PE / target price |
| FinancialsTab | financials.ts | all three statements, recommendationTrend |

**Three rules keep this easy to edit:**

1. **Only `lib/1.api/yahoo-api.ts` makes Yahoo calls, and it does no conversion.**
   No renaming, merging, filtering or math. If a number is missing or wrong
   *because of what Yahoo sent*, look at its `[yahoo-api] raw sample` logs.
2. **Each page file converts its own values.** To change how the Dividend tab
   gets a number, you open `lib/2.data/dividend.ts` and nothing else. The five
   files own disjoint slices of `StockData`, so spreading them together can't
   produce conflicting values (a test enforces that they cover exactly the
   fields `StockData` has).
3. **Conversion logic used by more than one page lives in a tool class.**
   `FundamentalsTools` and `MarketTools` are static-method classes (nothing to
   instantiate). Math shared with the mock data (`cagrOverSeries`,
   `averageOverWindow`, `closestPrice`) and the formatters live in
   `lib/5.utils/utils.ts`.

**What this costs, honestly:** because each page file converts its own
values, a few of them read Yahoo-shaped paths directly (e.g.
`raw.summary.summaryDetail.payoutRatio`). **Switching providers later means
rewriting `lib/1.api/yahoo-api.ts` and `lib/3.tools/`, then updating those raw-field
reads at the top of each `lib/2.data/*.ts` file** — five small files, all in
one place, but not "change one import." The page folders in `components/stock/` never
change; they only ever see `StockData`.

### Yahoo quirks, and where each is handled

All in `lib/3.tools/fundamentals-tools.ts` (see its doc comment):

- **Bare field names.** `totalRevenue`, `netIncome`, `dilutedEPS` — not the
  `annualTotalRevenue` the library's JSDoc examples show. Confirmed by the
  library's own type declarations and real AAPL logs.
- **Shallow history.** The annual call often returns ~4 fiscal years even
  when 10 are requested. Quarterly rows are aggregated to try to fill older
  years (flow fields summed, balance fields from the last quarter).
- **Fiscal years that don't end in December.** AAPL's end Sept 30; each
  period keeps its real end date so EPS is matched to the right price.
- **The in-progress year is incomplete.** Excluded, in both the statements
  (`FundamentalsTools`) and the dividends (`MarketTools`).
- **Signs.** Capex, dividends paid and buybacks come back negative.

### Other layers

```
lib/6.types/types.ts  StockData (the full UI contract) and FiscalPeriod. No logic.
lib/4.screening/screening.ts  Pure scoring functions: halal, dividend, profitability, valuation.
lib/5.utils/utils.ts  Formatters (formatPercent...), isMissing, and shared math (cagrOverSeries...).
lib/7.mock/mock-data.ts  A complete fabricated StockData — the "always works, no network" fallback.

components/shared/ui.tsx        Card / StatusBadge / ScoredRow / Delta — shared primitives.
components/*.tsx                Single-purpose display components; each takes `data: StockData`.
components/stock/*/           Compose those into the 5 stock-analysis tabs.
components/Sidebar.tsx          App-wide nav — the single source of truth for what pages exist.
components/StockDataContext.tsx Fetch/loading/error state shared across the /stock/* routes.
```

## Routing

```
app/layout.tsx           Root layout: renders <Sidebar/> + page content, side by side.
app/page.tsx              "/" redirects to "/stock/overview".
app/stock/layout.tsx      Wraps the 5 tabs below in <StockDataProvider>, renders <Header/>,
                           handles loading/error/sample-banner once for all 5.
app/stock/overview/page.tsx        Each just does: `const { data } = useStockData(); return <XTab data={data} />`
app/stock/dividend/page.tsx
app/stock/profitability/page.tsx
app/stock/sensitivity/page.tsx
app/stock/financials/page.tsx
app/portfolio/*/page.tsx  Stub pages using <ComingSoon/> — see below.
app/screener/page.tsx
app/api/stock/[symbol]/route.ts   The only server-side code. Calls lib/get-stock-data.ts.
```

Why routes instead of client-side tab state (which is how this started):
real URLs are shareable/bookmarkable, `usePathname()` in the sidebar needs no
prop drilling to know what's active, and it matches how the portfolio pages
below will need to work anyway (they're independent enough to be genuinely
separate pages, not tabs of one thing).

## Adding a page (the workflow for everything in the roadmap)

1. Flip its `status` from `'planned'` to `'built'` in
   `components/Sidebar.tsx` — this is the single source of truth for nav,
   so this is the only place the sidebar itself needs touching.
2. Replace `app/<route>/page.tsx`'s `<ComingSoon .../>` with the real page.
3. If it needs its own fetched/shared state (the portfolio pages will — see
   "Open question" below), give it its own context provider next to
   `StockDataContext.tsx`, following the same pattern: one provider, one
   `useXState()` hook, no other file reaches into its internals.
4. Update `ARCHITECTURE.md` and `ROADMAP.md` to reflect what's now built.

Each planned page's `app/.../page.tsx` stub already lists its intended
scope as bullet points (also mirrored in `ROADMAP.md`) — that list is the
spec to build against.

## Open question: portfolio-level state

The stock-analysis pages all key off one ticker symbol, fetched fresh each
time (`StockDataContext`). The portfolio pages (Diversification, Purification,
Income & Growth, Screener) will need a **list of holdings** shared across
all of them, sourced from Import Portfolio. That's a different shape of
state than anything that exists yet, and where it lives is a real decision
to make before building any of those four pages:

- **Client-only (React state + maybe localStorage)**: simplest, no backend
  needed, but the portfolio disappears on a new device/browser and there's
  a real localStorage size ceiling for a large portfolio's worth of
  `StockData` (each holding pulls a full 10-year financial history).
- **Server-side (a database)**: durable, works across devices, but this
  project currently has zero persistence layer — this would be the first
  piece of real backend infrastructure, with real tradeoffs to decide
  (which DB, auth, etc.).

Recommendation: start client-only for Import Portfolio + Diversification
(fastest path to something usable), and revisit persistence once Income &
Growth needs to track data *over time* (a snapshot in memory can't show
income growth across sessions).

## Design system

Colors, spacing, and typography sizes are enforced inline via Tailwind
utility classes (not a separate theme file) — see `components/shared/ui.tsx` for
the three shared primitives (`Card`, `StatusBadge`, `Delta`) and
`tailwind.config.ts` for the small set of custom colors (`positive`,
`negative`, `chartdark`, `chartgray`, `chartavg`). Status colors (compliant/
healthy/mixed/poor/buy/hold/sell) are centralized in `STATUS_STYLES` inside
`ui.tsx` — that's the one place to change if the palette changes.

## Verifying changes

`npm run test:data` runs `scripts/test-calculators.ts`: hand-built,
Yahoo-shaped raw data (modelled on real AAPL logs) goes through the tools and
all five page converters. No network, no Next.js, no mocking — it works
because the API file only fetches, so everything after it is a plain function.
It covers the shallow-history case, the quarterly fill-in, the current-year
exclusion, the Sept-30 fiscal-year price matching, and that the five
converters together produce exactly `StockData`'s fields.

To test a change to one tab's math: edit its `lib/2.data/*.ts` file, add a
`check(...)` line, re-run.

**What can't be tested offline:** the Yahoo call itself. The sandbox this is
built in can't reach Yahoo, so `lib/1.api/yahoo-api.ts` is verified only by
type-checking and by your own runs. When something looks wrong with live
data, the `[yahoo-api] raw sample` and `[fundamentals-tools]` console logs say
what Yahoo returned and what the tools did with it.
