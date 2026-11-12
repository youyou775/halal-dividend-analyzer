# Roadmap

Working log + task breakdown, kept small and specific on purpose — each
unchecked item should be doable in one focused session without needing the
full history of the project. Read `ARCHITECTURE.md` first for how the
pieces fit together.

## Done

- [x] Single-stock dashboard: halal + dividend screening, dividend growth,
      profitability, sensitivity analysis, financial statements — as 5 tabs
      under `/stock/*`.
- [x] Yahoo Finance data layer (`lib/yahoo-api.ts`) with sample-data fallback
      (`lib/mock-data.ts`) on any error.
- [x] Dividend scoring redesigned: payout ratio + FCF coverage (safety) and
      dividend/FCF CAGR vs. a benchmark growth rate (quality) — yield
      dropped from scoring entirely (see `lib/screening.ts`).
- [x] Left sidebar navigation (`components/Sidebar.tsx`) replacing the old
      horizontal tab bar; the 5 stock-analysis tabs are now real routes
      sharing one fetch via `StockDataContext`.
- [x] Stub pages + sidebar entries for all 5 planned portfolio-level pages,
      each with its intended scope written out as a checklist (in the stub
      page itself and mirrored below).
- [x] `ARCHITECTURE.md` written up, in particular the data-provider
      decoupling point and the "how to add a page" workflow.
- [x] Consistent scoring UI everywhere: `components/ui.tsx`'s `ScoredRow` /
      `StatusBadge` pattern (label, value, colored vs.-benchmark hint, plus
      an overall Healthy/Mixed/Poor badge) now used on the Halal card,
      Dividend card, Dividend Growth tab, Profitability tab, Sensitivity
      tab, and the Overview summary cards — not just the Halal card.
      `lib/screening.ts` gained `scoreProfitability()` and
      `scoreValuation()` alongside the existing `screenHalal()` /
      `screenDividend()`, all following the same pattern.
- [x] Data layer split: `lib/yahoo-api.ts` only calls Yahoo and returns the
      raw responses; `lib/tools/` (`FundamentalsTools`, `MarketTools`) holds
      the reusable conversion classes; each `lib/data/*.ts` file (one per
      `components/stock/*/` file) converts the values its own page needs.
      `lib/get-stock-data.ts` wires them together. Removed dead
      `revenueByYear`, and the speculative `annualXxx` name guesses and
      "Shape B" parsing (neither ever appeared in real logs).
- [x] `npm run test:data` — 52 checks over the tools and all five converters
      with Yahoo-shaped fixtures, no network (`scripts/test-calculators.ts`).
- [x] Font sizes scaled up a tier across the whole app (base body 13px→15px,
      and every `text-[Npx]` utility bumped proportionally) now that the
      sidebar + routed-pages layout has more room per page than the old
      single-screen-everything design.

## Next up, in a sensible order

Each of these is independent enough to be its own session. The order below
is a suggestion (import unlocks the portfolio pages; the screener is the
most self-contained) — feel free to reorder.

### 1. Import Portfolio (`/portfolio/import`)
Unlocks everything else portfolio-level, so probably first.
- [ ] Decide the internal `Holding` shape: at minimum `{ symbol, shares,
      costBasis, account }`.
- [ ] Build a Schwab CSV parser first (their positions export has a
      known, fixed column layout — get a sample export to confirm the
      exact headers before writing the parser).
- [ ] Add a generic CSV/XLS fallback with a manual column-mapping step, for
      brokerages beyond Schwab.
