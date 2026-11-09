"use client";

import { useCallback, useReducer, useState } from "react";
import type { TaxBreakdownRequest, TaxBreakdownResponse } from "@/lib/api";
import { fetchTaxBreakdown } from "@/lib/api";
import { useApiCall } from "./useApiCall";

export interface TaxInputs {
  salary: number;
  rental: number;
  rentalDeductions: number;
  interest: number;
  dividend: number;
  franking: number;
  capitalGainShort: number;
  capitalGainLong: number;
  workDeductions: number;
  hecsBal: number;
  salSac: number;
  rfb: number;
  phi: boolean;
  sapto: boolean;
}

export type TaxMoneyField = { [K in keyof TaxInputs]: TaxInputs[K] extends number ? K : never }[keyof TaxInputs];

/** Everything starts blank: the page waits for a salary (or any income). */
export const EMPTY_TAX_INPUTS: TaxInputs = {
  salary: 0,
  rental: 0,
  rentalDeductions: 0,
  interest: 0,
  dividend: 0,
  franking: 0,
  capitalGainShort: 0,
  capitalGainLong: 0,
  workDeductions: 0,
  hecsBal: 0,
  salSac: 0,
  rfb: 0,
  phi: false,
  sapto: false,
};

export interface TaxResults {
  breakdown: TaxBreakdownResponse;
  /** Of an extra $1,000 salary, what's left after income tax, Medicare and HELP. */
  keepPer1000: number;
  /** Tax saved by an extra $1,000 deduction. */
  claimSaves: number;
  /** Rent minus property expenses, and how much it changes your total tax. Null with no property figures. */
  property: { net: number; taxChange: number } | null;
}

/** Sample data for the kitchen sink: inputs plus precomputed results, so no API call is made. */
export interface TaxSource {
  inputs: Partial<TaxInputs>;
  results: TaxResults;
}

export function toTaxRequest(i: TaxInputs): TaxBreakdownRequest {
  return {
    income: {
      salary: i.salary,
      rental: i.rental,
      interest: i.interest,
      dividend: i.dividend,
      franking: i.franking,
      capital_gain_short: i.capitalGainShort,
      capital_gain_long: i.capitalGainLong,
    },
    deductions: { rental_deductions: i.rentalDeductions, work_deductions: i.workDeductions },
    adjustments: { sal_sac: i.salSac, rfb: i.rfb, hecs_bal: i.hecsBal, phi: i.phi, sapto: i.sapto },
  };
}

export function hasIncome(i: TaxInputs): boolean {
  return i.salary + i.rental + i.interest + i.dividend + i.franking + i.capitalGainShort + i.capitalGainLong > 0;
}

/**
 * The figures behind the "what if" tiles come from the same endpoint: the
 * real inputs, then with $1,000 more salary, $1,000 more deductions, and
 * without the property. All four run together.
 */
async function fetchTaxResults(i: TaxInputs, signal: AbortSignal): Promise<TaxResults> {
  const hasProperty = i.rental > 0 || i.rentalDeductions > 0;
  const [base, earn, claim, noProperty] = await Promise.all([
    fetchTaxBreakdown(toTaxRequest(i), signal),
    fetchTaxBreakdown(toTaxRequest({ ...i, salary: i.salary + 1000 }), signal),
    fetchTaxBreakdown(toTaxRequest({ ...i, workDeductions: i.workDeductions + 1000 }), signal),
    hasProperty ? fetchTaxBreakdown(toTaxRequest({ ...i, rental: 0, rentalDeductions: 0 }), signal) : null,
  ]);
  return {
    breakdown: base,
    keepPer1000: 1000 - (earn.total_tax - base.total_tax),
    claimSaves: base.total_tax - claim.total_tax,
    property: noProperty ? { net: i.rental - i.rentalDeductions, taxChange: base.total_tax - noProperty.total_tax } : null,
  };
}

type Action = { [K in keyof TaxInputs]: { field: K; value: TaxInputs[K] } }[keyof TaxInputs];

function reducer(state: TaxInputs, a: Action): TaxInputs {
  return state[a.field] === a.value ? state : { ...state, [a.field]: a.value };
}

export function useTaxState(source?: TaxSource) {
  const [inputs, dispatch] = useReducer(reducer, { ...EMPTY_TAX_INPUTS, ...source?.inputs });
  const set = useCallback(<K extends keyof TaxInputs>(field: K, value: TaxInputs[K]) => {
    dispatch({ field, value } as Action);
  }, []);

  // Bumped by retry() to run the same request again.
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const ready = hasIncome(inputs);
  const api = useApiCall<TaxResults>(
    (signal) => fetchTaxResults(inputs, signal),
    [inputs, attempt],
    { debounce: 150, enabled: ready && !source },
  );

  return {
    inputs,
    set,
    /** Null until there's income to work with (and while the first answer loads). */
    results: source ? source.results : ready ? api.data : null,
    loading: source ? false : api.loading,
    // The raw message ("API error: 500") means nothing to a user.
    error: source || !api.error ? null : "Couldn't calculate your tax. Check your connection.",
    retry,
  };
}

export type TaxState = ReturnType<typeof useTaxState>;
