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
  assessable_income: number;
  total_deductions: number;
  taxable_income: number;
  repayment_income: number;
  mls_income: number;
  net_investment_loss: number;
  income_tax: number;
  medicare_levy: number;
  medicare_levy_surcharge: number;
  hecs_repayment: number;
  total_tax: number;
  net_income: number;
  marginal_rate: number;
  effective_rate: number;
}

export interface TaxBreakdownRequest {
  income: {
    salary: number;
    rental?: number;
    interest?: number;
    dividend?: number;
    franking?: number;
    capital_gain_short?: number;
    capital_gain_long?: number;
  };
  deductions?: {
    rental_deductions?: number;
    work_deductions?: number;
  };
  adjustments?: {
    sal_sac?: number;
    rfb?: number;
    hecs_bal?: number;
    phi?: boolean;
    sapto?: boolean;
  };
}

export async function fetchTaxBreakdown(
  params: TaxBreakdownRequest,
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

// ── Grants eligibility ─────────────────────

export interface GrantSchemeMeta {
  deposit: string;
  lmi: string;
  buyer: string;
}

export interface GrantScheme {
  id: string;
  name: string;
  level: string;
  state: string | null;
  category: string;
  benefit_pill: string;
  meta: GrantSchemeMeta;
  theme: string;
  benefits: string[];
  eligibility: string[];
  summary: string;
  details: string | null;
  rules: string[] | null;
}

export interface GrantEligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export interface GrantSchemeWithEligibility {
  scheme: GrantScheme;
  result: GrantEligibilityResult;
}

export interface GrantsEligibilityRequest {
  states: string[];
  price: number;
  income: number;
  partner_income: number;
  property_type: string | null;
  buyer_type: string | null;
  first_home_buyer: boolean | null;
  owner_occupier: boolean | null;
  single_parent: boolean | null;
  owned_property_in_last_2_years: boolean | null;
  off_the_plan: boolean | null;
}

export async function fetchGrantSchemes(
  signal?: AbortSignal,
): Promise<{ schemes: GrantScheme[] }> {
  const res = await fetch(`${API_BASE}/api/grants/schemes`, { signal });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchGrantsEligibility(
  params: GrantsEligibilityRequest,
  signal?: AbortSignal,
): Promise<{ schemes: GrantSchemeWithEligibility[] }> {
  const res = await fetch(`${API_BASE}/api/grants/eligibility`, {
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
