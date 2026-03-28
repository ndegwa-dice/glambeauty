/**
 * KES currency formatting
 * Fixes browser locale inconsistency with toLocaleString()
 * Always renders as: KES 1,500 regardless of device locale
 */

export function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function formatKESCompact(amount: number): string {
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(1)}K`;
  return formatKES(amount);
}