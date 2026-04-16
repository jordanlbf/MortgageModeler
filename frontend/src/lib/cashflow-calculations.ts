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

export function getMarginalTaxRate(income: number): number {
  if (income <= 18200) return 0;
  if (income <= 45000) return 0.19;
  if (income <= 120000) return 0.325;
  if (income <= 180000) return 0.37;
  return 0.45;
}

export function calculateIncomeTax(taxableIncome: number): number {
  let tax = 0;
  if (taxableIncome <= 18200) tax = 0;
  else if (taxableIncome <= 45000) tax = (taxableIncome - 18200) * 0.19;
  else if (taxableIncome <= 120000) tax = 5092 + (taxableIncome - 45000) * 0.325;
  else if (taxableIncome <= 180000) tax = 29467 + (taxableIncome - 120000) * 0.37;
  else tax = 51667 + (taxableIncome - 180000) * 0.45;
  return Math.round(tax + taxableIncome * 0.02);
}
