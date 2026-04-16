"use client";

import { useReducer, useMemo, useCallback } from "react";
import type { TaxBreakdownResponse } from "@/lib/api";
import { fetchTaxBreakdown } from "@/lib/api";
import { useApiCall } from "./useApiCall";

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

type Action = { type: "SET"; field: keyof AdvancedTaxInputs; value: AdvancedTaxInputs[keyof AdvancedTaxInputs] };

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

  const set = useCallback(
    <K extends keyof AdvancedTaxInputs>(field: K) =>
      (value: AdvancedTaxInputs[K]) => dispatch({ type: "SET", field, value }),
    [],
  );

  const setters: AdvancedTaxSetters = useMemo(() => ({
    setSalary: set("salary"),
    setRental: set("rental"),
    setInterest: set("interest"),
    setDividend: set("dividend"),
    setFranking: set("franking"),
    setCapitalGainShort: set("capitalGainShort"),
    setCapitalGainLong: set("capitalGainLong"),
    setRentalDeductions: set("rentalDeductions"),
    setWorkDeductions: set("workDeductions"),
    setSalSac: set("salSac"),
    setRfb: set("rfb"),
    setHecsBal: set("hecsBal"),
    setPhi: set("phi"),
    setSapto: set("sapto"),
  }), [set]);

  // ── API fetch ────────────────────────────────
  const { data, error } = useApiCall<TaxBreakdownResponse>(
    (signal) => fetchTaxBreakdown({
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
    }, signal),
    [inputs],
  );

  return { inputs, setters, data, error };
}
