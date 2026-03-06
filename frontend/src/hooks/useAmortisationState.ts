"use client";

import { useState, useEffect, useMemo } from "react";
import type { Frequency, ChartDataPoint } from "@/lib/types";
import type { ScheduleResponse, ScheduleRow } from "@/lib/api";
import { fetchSchedule } from "@/lib/api";
import { PERIODS_PER_YEAR } from "@/lib/constants";

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

export interface AmortisationState {
  inputs: AmortisationInputs;
  setters: AmortisationInputSetters;
  data: ScheduleResponse | null;
  error: string | null;
  chartData: ChartDataPoint[];
  tableRows: ScheduleRow[];
}

export function useAmortisationState(): AmortisationState {
  // ── Input state ────────────────────────────────
  const [purchasePrice, setPurchasePrice] = useState(600_000);
  const [deposit, setDeposit] = useState(100_000);
  const [rate, setRate] = useState(6.2);
  const [years, setYears] = useState(30);
  const [appreciation, setAppreciation] = useState(0);
  const [offsetBalance, setOffsetBalance] = useState(0);
  const [offsetContribution, setOffsetContribution] = useState(0);
  const [frequency, setFrequencyRaw] = useState<Frequency>("weekly");

  // ── API fetch ──────────────────────────────────
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setError(null);
      try {
        const result = await fetchSchedule(
          {
            purchase_price: purchasePrice,
            deposit,
            annual_rate: rate / 100,
            loan_term_years: years,
            frequency,
            annual_appreciation: appreciation / 100,
            offset_balance: offsetBalance,
            offset_contribution: offsetContribution,
          },
          controller.signal,
        );
        if (!controller.signal.aborted) setData(result);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to fetch schedule");
      }
    }, 80);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [purchasePrice, deposit, rate, years, frequency, appreciation, offsetBalance, offsetContribution]);

  // ── Derived data ───────────────────────────────
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
        const ratio = PERIODS_PER_YEAR[next] / PERIODS_PER_YEAR[frequency];
        setOffsetContribution((prev) => Math.round(prev / ratio));
        setFrequencyRaw(next);
      },
    },
    data,
    error,
    chartData,
    tableRows,
  };
}
