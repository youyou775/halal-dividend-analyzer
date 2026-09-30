import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number, decimals = 1): string {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function formatMultiple(value: number): string {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(2)}x`;
}

export function formatCompactBillions(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `$${value.toFixed(1)}B`;
}

export function formatCurrency(value: number): string {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `$${value.toFixed(2)}`;
}

export function average(values: number[]): number {
  const valid = values.filter((v) => typeof v === 'number' && !Number.isNaN(v) && v !== 0);
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/** CAGR between two same-sign positive values over `years` periods. */
export function cagr(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}
