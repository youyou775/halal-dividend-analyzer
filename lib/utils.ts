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
