"use client";

import { useState, useEffect, useMemo } from "react";
import type { TaxBreakdownResponse } from "@/lib/api";
import { fetchTaxBreakdown } from "@/lib/api";

export interface AdvancedTaxInputs {
  salary: number;
  rental: number;
  interest: number;
  dividend: number;
  franking: number;
  capitalGainShort: number;
  capitalGainLong: number;
  rentalDeductions: number;
  workDeductions: number;
  salSac: number;
  rfb: number;
  hecsBal: number;
  phi: boolean;
}

export interface AdvancedTaxSetters {
  setSalary: (v: number) => void;
  setRental: (v: number) => void;
  setInterest: (v: number) => void;
  setDividend: (v: number) => void;
  setFranking: (v: number) => void;
  setCapitalGainShort: (v: number) => void;
  setCapitalGainLong: (v: number) => void;
  setRentalDeductions: (v: number) => void;
  setWorkDeductions: (v: number) => void;
  setSalSac: (v: number) => void;
  setRfb: (v: number) => void;
  setHecsBal: (v: number) => void;
  setPhi: (v: boolean) => void;
}

export interface IncomeMeasures {
  assessableIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  repaymentIncome: number;
  mlsIncome: number;
}

export interface AdvancedTaxState {
  inputs: AdvancedTaxInputs;
  setters: AdvancedTaxSetters;
  incomeMeasures: IncomeMeasures;
  data: TaxBreakdownResponse | null;
  error: string | null;
}

export function useAdvancedTaxState(): AdvancedTaxState {
  // ── Income ───────────────────────────────────
  const [salary, setSalary] = useState(100_000);
  const [rental, setRental] = useState(0);
  const [interest, setInterest] = useState(0);
  const [dividend, setDividend] = useState(0);
  const [franking, setFranking] = useState(0);
  const [capitalGainShort, setCapitalGainShort] = useState(0);
  const [capitalGainLong, setCapitalGainLong] = useState(0);

  // ── Deductions ───────────────────────────────
  const [rentalDeductions, setRentalDeductions] = useState(0);
  const [workDeductions, setWorkDeductions] = useState(0);

  // ── Adjustments ──────────────────────────────
  const [salSac, setSalSac] = useState(0);
  const [rfb, setRfb] = useState(0);
  const [hecsBal, setHecsBal] = useState(35_000);
  const [phi, setPhi] = useState(false);

  // ── API fetch ────────────────────────────────
  const [data, setData] = useState<TaxBreakdownResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setError(null);
      try {
        const result = await fetchTaxBreakdown(
          {
            income: {
              salary,
              rental,
              interest,
              dividend,
              franking,
              capital_gain_short: capitalGainShort,
              capital_gain_long: capitalGainLong,
            },
            deductions: {
              rental_deductions: rentalDeductions,
              work_deductions: workDeductions,
            },
            adjustments: {
              sal_sac: salSac,
              rfb,
              hecs_bal: hecsBal,
              phi,
            },
          },
          controller.signal,
        );
        if (!controller.signal.aborted) setData(result);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to fetch breakdown");
      }
    }, 80);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [salary, rental, interest, dividend, franking, capitalGainShort, capitalGainLong, rentalDeductions, workDeductions, salSac, rfb, hecsBal, phi]);

  // ── Derived income measures (client-side, for immediate UI feedback) ──
  const incomeMeasures = useMemo<IncomeMeasures>(() => {
    // TODO: remove once UI reads exclusively from data
    const netCapitalGain = capitalGainShort + capitalGainLong * 0.5;
    const assessable = salary + rental + interest + dividend + franking + netCapitalGain;
    const totalDeductions = rentalDeductions + workDeductions;
    const taxableIncome = Math.max(0, assessable - totalDeductions);
    const netInvestmentLoss = Math.max(0, rentalDeductions - rental);
    const repaymentIncome = taxableIncome + rfb + salSac + netInvestmentLoss;
    const mlsIncome = repaymentIncome;
    return { assessableIncome: assessable, totalDeductions, taxableIncome, repaymentIncome, mlsIncome };
  }, [salary, rental, interest, dividend, franking, capitalGainShort, capitalGainLong, rentalDeductions, workDeductions, rfb, salSac]);

  return {
    inputs: { salary, rental, interest, dividend, franking, capitalGainShort, capitalGainLong, rentalDeductions, workDeductions, salSac, rfb, hecsBal, phi },
    setters: { setSalary, setRental, setInterest, setDividend, setFranking, setCapitalGainShort, setCapitalGainLong, setRentalDeductions, setWorkDeductions, setSalSac, setRfb, setHecsBal, setPhi },
    incomeMeasures,
    data,
    error,
  };
}
