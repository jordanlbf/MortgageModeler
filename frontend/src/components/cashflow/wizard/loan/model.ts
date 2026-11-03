import type { CashflowState } from "@/hooks/useCashflowState";
import { paymentFromLoanAmount } from "@/lib/calculations";
import { parseCurrencyInput } from "@/lib/formatters";

export type Frequency = "weekly" | "fortnightly" | "monthly";
export const PERIODS: Record<Frequency, number> = { weekly: 52, fortnightly: 26, monthly: 12 };

export interface Simulation {
  months: number;
  totalInterest: number;
  /** Balance at the end of each year, starting with the opening balance. */
  yearly: number[];
}

/**
 * Month-by-month amortisation. An offset reduces the balance interest is
 * charged on (it grows by its monthly contribution); extra repayments are
 * added to every repayment. Stops when the loan is paid off.
 */
export function simulate(
  principal: number,
  annualRate: number,
  years: number,
  opts: { offset?: number; offsetContribution?: number; extra?: number } = {},
): Simulation {
  const yearly = [principal];
  if (principal <= 0 || annualRate <= 0 || years <= 0) return { months: 0, totalInterest: 0, yearly };

  const r = Math.pow(1 + annualRate / 365, 365 / 12) - 1;
  const payment = paymentFromLoanAmount(principal, annualRate, years, 12) + (opts.extra ?? 0);
  let balance = principal;
  let offset = opts.offset ?? 0;
  let totalInterest = 0;
  let months = 0;

  while (balance > 0.01 && months < years * 12 + 1) {
    const interest = Math.max(0, balance - offset) * r;
    totalInterest += interest;
    balance = Math.max(0, balance + interest - payment);
    offset += opts.offsetContribution ?? 0;
    months++;
    if (months % 12 === 0) yearly.push(balance);
  }
  if (months % 12 !== 0) yearly.push(balance);
  return { months, totalInterest, yearly };
}

/** Everything the Loan step (and the summary) reads from state, derived once. */
export function loanModel(s: CashflowState) {
  const principal = s.isNewPurchase
    ? Math.max(0, parseCurrencyInput(s.purchasePrice) - parseCurrencyInput(s.depositAmount))
    : parseCurrencyInput(s.currentLoanBalance);
  const value = parseCurrencyInput(s.isNewPurchase ? s.purchasePrice : s.currentValue);
  const lvr = principal > 0 && value > 0 ? principal / value : null;
  const annualRate = parseFloat(s.interestRate) / 100 || 0;
  const years = parseFloat(s.loanTerm) || 0;
  const offset = s.hasOffset ? parseCurrencyInput(s.offsetBalance) : 0;
  const offsetContribution = s.hasOffset ? parseCurrencyInput(s.offsetMonthlyContribution) : 0;
  const extra = parseCurrencyInput(s.extraRepayments);
  const ready = principal > 0 && annualRate > 0 && years > 0;

  const repayment = (f: Frequency) => (ready ? paymentFromLoanAmount(principal, annualRate, years, PERIODS[f]) : 0);
  const base = simulate(principal, annualRate, years);
  const withExtras = simulate(principal, annualRate, years, { offset, offsetContribution, extra });
  const hasExtras = offset > 0 || offsetContribution > 0 || extra > 0;

  return {
    principal,
    lvr,
    annualRate,
    years,
    ready,
    repayment,
    monthly: repayment("monthly") + extra,
    base,
    withExtras,
    hasExtras,
    interestSaved: Math.max(0, base.totalInterest - withExtras.totalInterest),
    monthsSaved: Math.max(0, base.months - withExtras.months),
  };
}

export type LoanModel = ReturnType<typeof loanModel>;

/** "4 yrs 3 mo", "11 mo", "30 yrs". */
export function formatMonths(m: number) {
  const y = Math.floor(m / 12);
  const mo = m % 12;
  if (y === 0) return `${mo} mo`;
  return mo === 0 ? `${y} yrs` : `${y} yrs ${mo} mo`;
}

export const payoffYear = (months: number) => String(new Date().getFullYear() + Math.ceil(months / 12));
