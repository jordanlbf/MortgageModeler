/**
 * Loan math utilities.
 *
 * Pure functions with no UI dependencies — safe to use in hooks,
 * components, or server-side code.
 */

/**
 * Days per period matching the compute service exactly.
 * Compute: weekly=7, fortnightly=14, monthly=365/12
 */
const DAYS_PER_PERIOD: Record<number, number> = {
  52: 7,
  26: 14,
  12: 365 / 12,
};

/**
 * Reverse-solve: given a desired periodic payment, compute the loan amount
 * using daily compounding (matching the compute service exactly).
 */
/**
 * Forward-solve: given a loan amount, compute the periodic payment
 * using daily compounding (matching the compute service exactly).
 */
export function paymentFromLoanAmount(
  principal: number,
  annualRate: number,
  years: number,
  periodsPerYear: number,
): number {
  const dailyRate = annualRate / 365;
  const daysPerPeriod = DAYS_PER_PERIOD[periodsPerYear] ?? 365 / periodsPerYear;
  const r = Math.pow(1 + dailyRate, daysPerPeriod) - 1;
  const n = years * periodsPerYear;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * Reverse-solve: given a desired periodic payment, compute the loan amount
 * using daily compounding (matching the compute service exactly).
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
