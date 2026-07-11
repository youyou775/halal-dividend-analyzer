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

- Full 3-column single-screen layout (Halal card, Dividend card, 2x2 metric
  grid, sentiment card / dividend growth + valuation charts / price chart,
  news, company info, tabbed financial statements) matching the wireframe.
- Dark mode (persisted, respects OS preference on first load).
- Mobile responsive: columns stack and scroll below the `lg` breakpoint.
- Search bar re-fetches `/api/stock/[symbol]`.
- Halal + dividend screening engine (`lib/screening.ts`), used server-side
  so `isHalalCompliant` / `isDividendHealthy` are computed once and shipped
  to the client, matching your original brief's interface.
- Yahoo Finance integration (`lib/yahoo-api.ts`, via `yahoo-finance2`) with
  per-request fallback to sample data if a call throws.

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

## Known gaps / good next steps

- "Single screen, no scroll" is achieved at typical desktop widths/heights.
  Below roughly 700–750px of viewport height the cards will compress more
  than is comfortable; a scrollbar reappears on the overall content area at
  that point rather than squeezing further.
- News is minimal by design — just the top 2 results from
  `yahooFinance.search()`.
