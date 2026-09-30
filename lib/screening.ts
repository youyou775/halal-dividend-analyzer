import type { DividendStatus } from './types';

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
  minDividendYield: 2,
  maxPayoutRatio: 70,
  minDividendStreak: 5,
  minFcfCoverage: 1.0,
  minDividendCAGR5Y: 5,
};

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
 * Dividend health uses a tiered model: yield, payout ratio, and FCF coverage
 * are the brief's "hard" criteria (no "(preferred)" tag); dividend streak and
 * 5yr CAGR are the brief's "(preferred)" criteria, treated as bonus signal
 * rather than disqualifying on their own. This is what turns a boolean
 * isDividendHealthy into a three-way Healthy / Mixed / Poor read.
 */
export function screenDividend(input: {
  dividendYield: number;
  payoutRatio: number;
  fcfCoverage5Y: number;
  dividendGrowthStreak: number;
  dividendCAGR5Y: number;
}): { status: DividendStatus; isHealthy: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const t = SCREENING_THRESHOLDS;

  const hardPass =
    input.dividendYield >= t.minDividendYield &&
    input.payoutRatio <= t.maxPayoutRatio &&
    input.fcfCoverage5Y >= t.minFcfCoverage;

  if (input.dividendYield < t.minDividendYield) {
    reasons.push(`Yield ${input.dividendYield.toFixed(2)}% is below the ${t.minDividendYield}% target`);
  }
  if (input.payoutRatio > t.maxPayoutRatio) {
    reasons.push(`Payout ratio ${input.payoutRatio.toFixed(0)}% exceeds the ${t.maxPayoutRatio}% limit`);
  }
  if (input.fcfCoverage5Y < t.minFcfCoverage) {
    reasons.push(`FCF coverage ${input.fcfCoverage5Y.toFixed(2)}x is below ${t.minFcfCoverage}x`);
  }

  let softScore = 0;
  if (input.dividendGrowthStreak >= t.minDividendStreak) {
    softScore++;
  } else {
    reasons.push(`Streak of ${input.dividendGrowthStreak}yrs is below the ${t.minDividendStreak}yr preferred minimum`);
  }
  if (input.dividendCAGR5Y >= t.minDividendCAGR5Y) {
    softScore++;
  } else {
    reasons.push(`5yr dividend CAGR ${input.dividendCAGR5Y.toFixed(1)}% is below the ${t.minDividendCAGR5Y}% preferred minimum`);
  }

  const disqualified = input.payoutRatio > 100 || input.fcfCoverage5Y < 0.5 || input.dividendYield <= 0;

  let status: DividendStatus;
  if (disqualified) status = 'poor';
  else if (hardPass && softScore >= 1) status = 'healthy';
  else if (hardPass || softScore >= 1) status = 'mixed';
  else status = 'poor';

  return { status, isHealthy: status === 'healthy', reasons };
}
