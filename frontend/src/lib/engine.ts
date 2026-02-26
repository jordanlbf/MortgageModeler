/**
 * Client-side amortisation engine.
 * Mirrors the Python backend — daily compounding, periodic repayments.
 */

export type Frequency = "weekly" | "fortnightly" | "monthly";

export interface ScheduleRow {
  period: number;
  year: number;
  openingBalance: number;
  interest: number;
  principalPaid: number;
  closingBalance: number;
  totalInterest: number;
  totalPrincipal: number;
}

export interface Schedule {
  rows: ScheduleRow[];
  payment: number;
  totalInterest: number;
  totalPeriods: number;
}

const PERIODS_PER_YEAR: Record<Frequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
};

const DAYS_PER_PERIOD: Record<Frequency, number> = {
  weekly: 7,
  fortnightly: 14,
  monthly: 365 / 12,
};

export function effectivePeriodicRate(annualRate: number, frequency: Frequency): number {
  const dailyRate = annualRate / 365;
  return Math.pow(1 + dailyRate, DAYS_PER_PERIOD[frequency]) - 1;
}

export function calculatePeriodicRepayment(
  principal: number,
  annualRate: number,
  loanTermYears: number,
  frequency: Frequency = "monthly"
): number {
  if (principal <= 0) return 0;
  const n = loanTermYears * PERIODS_PER_YEAR[frequency];
  if (annualRate <= 0) return principal / n;
  const r = effectivePeriodicRate(annualRate, frequency);
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function generateSchedule(
  principal: number,
  annualRate: number,
  loanTermYears: number,
  frequency: Frequency = "monthly"
): Schedule {
  const ppy = PERIODS_PER_YEAR[frequency];
  const r = effectivePeriodicRate(annualRate, frequency);
  const n = loanTermYears * ppy;
  const payment = calculatePeriodicRepayment(principal, annualRate, loanTermYears, frequency);

  let balance = principal;
  const rows: ScheduleRow[] = [];
  let totalInterest = 0;
  let totalPrincipal = 0;

  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    let princPaid = payment - interest;
    if (princPaid > balance) princPaid = balance;
    balance -= princPaid;
    if (balance < 0.01) balance = 0;
    totalInterest += interest;
    totalPrincipal += princPaid;

    rows.push({
      period: i,
      year: Math.ceil(i / ppy),
      openingBalance: balance + princPaid,
      interest,
      principalPaid: princPaid,
      closingBalance: balance,
      totalInterest,
      totalPrincipal,
    });
  }

  return { rows, payment, totalInterest, totalPeriods: n };
}