- [ ] Decide where the parsed portfolio lives (see "Open question:
      portfolio-level state" in `ARCHITECTURE.md`) and build the provider.
- [ ] Build the upload UI (drag-and-drop or file picker) + a review/confirm
      table before committing the import.

### 2. Portfolio Diversification (`/portfolio/diversification`)
Depends on: Import Portfolio (or manual holding entry as a stopgap).
- [ ] For each holding, call the existing `getStockData()` pipeline to get
      sector/industry (already on `StockData.sector` / `.industry`).
- [ ] Group by sector and compute allocation % (shares × currentPrice,
      summed per sector, over portfolio total).
- [ ] Market-cap tiering — `StockData` doesn't currently carry market cap;
      add it (Yahoo's `price.marketCap` or `summaryDetail.marketCap` via
      `quoteSummary`, following the pattern already in `lib/yahoo-api.ts`).
- [ ] Geography — likely from `price.exchange` / `assetProfile.country` if
      Yahoo exposes it for the ticker; confirm via the `[yahoo-api] raw
      sample` logging pattern already established.
- [ ] Concentration-risk flagging (e.g. >25% in one sector/holding) — pure
      function, can be unit-tested like `lib/screening.ts`.

### 3. Purification (`/portfolio/purification`)
Depends on: Import Portfolio. Builds directly on existing screening work.
- [ ] Per holding: `purification amount = shares × dividend per share ×
      haramEarningsRatio` (both already on `StockData`).
- [ ] Aggregate across the portfolio, probably grouped by tax year (needs
      dividend *payment dates*, not just annual totals — check whether
      `lib/yahoo-api.ts`'s dividend-events data, currently collapsed into
      annual totals, needs to be exposed with dates for this).
- [ ] Track paid-vs-outstanding purification amounts — this needs
      persistence (see `ARCHITECTURE.md`'s open question), so probably
      comes after that's decided.
- [ ] UI must carry a visible disclaimer that this is an approximation, not
      a religious ruling — consistent with the disclaimer footer already on
      every stock-analysis page.

### 4. Portfolio Income & Growth (`/portfolio/income`)
Depends on: Import Portfolio.
- [ ] Aggregate current annual income: `sum(shares × annualDividend)`
      across holdings.
- [ ] Portfolio-level income CAGR — reuse `cagr()` from `lib/utils.ts`.
      Needs *historical* portfolio composition (what was held when) to be
      accurate; a simpler v1 could just apply each holding's own
      `dividendCAGR5Y`/`estimatedDividendGrowth5Y` forward from today's
      position sizes instead of reconstructing history.
- [ ] Income calendar (which months pay) — needs per-holding dividend
      *dates*, same data-availability question as Purification above.
- [ ] "What's dragging down growth" — sort holdings by their own
      `dividendCAGR5Y`/`dividendStatus`, both already computed per-stock.

### 5. Top 10 Discounted Stocks (`/screener`)
Different dependency: needs a *ticker universe* to screen, not an imported
portfolio.
- [ ] Decide the universe: a hardcoded curated list of halal-compliant
      large caps is the fastest path; a broader index screen is more
      complete but means many more API calls per run.
- [ ] Batch `getStockData()` calls across the universe — mind Yahoo rate
      limiting; likely needs sequencing/throttling, not
      `Promise.all` on the whole list at once.
- [ ] Rank by `(estimatedFairValue - currentPrice) / currentPrice`, filter
      out `isHalalCompliant === false` and `dividendStatus === 'poor'`.
- [ ] Cache results (this is expensive to compute on every page load) —
      needs a decision on where (in-memory with a TTL is a reasonable v1;
      no persistence layer required unlike the portfolio pages).

## Longer-term / not yet scoped

- Shareable per-symbol URLs for the stock-analysis tabs (e.g.
  `/stock/AAPL/overview`) — noted as a nice-to-have in `ARCHITECTURE.md`,
  not currently planned in detail.
- A real peer/index benchmark for `dividendGrowthBenchmark` /
  `fcfGrowthBenchmark` in `lib/screening.ts`, instead of the current fixed
  6% placeholder constants.
- Broader tests. `npm run test:data` covers the tools and the five
  `lib/data/*.ts` converters, but `lib/screening.ts` (pure functions, the Halal/dividend/
  profitability/valuation scoring) has no direct tests yet, nor do the
  formatters in `lib/utils.ts` (`isMissing`, `formatPercent`, etc.). The
  harness is a plain script with a `check()` helper — migrating it to
  Vitest/Jest later is straightforward if a real test runner is wanted.
- `fetchRawStockData` itself is still only verifiable against live Yahoo
  data. Saving one real `[yahoo-api] raw sample` response as a fixture would
  let the tests use true Yahoo output instead of hand-built look-alikes.
