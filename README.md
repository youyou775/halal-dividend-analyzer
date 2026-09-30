# Halal Dividend Analyzer (Next.js)

A Shariah-compliance + dividend-health screening dashboard, rebuilt from the
Python/Dash MVP into Next.js 14 (App Router) + TypeScript + Tailwind + Recharts.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. Data comes from `yahoo-finance2` — **no API key
needed**. If a lookup fails (bad symbol, network issue, Yahoo rate-limiting),
the app falls back to an internally-consistent sample dataset with a yellow
"Showing sample data" banner so it's never mistaken for live data.

**Worth knowing:** `yahoo-finance2` wraps Yahoo Finance's unofficial,
undocumented endpoints — the same underlying data source your original
brief explicitly steered away from (via `yfinance`) over ToS concerns. It's
widely used and free, but it isn't an official, rate-limited-and-supported
API the way FMP is. If that tradeoff matters for how you ship this, the
previous FMP-based integration is straightforward to restore — see
"Switching data providers" below.

## Deploy

Push to a GitHub repo and import it in Vercel, or run `npx vercel`. No
environment variables are required for the default Yahoo-backed setup.

## Switching data providers

The API route (`app/api/stock/[symbol]/route.ts`) only depends on one
function: `getStockData(symbol) => Promise<{ data: StockData; isSample: boolean }>`,
currently implemented in `lib/yahoo-api.ts`. Swapping providers again later
just means writing a new file with that same signature and changing the one
import in the route — nothing in the UI or screening layer needs to change.

## What's implemented

The dashboard is now five tabs (`components/TabNav.tsx`, wired up in
`app/page.tsx`), each with its own single-screen layout:

1. **Overview** — halal screening, key metrics, price chart, news, and a
   summary card per other tab (click "View →" to jump there).
2. **Dividend Growth** — dividend health card + screening detail list, and
   the dividend/FCF-coverage charts.
3. **Profitability** *(new)* — revenue vs. cost of revenue chart, gross
   margin trend, revenue/net income CAGR (5yr & 10yr), gross margin ratio
   (5yr avg, 10yr avg, last year), and a current revenue/gross
   profit/net income/EPS snapshot.
4. **Sensitivity Analysis** *(new)* — TTM PE vs. 5yr/10yr average PE, a
   10-year history table (EPS, PE, price, dividend/share, total return,
   compounded return), predicted 5yr EPS growth, and a PE-scenario ×
   time-horizon price projection grid.
5. **Financials & Info** — tabbed financial statements, market sentiment,
   company info.

Also still in place from before:
- Dark mode (persisted, respects OS preference on first load).
- Mobile responsive: columns stack and scroll below the `lg` breakpoint.
- Search bar re-fetches `/api/stock/[symbol]`.
- Halal + dividend screening engine (`lib/screening.ts`), used server-side
  so `isHalalCompliant` / `isDividendHealthy` are computed once and shipped
  to the client.
- Yahoo Finance integration (`lib/yahoo-api.ts`, via `yahoo-finance2`) with
  per-request fallback to sample data if a call throws, and diagnostic
  console logging if the underlying data shape is ever unexpected.

## Decisions worth knowing about

The brief's wireframe repeats a handful of placeholder-looking numbers
identically across unrelated fields (e.g. `6.93x` shown for 5yr, 10yr, *and*
"estimated" FCF coverage; `2.47%` for both 5yr and 10yr EPS CAGR; `-2.9%` for
both historical and "estimated" dividend growth). Those read as Figma
copy-paste placeholders rather than intentional data, so the sample dataset
uses distinct, internally-consistent numbers instead of reproducing the
repeats literally. Numbers that appeared once and specifically (debt ratio
27%, payout ratio 13%, yield 0.38%, PE 34, revenue 391/383/394B, fair value
$199.90, etc.) are carried over exactly.

**Dividend "streak" vs. 5yr CAGR.** The brief lists a 10-year streak
alongside a *negative* 5-year dividend CAGR — those can't both mean
"consecutive years of increases." This build treats `dividendGrowthStreak`
as *consecutive years the dividend was paid without a cut* (a real, commonly
published metric, distinct from a growth streak), which lets a company with
a decade of uninterrupted payments still show a recent slowdown. The
`lib/fmp-api.ts` streak calculation implements this same definition from raw
dividend history.

**Haram earnings ratio.** No mainstream financial API (FMP included)
publishes a "% haram earnings" field directly. The live-data path
approximates it as interest/non-operating income as a share of revenue,
which mirrors the standard AAOIFI / Dow Jones Islamic Market
"non-permissible income" screen — but it's a first-pass approximation, not a
certified ruling. There's a disclaimer footer in the UI for this reason;
for anything beyond a rough screen, pair this with a dedicated Shariah
screening provider (Zoya, Musaffa, IdealRatings).

**Fair value estimate.** Uses Yahoo's analyst `targetMeanPrice` when
available, falling back to a simple PE × EPS estimate otherwise. If your
Python MVP used a more specific methodology (DCF, dividend discount model,
etc.), swap it in inside `getStockData()` in `lib/yahoo-api.ts`.

**Analyst rating/consensus.** Derived from the `recommendationTrend`
module's current-month buy/hold/sell counts.

