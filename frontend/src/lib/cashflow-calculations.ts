import type { LoanType } from "./cashflow-types";

export function parseCurrencyCf(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, "")) || 0;
}

export function formatCurrencyCf(value: number): string {
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString("en-AU", { maximumFractionDigits: 0 });
  return value < 0 ? `\u2212$${formatted}` : `$${formatted}`;
}

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

export function calculateMonthlyRepayment(principal: number, annualRate: number, termYears: number): number {
  if (annualRate === 0) return principal / (termYears * 12);
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

export function calculateIOPayment(principal: number, annualRate: number): number {
  return principal * (annualRate / 100 / 12);
}

export function calculateLoanBalanceAtYear(
  principal: number,
  annualRate: number,
  termYears: number,
  yearsElapsed: number,
  loanType: LoanType,
  ioPeriod: number
): number {
  if (loanType === "interest-only" && yearsElapsed < ioPeriod) {
    return principal;
  }

  const effectiveYearsElapsed = loanType === "interest-only"
    ? yearsElapsed - ioPeriod
    : yearsElapsed;
  const effectiveTermYears = loanType === "interest-only"
    ? termYears - ioPeriod
    : termYears;

  if (effectiveYearsElapsed <= 0) return principal;
  if (effectiveYearsElapsed >= effectiveTermYears) return 0;

  const monthlyRate = annualRate / 100 / 12;
  const paymentsMade = effectiveYearsElapsed * 12;

  const monthlyPayment = calculateMonthlyRepayment(principal, annualRate, effectiveTermYears);
  const balance = principal * Math.pow(1 + monthlyRate, paymentsMade) -
                  monthlyPayment * ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate);

  return Math.max(0, balance);
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
