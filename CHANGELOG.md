# Changelog

All notable changes to the Halal Dividend Analyzer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts port of the
  original Python/Dash MVP — Shariah-compliance + dividend-health screening
  dashboard (see [`ARCHITECTURE.md`](./ARCHITECTURE.md)).
- Stock analysis tabs under `/stock/*`: Overview, Dividend Growth, Profitability,
  Sensitivity, Financial Statements.
- Portfolio pages under `/portfolio/*`: Import, Income, Diversification,
  Purification (planned/shipped stubs per `ROADMAP.md`).
- `yahoo-finance2` data fetching with a consistent sample-data fallback
  (yellow "Showing sample data" banner) so failures are never mistaken for live data.
- Offline, Yahoo-shaped fixtures test suite (`scripts/test-calculators.ts`,
  `npm run test:data`, 52 checks) covering shallow history, quarterly fill-in,
  current-year exclusion, Sept-30 fiscal-year price matching, and
  `StockData` field completeness.
- Modular `lib/` layer by call-stack order: entry → API → data converters → tools
  → screening → utils → types → mock fallback.
- `isMissing()` null/undefined/NaN handling, CAGR helpers, and memoized
  `FundamentalsTools.annualPeriods()` per request via WeakMap.

### Fixed

- Current (incomplete) calendar year excluded from annual fundamentals/dividend charts.
- PE ratios now use each period's actual fiscal-year-end date instead of assuming December 31.
- "5yr"/"10yr" now consistently mean "N data points" (was 6 vs 10).

## [0.1.0] - 2026-11-12

### Added

- Initial public commit pushed to `main` on
  `https://github.com/youyou775/halal-dividend-analyzer.git`.
- All source files committed (65 files): `app/`, `components/`, `lib/`,
  `scripts/`, config files, and docs (`ARCHITECTURE.md`, `README.md`, `ROADMAP.md`).
- `.gitignore` excludes `node_modules`, `.next`, `out`, `build`, `.env*`, `*.log`,
  and `.DS_Store`.