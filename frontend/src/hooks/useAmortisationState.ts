"use client";

import { useState, useMemo, useCallback } from "react";
import type { Frequency, ChartDataPoint } from "@/lib/types";
import type { ScheduleResponse, ScheduleRow } from "@/lib/api";
import { fetchSchedule } from "@/lib/api";
import { PERIODS_PER_YEAR } from "@/lib/constants";
import { useApiCall } from "./useApiCall";

export interface AmortisationInputs {
  purchasePrice: number;
  deposit: number;
  rate: number;
  years: number;
  appreciation: number;
  offsetBalance: number;
  offsetContribution: number;
  frequency: Frequency;
}

export interface AmortisationInputSetters {
  setPurchasePrice: (v: number) => void;
  setDeposit: (v: number) => void;
  setRate: (v: number) => void;
  setYears: (v: number) => void;
  setAppreciation: (v: number) => void;
  setOffsetBalance: (v: number) => void;
  setOffsetContribution: (v: number) => void;
  setFrequency: (v: Frequency) => void;
}

/** Sample data for the kitchen sink: inputs plus a precomputed schedule, so no API call is made. */
export interface AmortisationSource {
  inputs?: Partial<AmortisationInputs>;
  data: ScheduleResponse;
  /** The same loan without the offset, when the sample has one. */
  baseline?: ScheduleResponse;
}

/** The headline figures, worked out from the schedule. */
export interface AmortisationSummary {
  payment: number;
  /** The repayment over a year (payment × repayments a year), for budgeting. */
  yearlyRepayment: number;
  loanAmount: number;
  /** As a decimal (0.83). */
  lvr: number;
  totalInterest: number;
  /** Principal plus interest. */
  totalRepaid: number;
  /** How long until the loan is paid off (shorter than the term with an offset). */
  payoffYears: number;
  payoffMonths: number;
  /** What the offset account saves, against the same loan without it. Null with no offset. */
  offset: OffsetSaving | null;
}

export interface OffsetSaving {
  interestSaved: number;
  /** How much sooner the loan is paid off, in whole months. */
  monthsSooner: number;
  /** Total interest and payoff time without the offset, for comparison. */
  interestWithout: number;
  monthsWithout: number;
}

export interface AmortisationState {
  inputs: AmortisationInputs;
  setters: AmortisationInputSetters;
  data: ScheduleResponse | null;
  summary: AmortisationSummary | null;
  /** No price yet, or a deposit that covers it: nothing to work out until the user fills it in. */
  waiting: boolean;
  loading: boolean;
  error: string | null;
  retry: () => void;
  chartData: ChartDataPoint[];
  /** The same loan without the offset, per year. Empty with no offset. */
  baselineChartData: ChartDataPoint[];
  tableRows: ScheduleRow[];
}

function toChartData(d: ScheduleResponse | null): ChartDataPoint[] {
  if (!d) return [];
  const loan = d.summary.loan_amount;
  return d.chart_data.map((p) => ({
    y: p.year,
    bal: p.balance,
    int: p.total_interest,
    eq: p.equity,
    paid: p.total_interest + (loan - p.balance),
    lvr: p.property_value > 0 ? (p.balance / p.property_value) * 100 : 0,
    offset: p.offset_balance,
  }));
}

/**
 * Repayments until the balance reaches zero. The schedule runs to the end of
 * the term even when an offset clears the loan early, so count to the first
 * zero balance rather than using `total_periods`.
 */
function periodsToPayoff(d: ScheduleResponse): number {
  const i = d.rows.findIndex((r) => r.closing_balance <= 0.005);
  return i >= 0 ? i + 1 : d.total_periods;
}

const DEFAULTS: AmortisationInputs = {
  // Empty: the user enters their own price and deposit first.
  purchasePrice: 0,
  deposit: 0,
  rate: 6.2,
  years: 30,
  // CoreLogic: national dwelling values grew 5.4% a year on average over the 30 years to 2022.
  appreciation: 5.4,
  offsetBalance: 0,
  offsetContribution: 0,
  frequency: "weekly",
};

