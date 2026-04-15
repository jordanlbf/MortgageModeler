"use client";

import { useReducer, useEffect, useMemo, useCallback, useState } from "react";
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
  sapto: boolean;
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
  setSapto: (v: boolean) => void;
}

export interface AdvancedTaxState {
  inputs: AdvancedTaxInputs;
  setters: AdvancedTaxSetters;
  data: TaxBreakdownResponse | null;
  error: string | null;
}

// ── Reducer ────────────────────────────────────

type Action =
  | { type: "SET_NUMBER"; field: keyof AdvancedTaxInputs; value: number }
  | { type: "SET_BOOLEAN"; field: keyof AdvancedTaxInputs; value: boolean };

const INITIAL_INPUTS: AdvancedTaxInputs = {
  salary: 100_000,
  rental: 0,
  interest: 0,
  dividend: 0,
  franking: 0,
  capitalGainShort: 0,
  capitalGainLong: 0,
  rentalDeductions: 0,
  workDeductions: 0,
  salSac: 0,
  rfb: 0,
  hecsBal: 35_000,
  phi: false,
  sapto: false,
};

function reducer(state: AdvancedTaxInputs, action: Action): AdvancedTaxInputs {
  if (state[action.field] === action.value) return state;
  return { ...state, [action.field]: action.value };
}

// ── Hook ───────────────────────────────────────

export function useAdvancedTaxState(): AdvancedTaxState {
  const [inputs, dispatch] = useReducer(reducer, INITIAL_INPUTS);

  const numSetter = useCallback(
    (field: keyof AdvancedTaxInputs) => (v: number) => dispatch({ type: "SET_NUMBER", field, value: v }),
    [],
  );
  const boolSetter = useCallback(
    (field: keyof AdvancedTaxInputs) => (v: boolean) => dispatch({ type: "SET_BOOLEAN", field, value: v }),
    [],
  );

  const setters: AdvancedTaxSetters = useMemo(() => ({
    setSalary: numSetter("salary"),
    setRental: numSetter("rental"),
    setInterest: numSetter("interest"),
    setDividend: numSetter("dividend"),
    setFranking: numSetter("franking"),
    setCapitalGainShort: numSetter("capitalGainShort"),
    setCapitalGainLong: numSetter("capitalGainLong"),
    setRentalDeductions: numSetter("rentalDeductions"),
    setWorkDeductions: numSetter("workDeductions"),
    setSalSac: numSetter("salSac"),
    setRfb: numSetter("rfb"),
    setHecsBal: numSetter("hecsBal"),
    setPhi: boolSetter("phi"),
    setSapto: boolSetter("sapto"),
  }), [numSetter, boolSetter]);

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
              salary: inputs.salary,
              rental: inputs.rental,
              interest: inputs.interest,
              dividend: inputs.dividend,
              franking: inputs.franking,
              capital_gain_short: inputs.capitalGainShort,
              capital_gain_long: inputs.capitalGainLong,
            },
            deductions: {
              rental_deductions: inputs.rentalDeductions,
              work_deductions: inputs.workDeductions,
            },
            adjustments: {
              sal_sac: inputs.salSac,
              rfb: inputs.rfb,
              hecs_bal: inputs.hecsBal,
              phi: inputs.phi,
              sapto: inputs.sapto,
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
  }, [inputs]);

  return { inputs, setters, data, error };
}
