import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";

/** @deprecated Use `parseCurrencyInput` from `@/lib/formatters` directly. */
export const parseCurrencyCf = parseCurrencyInput;

/** @deprecated Use `formatDollarsSigned` from `@/lib/formatters` directly. */
export const formatCurrencyCf = formatDollarsSigned;

export function formatAbbreviated(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}m`;
  }
  return `$${Math.round(value / 1000).toLocaleString()}k`;
}

export function formatChartLabel(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "\u2212" : "";
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}m`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}k`;
  return `${sign}$${Math.round(abs)}`;
}

/** Stage 3 tax brackets (effective 1 July 2024). */
export function getMarginalTaxRate(income: number): number {
  if (income <= 18200) return 0;
  if (income <= 45000) return 0.16;
  if (income <= 135000) return 0.30;
  if (income <= 190000) return 0.37;
  return 0.45;
}
