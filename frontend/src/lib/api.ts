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
}

export interface ChartPoint {
  year: number;
  balance: number;
  total_interest: number;
  property_value: number;
  equity: number;
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
  extra_repayment?: number;
  annual_appreciation?: number;
}

// ── Fetch ────────────────────────────────────

export async function fetchSchedule(params: ScheduleRequest): Promise<ScheduleResponse> {
  const res = await fetch(`${API_BASE}/api/amortisation/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
