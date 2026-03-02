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

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return `${value.toFixed(0)}`;
}

export function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) return "$" + (value / 1_000_000).toFixed(2) + "m";
  if (value >= 1_000) return "$" + (value / 1_000).toFixed(0) + "k";
  return audShort.format(value);
}

/**
 * Days per period matching the backend exactly.
 * Backend: weekly=7, fortnightly=14, monthly=365/12
 */
const DAYS_PER_PERIOD: Record<number, number> = {
  52: 7,
  26: 14,
  12: 365 / 12,
};

/**
 * Reverse-solve: given a desired periodic payment, compute the loan amount
 * using daily compounding (matching the backend exactly).
 */
export function loanAmountFromPayment(
  payment: number,
  annualRate: number,
  years: number,
  periodsPerYear: number,
): number {
  const dailyRate = annualRate / 365;
  const daysPerPeriod = DAYS_PER_PERIOD[periodsPerYear] ?? 365 / periodsPerYear;
  const r = Math.pow(1 + dailyRate, daysPerPeriod) - 1;
  const n = years * periodsPerYear;
  if (r === 0) return payment * n;
  return payment * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
}
