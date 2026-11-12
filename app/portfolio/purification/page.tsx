import { ComingSoon } from '@/components/planned/ComingSoon';

export default function PurificationPage() {
  return (
    <ComingSoon
      title="Purification"
      description="Calculates the amount of non-compliant ('haram') income to purify (donate) per holding, based on each company's non-permissible income ratio."
      scope={[
        'Reuse haramEarningsRatio from lib/screening.ts / lib/yahoo-api.ts as the starting data point',
        'Per holding: purification amount = shares held × dividend per share × haram earnings ratio',
        'Aggregate total purification amount owed across the whole portfolio',
        'Track purification amounts already paid vs. outstanding, by tax year',
        'Clearly flag this as an approximation and link out to a qualified Shariah advisor for a authoritative determination',
      ]}
    />
  );
}
