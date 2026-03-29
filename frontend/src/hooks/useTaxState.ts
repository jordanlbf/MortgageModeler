"use client";

import { useState, useEffect, useMemo } from "react";
import type { TaxBreakdownResponse } from "@/lib/api";
import { fetchTaxBreakdown } from "@/lib/api";

export interface TaxInputs {
  gross: number;
  hecsOn: boolean;
  hecsBal: number;
  phi: boolean;
}

export interface TaxSetters {
  setGross: (v: number) => void;
  setHecsOn: (v: boolean) => void;
  setHecsBal: (v: number) => void;
  setPhi: (v: boolean) => void;
}

export interface TaxDerived {
  effRate: number;
  monthly: number;
  fortnightly: number;
  weekly: number;
}

export interface TaxState {
  inputs: TaxInputs;
  setters: TaxSetters;
  data: TaxBreakdownResponse | null;
  derived: TaxDerived;
  error: string | null;
}

export function useTaxState(): TaxState {
  // ── Input state ────────────────────────────────
  const [gross, setGross] = useState(100_000);
  const [hecsOn, setHecsOn] = useState(false);
  const [hecsBal, setHecsBal] = useState(35_000);
  const [phi, setPhi] = useState(false);

  // ── API fetch ──────────────────────────────────
  const [data, setData] = useState<TaxBreakdownResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setError(null);
      try {
        const result = await fetchTaxBreakdown(
          {
            taxable_income: gross,
            repayment_income: gross,
            mls_income: gross,
            hecs_balance: hecsOn ? hecsBal : 0,
            has_private_health: phi,
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
  }, [gross, hecsOn, hecsBal, phi]);

  // ── Derived data ───────────────────────────────
  const derived = useMemo<TaxDerived>(() => {
    if (!data || data.taxable_income === 0) {
      return { effRate: 0, monthly: 0, fortnightly: 0, weekly: 0 };
    }
    return {
      effRate: (data.total_tax / data.taxable_income) * 100,
      monthly: data.net_income / 12,
      fortnightly: data.net_income / 26,
      weekly: data.net_income / 52,
    };
  }, [data]);

  return {
    inputs: { gross, hecsOn, hecsBal, phi },
    setters: { setGross, setHecsOn, setHecsBal, setPhi },
    data,
    derived,
    error,
  };
}
