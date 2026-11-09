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
}

/** The headline figures, worked out from the schedule. */
export interface AmortisationSummary {
  payment: number;
  loanAmount: number;
  /** As a decimal (0.83). */
  lvr: number;
  totalInterest: number;
  /** Principal plus interest. */
  totalRepaid: number;
  /** How long until the loan is paid off (shorter than the term with an offset). */
  payoffYears: number;
  payoffMonths: number;
}

export interface AmortisationState {
  inputs: AmortisationInputs;
  setters: AmortisationInputSetters;
  data: ScheduleResponse | null;
  summary: AmortisationSummary | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  chartData: ChartDataPoint[];
  tableRows: ScheduleRow[];
}

const DEFAULTS: AmortisationInputs = {
  purchasePrice: 600_000,
  deposit: 100_000,
  rate: 6.2,
  years: 30,
  appreciation: 0,
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
    { enabled: !source },
  );
  const data = source ? source.data : api.data;

  // ── Derived data ───────────────────────────────
  const summary: AmortisationSummary | null = useMemo(() => {
    if (!data) return null;
    const loan = data.summary.loan_amount;
    const months = Math.round((data.total_periods / PERIODS_PER_YEAR[frequency]) * 12);
    return {
      payment: data.payment,
      loanAmount: loan,
      lvr: data.summary.lvr,
      totalInterest: data.total_interest,
      totalRepaid: loan + data.total_interest,
      payoffYears: Math.floor(months / 12),
      payoffMonths: months % 12,
    };
  }, [data, frequency]);

  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!data) return [];
    const loan = data.summary.loan_amount;
    return data.chart_data.map((p) => ({
      y: p.year,
      bal: p.balance,
      int: p.total_interest,
      eq: p.equity,
      paid: p.total_interest + (loan - p.balance),
      lvr: p.property_value > 0 ? (p.balance / p.property_value) * 100 : 0,
      offset: p.offset_balance,
    }));
  }, [data]);

  const tableRows = useMemo(() => {
    if (!data) return [];
    const ppy = PERIODS_PER_YEAR[frequency];
    return data.rows.filter((_, i) => i % ppy === 0 || i === data.rows.length - 1);
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
    loading: source ? false : api.loading,
    // The raw message ("API error: 500") means nothing to a user.
    error: source || !api.error ? null : "Couldn't work out your repayments. Check your connection.",
    retry,
    chartData,
    tableRows,
  };
}
