/**
 * API client for the MortgageModeler backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types (match backend response) ───────────

export type Frequency = "weekly" | "fortnightly" | "monthly";

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
  equity: number;
}

export interface ScheduleResponse {
  payment: number;
  total_interest: number;
  total_periods: number;
  rows: ScheduleRow[];
  chart_data: ChartPoint[];
}

// ── Request ──────────────────────────────────

export interface ScheduleRequest {
  principal: number;
  annual_rate: number;
  loan_term_years: number;
  frequency: Frequency;
  offset_balance?: number;
  extra_repayment?: number;
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