**Historical PE-by-year and EPS/FCF CAGRs.** Now computed for real: each
fiscal year's diluted EPS (from `fundamentalsTimeSeries`) is matched to the
closest month-end price (from `chart()`) to build a genuine PE-by-year
series, and 5yr/10yr EPS and FCF CAGRs are calculated from that same annual
data — no more flat/duplicated placeholder values.

**Financial statements, EPS CAGR, FCF coverage, and revenue/EPS were
reported broken a second time — deeper root cause.** The previous fix
assumed `fundamentalsTimeSeries` returns one merged object per fiscal year
with plain `annualXxx` number fields. That assumption was itself based on
the library's documented examples, but its own type signature returns this
call as `Promise<any>` — meaning it does **no schema validation**, so the
actual runtime shape was still an open question. This version no longer
assumes a single shape: `normalizeFundamentals()` in `lib/yahoo-api.ts`
handles two plausible shapes (one object per year with plain fields, or
Yahoo's raw per-field shape with `{ asOfDate, reportedValue: { raw, fmt } }`
entries), and `pickField()` tries several plausible field-name variants per
line item rather than one hardcoded guess.

**If it's still wrong: read the logs, don't guess again.** Every
`fundamentalsTimeSeries` call now logs `[yahoo-api] raw sample (financials|
balance-sheet|cash-flow): ...` with the actual (truncated) response before
any parsing happens. If a section is still off, that log line has the real
field names and shape — paste it back and the fix becomes a direct lookup
instead of another guess. This project's build sandbox has no network
access to Yahoo's endpoints at all, so none of this can be verified against
live data before it reaches you; the defensive parsing and logging exist
specifically to compensate for that.

**FCF coverage, 5yr vs. 10yr.** Computed as the average of `|free cash flow
/ dividends paid|` per fiscal year across the trailing 5 and 10 year
windows, so the two numbers now genuinely differ (previously both used the
same trailing-twelve-month snapshot).

## Sensitivity analysis methodology (v1 — worth refining)

This tab is the newest and most opinionated piece, so it's worth being
explicit about what it actually computes:

- **Historical returns table**: each year's EPS and PE come from the same
  fundamentals + price-matching logic used elsewhere (`lib/yahoo-api.ts`).
  Total return = `(price change + dividend per share) / prior year price`.
  Compounded return = cumulative product of `(1 + total return)` across the
  window, so it's a total-return figure (assumes dividends contribute to
  return, not that they're reinvested at the exact ex-dividend price).
- **Price sensitivity grid**: `projected price = PE scenario × EPS ×
  (1 + estimated EPS growth)^years`. The three PE scenarios (Bear/Base/Bull)
  are naive: 10yr-average PE minus/plus 15%, and the higher of TTM/10yr-avg
  PE plus 10%. This is a starting point, not a statistically grounded
  scenario model — there's no volatility, no distribution, no correlation
  between price and rates/multiples. If you want genuine sensitivity
  analysis (e.g. Monte Carlo over historical return volatility, or explicit
  bear/base/bull EPS growth assumptions rather than one shared growth rate),
  that's a good next iteration.
- **Predicted EPS growth**: reuses `estimatedEPSGrowth5Y` (the 5yr historical
  EPS CAGR) as the forward assumption — there's no analyst forward-estimate
  data source wired in yet.

## Layout

Cards distribute to fill the full column height on desktop (`lg` and up) via
proportional flexbox weights (`flex-1`, `flex-[1.3]`, etc. per section in
`app/page.tsx`) rather than sizing to content — so there's no dead space at
the bottom and, at typical desktop heights, no need to scroll. Charts use
`ResponsiveContainer height="100%"` inside a `flex-1 min-h-0` wrapper instead
of a fixed pixel height so they actually grow with their card. The financial
statements table scrolls internally (both directions, with a sticky header
and first column) since it now shows up to 10 years of data. On very short
viewports the whole content area still falls back to scrolling rather than
compressing cards past legibility.

## Roadmap (future prompts — not built yet)

Noted here so future sessions have the full picture without re-explaining:

- **Portfolio diversification page** — allocation risk by industry, market
  cap, and geography across a whole portfolio.
- **Purification page** — calculates the non-compliant-income amount to
  purify (donate) per holding, likely building on the `haramEarningsRatio`
  groundwork already in `lib/screening.ts` / `lib/yahoo-api.ts`.
- **Portfolio income page** — income and income-growth tracking across a
  full portfolio, not just one stock.
- **Top 10 discounted stocks page** — screens a stock universe using this
  same analysis (likely reusing the Sensitivity tab's fair-value model) and
  ranks by discount to fair value.
- **Portfolio import** — .xls/.txt import from brokerages, Charles Schwab
  first. This is a new input pathway (file upload + parsing) that the other
  portfolio-level pages above will depend on.

Each of these is substantial enough to be its own session — this single-stock
analyzer (this file) is the foundation the portfolio-level pages will sit on
top of, particularly the screening engine and fair-value model.

## Known gaps / good next steps

- "Single screen, no scroll" is achieved at typical desktop widths/heights.
  Below roughly 700–750px of viewport height the cards will compress more
  than is comfortable; a scrollbar reappears on the overall content area at
  that point rather than squeezing further.
- News is minimal by design — just the top 2 results from
  `yahooFinance.search()`.