export function useAmortisationState(source?: AmortisationSource): AmortisationState {
  const start = { ...DEFAULTS, ...source?.inputs };

  // ── Input state ────────────────────────────────
  const [purchasePrice, setPurchasePrice] = useState(start.purchasePrice);
  const [deposit, setDeposit] = useState(start.deposit);
  const [rate, setRate] = useState(start.rate);
  const [years, setYears] = useState(start.years);
  const [appreciation, setAppreciation] = useState(start.appreciation);
  const [offsetBalance, setOffsetBalance] = useState(start.offsetBalance);
  const [offsetContribution, setOffsetContribution] = useState(start.offsetContribution);
  const [frequency, setFrequencyRaw] = useState<Frequency>(start.frequency);

  // Bumped by retry() to run the same request again.
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // ── API fetch ──────────────────────────────────
  // Only once there's a loan to work out.
  const ready = purchasePrice > 0 && deposit < purchasePrice;
  const api = useApiCall<ScheduleResponse>(
    (signal) => fetchSchedule({
      purchase_price: purchasePrice,
      deposit,
      annual_rate: rate / 100,
      loan_term_years: years,
      frequency,
      annual_appreciation: appreciation / 100,
      offset_balance: offsetBalance,
      offset_contribution: offsetContribution,
      extra_repayment: 0,
    }, signal),
    [purchasePrice, deposit, rate, years, frequency, appreciation, offsetBalance, offsetContribution, attempt],
    { enabled: !source && ready },
  );
  const data = source ? source.data : ready ? api.data : null;

  // With an offset, the same loan again without it, to show what the offset saves.
  const hasOffset = offsetBalance > 0 || offsetContribution > 0;
  const baselineApi = useApiCall<ScheduleResponse>(
    (signal) => fetchSchedule({
      purchase_price: purchasePrice,
      deposit,
      annual_rate: rate / 100,
      loan_term_years: years,
      frequency,
      annual_appreciation: appreciation / 100,
      offset_balance: 0,
      offset_contribution: 0,
      extra_repayment: 0,
    }, signal),
    [purchasePrice, deposit, rate, years, frequency, appreciation, attempt],
    { enabled: !source && ready && hasOffset },
  );
  const baseline = source ? source.baseline ?? null : ready && hasOffset ? baselineApi.data : null;

  // ── Derived data ───────────────────────────────
  const summary: AmortisationSummary | null = useMemo(() => {
    if (!data) return null;
    const loan = data.summary.loan_amount;
    const toMonths = (periods: number) => Math.round((periods / PERIODS_PER_YEAR[frequency]) * 12);
    const months = toMonths(periodsToPayoff(data));
    return {
      payment: data.payment,
      yearlyRepayment: data.payment * PERIODS_PER_YEAR[frequency],
      loanAmount: loan,
      lvr: data.summary.lvr,
      totalInterest: data.total_interest,
      totalRepaid: loan + data.total_interest,
      payoffYears: Math.floor(months / 12),
      payoffMonths: months % 12,
      offset: baseline
        ? {
            interestSaved: Math.max(0, baseline.total_interest - data.total_interest),
            monthsSooner: Math.max(0, toMonths(periodsToPayoff(baseline)) - months),
            interestWithout: baseline.total_interest,
            monthsWithout: toMonths(periodsToPayoff(baseline)),
          }
        : null,
    };
  }, [data, baseline, frequency]);

  const chartData = useMemo(() => toChartData(data), [data]);
  const baselineChartData = useMemo(() => toChartData(baseline), [baseline]);

  const tableRows = useMemo(() => {
    if (!data) return [];
    const ppy = PERIODS_PER_YEAR[frequency];
    // Stop at the repayment that clears the loan; an offset can clear it early.
    const rows = data.rows.slice(0, periodsToPayoff(data));
    return rows.filter((_, i) => i % ppy === 0 || i === rows.length - 1);
  }, [data, frequency]);

  return {
    inputs: { purchasePrice, deposit, rate, years, appreciation, offsetBalance, offsetContribution, frequency },
    setters: {
      setPurchasePrice,
      setDeposit,
      setRate,
      setYears,
      setAppreciation,
      setOffsetBalance,
      setOffsetContribution,
      setFrequency: (next: Frequency) => {
        // Keep the offset contribution the same per year when the period changes.
        const ratio = PERIODS_PER_YEAR[next] / PERIODS_PER_YEAR[frequency];
        setOffsetContribution((prev) => Math.round(prev / ratio));
        setFrequencyRaw(next);
      },
    },
    data,
    summary,
    waiting: !source && !ready,
    loading: source || !ready ? false : api.loading || (hasOffset && baselineApi.loading),
    // The raw message ("API error: 500") means nothing to a user.
    error: source || !ready || !api.error ? null : "Couldn't work out your repayments. Check your connection.",
    retry,
    chartData,
    baselineChartData,
    tableRows,
  };
}
