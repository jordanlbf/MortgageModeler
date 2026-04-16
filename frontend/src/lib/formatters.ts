/** Safe division — returns 0 when divisor is 0 or result is non-finite. */
export function safeDiv(a: number, b: number): number {
  const r = b !== 0 ? a / b : 0;
  return Number.isFinite(r) ? r : 0;
}

const audFull = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
});

const audShort = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return audFull.format(value);
}

export function formatCurrencyShort(value: number): string {
  return audShort.format(value);
}

/**
 * Parse a currency string to a number, stripping non-numeric characters.
 * Returns 0 for empty/invalid input (safe for form values).
 */
export function parseCurrencyInput(s: string): number {
  return parseFloat(s.replace(/[^0-9.-]/g, "")) || 0;
}

/**
 * Format a number as a signed dollar amount with no decimals.
 * Negative values render as `-$1,234`, zero renders as `""`.
 * Used for form display in grants and purchase-costs views.
 */
export function formatDollars(n: number): string {
  if (n === 0) return "";
  const abs = Math.abs(n);
  const formatted = "$" + abs.toLocaleString("en-AU", { maximumFractionDigits: 0 });
  return n < 0 ? `-${formatted}` : formatted;
}

/**
 * Format a number as a signed dollar amount with no decimals.
 * Negative values use the unicode minus sign (U+2212): `−$1,234`.
 * Positive values render as `$1,234`. Zero renders as `$0`.
 */
export function formatDollarsSigned(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-AU", { maximumFractionDigits: 0 });
  return n < 0 ? `\u2212$${formatted}` : `$${formatted}`;
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return `${value.toFixed(0)}`;
}


export { loanAmountFromPayment } from "@/lib/calculations";
