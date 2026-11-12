import type { ScoreStatus } from '../6.types/types';
import { isMissing } from '../5.utils/utils';

const PROHIBITED_SECTOR_TERMS = [
  'financial services',
  'banks',
  'banking',
  'insurance',
  'gambling',
  'alcohol',
  'tobacco',
  'defense',
  'aerospace & defense',
  'adult entertainment',
];

export const SCREENING_THRESHOLDS = {
  maxDebtRatio: 33,
  maxHaramEarnings: 5,
  maxPayoutRatio: 70,
  minFcfCoverage: 1.0,
  dividendGrowthBenchmark: 6,
  fcfGrowthBenchmark: 6,
};

export const PROFITABILITY_BENCHMARKS = {
  revenueGrowthBenchmark: 5,
  netIncomeGrowthBenchmark: 5,
  grossMarginBenchmark: 30,
};

export function scoreProfitability(input: {
  revenueCAGR5Y: number | null;
  netIncomeCAGR5Y: number | null;
  grossMarginAvg5Y: number | null;
}): { status: ScoreStatus; score: number; reasons: string[] } {
  const b = PROFITABILITY_BENCHMARKS;
  const reasons: string[] = [];
  let score = 0;
  let checks = 0;

  if (!isMissing(input.revenueCAGR5Y)) {
    checks++;
    if (input.revenueCAGR5Y! >= b.revenueGrowthBenchmark) score++;
    else reasons.push(`Revenue CAGR ${input.revenueCAGR5Y!.toFixed(1)}% is below the ${b.revenueGrowthBenchmark}% benchmark`);
  }

  if (!isMissing(input.netIncomeCAGR5Y)) {
    checks++;
    if (input.netIncomeCAGR5Y! >= b.netIncomeGrowthBenchmark) score++;
    else reasons.push(`Net income CAGR ${input.netIncomeCAGR5Y!.toFixed(1)}% is below the ${b.netIncomeGrowthBenchmark}% benchmark`);
  }

  if (!isMissing(input.grossMarginAvg5Y)) {
    checks++;
    if (input.grossMarginAvg5Y! >= b.grossMarginBenchmark) score++;
    else reasons.push(`Gross margin ${input.grossMarginAvg5Y!.toFixed(0)}% is below the ${b.grossMarginBenchmark}% benchmark`);
  }

  const status: ScoreStatus = checks === 0 ? 'mixed' : score === checks ? 'healthy' : score === 0 ? 'poor' : 'mixed';
  return { status, score, reasons };
}

/**
 * Valuation scoring for the Sensitivity Analysis tab: is this stock
 * currently "cheap" by its own history? Trading at/below its own 10yr
 * average PE, and at/below the model's estimated fair value, are read as
 * attractively-priced signals — not a claim that the stock is a good buy.
 */
export function scoreValuation(input: {
  ttmPE: number;
  avgPE10Y: number | null;
  currentPrice: number;
  estimatedFairValue: number;
}): { status: ScoreStatus; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  let checks = 0;

  if (!isMissing(input.avgPE10Y) && input.avgPE10Y! > 0) {
    checks++;
    const peOk = input.ttmPE <= input.avgPE10Y!;
    if (peOk) score++;
    else reasons.push(`TTM PE ${input.ttmPE.toFixed(1)} is above the 10yr average of ${input.avgPE10Y!.toFixed(1)}`);
  }

  checks++;
  const valueOk = input.estimatedFairValue >= input.currentPrice;
  if (valueOk) score++;
  else reasons.push(`Trading above the estimated fair value of ${input.estimatedFairValue.toFixed(2)}`);

  const status: ScoreStatus = checks === 0 ? 'mixed' : score === checks ? 'healthy' : score === 0 ? 'poor' : 'mixed';
  return { status, score, reasons };
}

export function screenHalal(input: {
  sector: string;
  industry: string;
  debtRatio: number;
  haramEarningsRatio: number;
}): { isCompliant: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const sectorText = `${input.sector} ${input.industry}`.toLowerCase();
  const sectorFlagged = PROHIBITED_SECTOR_TERMS.some((term) => sectorText.includes(term));

  if (sectorFlagged) {
    reasons.push(`Sector "${input.sector}" falls in a prohibited category`);
  }
  if (input.debtRatio >= SCREENING_THRESHOLDS.maxDebtRatio) {
    reasons.push(
      `Debt ratio ${input.debtRatio.toFixed(0)}% exceeds the ${SCREENING_THRESHOLDS.maxDebtRatio}% limit`
    );
  }
  if (input.haramEarningsRatio >= SCREENING_THRESHOLDS.maxHaramEarnings) {
    reasons.push(
      `Non-compliant earnings ${input.haramEarningsRatio.toFixed(1)}% exceed the ${SCREENING_THRESHOLDS.maxHaramEarnings}% limit`
    );
  }

  return { isCompliant: reasons.length === 0, reasons };
}

/**
 * Dividend health is scored on payout ratio, FCF coverage, dividend CAGR,
 * and FCF CAGR — deliberately not yield.
 */
export function screenDividend(input: {
  payoutRatio: number;
  fcfCoverage5Y: number;
  dividendCAGR5Y: number;
  fcfCAGR5Y: number;
}): { status: ScoreStatus; isHealthy: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const t = SCREENING_THRESHOLDS;

  const payoutOk = input.payoutRatio <= t.maxPayoutRatio;
  const coverageOk = input.fcfCoverage5Y >= t.minFcfCoverage;
  const hardPass = payoutOk && coverageOk;

  if (!payoutOk) {
    reasons.push(`Payout ratio ${input.payoutRatio.toFixed(0)}% exceeds the ${t.maxPayoutRatio}% limit`);
  }
  if (!coverageOk) {
    reasons.push(`FCF coverage ${input.fcfCoverage5Y.toFixed(2)}x is below ${t.minFcfCoverage}x — the dividend isn't fully covered by free cash flow`);
  }

  let growthScore = 0;
  if (input.dividendCAGR5Y >= t.dividendGrowthBenchmark) {
    growthScore++;
  } else {
    reasons.push(`5yr dividend CAGR ${input.dividendCAGR5Y.toFixed(1)}% is below the ${t.dividendGrowthBenchmark}% dividend-growth-stock benchmark`);
  }
  if (input.fcfCAGR5Y >= t.fcfGrowthBenchmark) {
    growthScore++;
  } else {
    reasons.push(`5yr FCF CAGR ${input.fcfCAGR5Y.toFixed(1)}% is below the ${t.fcfGrowthBenchmark}% benchmark`);
  }

  const disqualified = input.payoutRatio > 100 || input.fcfCoverage5Y < 0.5;

  let status: ScoreStatus;
  if (disqualified) status = 'poor';
  else if (hardPass && growthScore === 2) status = 'healthy';
  else if (hardPass || growthScore >= 1) status = 'mixed';
  else status = 'poor';

  return { status, isHealthy: status === 'healthy', reasons };
}