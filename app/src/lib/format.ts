/**
 * Format a number as currency using Intl.
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format hours as a human-readable string.
 */
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

/**
 * Calculate percentage, clamped to 0-100.
 */
export function calcPercentage(consumed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.round((consumed / total) * 100), 100);
}
