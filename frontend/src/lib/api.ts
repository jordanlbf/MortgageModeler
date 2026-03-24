/**
 * API client for the MortgageModeler backend.
 */

import type { Frequency } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Re-export so existing consumers don't break
export type { Frequency };

// ── Types (match backend response) ───────────

export interface ScheduleRow {
  period: number;
  opening_balance: number;
  interest: number;
  principal_paid: number;
  extra_paid: number;
  closing_balance: number;
  annual_rate: number;
  scheduled_repayment: number;
  offset_balance: number;
}

interface ChartPoint {
  year: number;
  balance: number;
  total_interest: number;
  property_value: number;
  equity: number;
  offset_balance: number;
}

export interface ScheduleSummary {
  purchase_price: number;
  deposit: number;
  loan_amount: number;
  lvr: number;
  annual_appreciation: number;
}

export interface ScheduleResponse {
  summary: ScheduleSummary;
  payment: number;
  total_interest: number;
  total_periods: number;
  rows: ScheduleRow[];
  chart_data: ChartPoint[];
}

// ── Request ──────────────────────────────────

export interface ScheduleRequest {
  purchase_price: number;
  deposit: number;
  annual_rate: number;
  loan_term_years: number;
  frequency: Frequency;
  offset_balance?: number;
  offset_contribution?: number;
  extra_repayment?: number;
  annual_appreciation?: number;
}

// ── Fetch ────────────────────────────────────

// ── Tax breakdown ───────────────────────────

export interface TaxBreakdownResponse {
  taxable_income: number;
  income_tax: number;
  medicare_levy: number;
  medicare_levy_surcharge: number;
  hecs_repayment: number;
  total_tax: number;
  net_income: number;
  marginal_rate: number;
}

export async function fetchTaxBreakdown(
  params: {
    taxable_income: number;
    repayment_income: number;
    mls_income: number;
    hecs_balance: number;
    has_private_health: boolean;
  },
  signal?: AbortSignal,
): Promise<TaxBreakdownResponse> {
  const res = await fetch(`${API_BASE}/api/tax/breakdown`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

// ── Amortisation schedule ───────────────────

export async function fetchSchedule(params: ScheduleRequest, signal?: AbortSignal): Promise<ScheduleResponse> {
  const res = await fetch(`${API_BASE}/api/amortisation/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
