/**
 * API client for the MortgageModeler backend.
 */

import type { Frequency } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Re-export so existing consumers don't break
export type { Frequency };

// ── Shared fetch helpers ────────────────────

async function postJson<TReq, TRes>(path: string, body: TReq, signal?: AbortSignal): Promise<TRes> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function getJson<TRes>(path: string, signal?: AbortSignal): Promise<TRes> {
  const res = await fetch(`${API_BASE}${path}`, { signal });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

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

export function fetchTaxBreakdown(
  params: TaxBreakdownRequest,
  signal?: AbortSignal,
): Promise<TaxBreakdownResponse> {
  return postJson("/api/tax/breakdown", params, signal);
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

export function fetchGrantSchemes(
  signal?: AbortSignal,
): Promise<{ schemes: GrantScheme[] }> {
  return getJson("/api/grants/schemes", signal);
}

export function fetchGrantsEligibility(
  params: GrantsEligibilityRequest,
  signal?: AbortSignal,
): Promise<{ schemes: GrantSchemeWithEligibility[] }> {
  return postJson("/api/grants/eligibility", params, signal);
}

// ── Cashflow projection ─────────────────────

export interface CashflowTaxProfileRequest {
  taxable_income: number;
  repayment_income: number;
  mls_income: number;
  hecs_balance: number;
  has_private_health: boolean;
  income_growth_rate: number;
}

export interface CashflowPurchaseCostsRequest {
  stamp_duty?: number | null;
  legal_fees?: number | null;
  building_pest_inspection?: number | null;
  registration_fee?: number | null;
  other_costs: number;
}

export interface CashflowBorrowingCostsRequest {
  lmi?: number | null;
  mortgage_registration_fee?: number | null;
  loan_establishment_fee?: number | null;
  capitalise_lmi: boolean;
  capitalise_mortgage_registration_fee: boolean;
  capitalise_loan_establishment_fee: boolean;
}

export interface CashflowRentalConfigRequest {
  weekly_rent: number;
  annual_growth_rate: number;
  vacancy_weeks: number;
}

export interface CashflowPropertyRequest {
  purchase_price: number;
  purchase_date: string;
  is_new_property: boolean;
  is_ppor: boolean;
  annual_appreciation: number;
  purchase_costs: CashflowPurchaseCostsRequest;
  rental: CashflowRentalConfigRequest;
  depreciable_buildings: Array<{ name: string; construction_cost: number; purchase_date: string; construction_start_date: string }>;
  depreciable_assets: Array<{ name: string; cost: number; effective_life_years: number; purchase_date: string; method: string; written_down_value: number }>;
}

export interface CashflowLoanRequest {
  deposit: number;
  annual_rate: number;
  loan_term_years: number;
  frequency: "monthly";
  offset_balance: number;
  offset_contribution: number;
  extra_repayment: number;
  rate_changes: readonly never[];
  borrowing_costs: CashflowBorrowingCostsRequest;
}

export interface CashflowOngoingCostsRequest {
  council_rates: number;
  water_rates: number;
  building_insurance: number;
  strata_fees: number;
  maintenance_rate: number;
  landlord_insurance: number;
  management_rate: number;
  annual_cost_growth_rate: number;
}

export interface CashflowPPORRequest {
  tax_profile: CashflowTaxProfileRequest;
  property: CashflowPropertyRequest;
  loan: CashflowLoanRequest;
  ongoing_costs: CashflowOngoingCostsRequest;
  projection_years: number;
}

export interface CashflowRentvestRequest extends CashflowPPORRequest {
  weekly_rent_paid: number;
  annual_rent_paid_growth: number;
}

// Response types

export interface OngoingCostsDetail {
  council_rates: number;
  water_rates: number;
  building_insurance: number;
  landlord_insurance: number;
  strata_fees: number;
  maintenance_cost: number;
  management_fee: number;
}

export interface TaxDeductionDetail {
  mortgage_interest: number;
  depreciation_building: number;
  depreciation_plant: number;
  deductible_expenses: number;
  total_deductions: number;
  net_rental_income: number;
  is_negatively_geared: boolean;
  tax_saving: number;
  borrowing_costs_deduction: number;
}

export interface CashflowYearRow {
  year: number;
  net_income: number;
  total_inflows: number;
  mortgage_repayment: number;
  mortgage_interest: number;
  mortgage_principal: number;
  property_costs: number;
  offset_contributions: number;
  rent_paid: number;
  rental_income: number;
  tax_saving: number;
  total_outflows: number;
  net_position: number;
  cumulative_position: number;
  property_value: number;
  loan_balance: number;
  equity: number;
  offset_balance: number;
  salary: number;
  income_tax: number;
  ongoing_costs_detail: OngoingCostsDetail | null;
  tax_deduction_detail: TaxDeductionDetail | null;
}

export interface CashflowSummary {
  total_income: number;
  total_outflows: number;
  total_interest_paid: number;
  total_rent_paid: number;
  total_rental_income: number;
  total_tax_saving: number;
  final_property_value: number;
  final_loan_balance: number;
  final_equity: number;
  average_annual_net: number;
  net_wealth: number;
}

export interface CashflowCGT {
  cost_base: number;
  capital_gain: number;
  cgt_discount: number;
  discounted_gain: number;
  cgt_payable: number;
  net_proceeds: number;
}

export interface CashflowUpfrontCosts {
  purchase_costs: {
    stamp_duty: number;
    legal_fees: number;
    building_pest_inspection: number;
    registration_fee: number;
    other_costs: number;
    total: number;
  };
  borrowing_costs: {
    lmi: number;
    mortgage_registration_fee: number;
    loan_establishment_fee: number;
    total: number;
  };
  total: number;
}

export interface CashflowPPORResponse {
  scenario: "ppor";
  projection_years: number;
  upfront_costs: CashflowUpfrontCosts;
  years: CashflowYearRow[];
  summary: CashflowSummary;
}

export interface CashflowRentvestResponse {
  scenario: "rentvesting";
  projection_years: number;
  upfront_costs: CashflowUpfrontCosts;
  years: CashflowYearRow[];
  cgt: CashflowCGT;
  summary: CashflowSummary;
}

export type CashflowResponse = CashflowPPORResponse | CashflowRentvestResponse;

export function fetchCashflowPPOR(
  params: CashflowPPORRequest,
  signal?: AbortSignal,
): Promise<CashflowPPORResponse> {
  return postJson("/api/cashflow/ppor", params, signal);
}

export function fetchCashflowRentvest(
  params: CashflowRentvestRequest,
  signal?: AbortSignal,
): Promise<CashflowRentvestResponse> {
  return postJson("/api/cashflow/rentvest", params, signal);
}

// ── Single property cashflow ────────────────

export interface CashflowSingleExistingPropertyRequest {
  purchase_date: string;
  purchase_price: number;
  purchase_costs?: CashflowPurchaseCostsRequest;
  is_new_property: boolean;
  current_value: number;
  annual_appreciation: number;
  depreciable_buildings: Array<{ name: string; construction_cost: number; purchase_date: string; construction_start_date: string }>;
  depreciable_assets: Array<{ name: string; cost: number; effective_life_years: number; purchase_date: string; method: string; written_down_value: number }>;
  original_borrowing_costs_total?: number;
  borrowing_costs_years_elapsed?: number;
}

export interface CashflowSingleExistingLoanRequest {
  current_balance: number;
  remaining_term_years: number;
  annual_rate: number;
  frequency?: string;
  offset_balance?: number;
  offset_contribution?: number;
  extra_repayment?: number;
  rate_changes?: readonly never[];
}

export interface CashflowSingleRequest {
  mode: "new" | "existing";
  property_use: "ppor" | "investment";
  projection_years?: number;
  tax_profile: CashflowTaxProfileRequest;
  ongoing_costs: CashflowOngoingCostsRequest;
  rental?: CashflowRentalConfigRequest | null;
  property?: CashflowPropertyRequest | null;
  loan?: CashflowLoanRequest | null;
  existing_property?: CashflowSingleExistingPropertyRequest | null;
  existing_loan?: CashflowSingleExistingLoanRequest | null;
}

export interface CashflowSingleResponse {
  mode: string;
  property_use: string;
  projection_years: number;
  upfront_costs: CashflowUpfrontCosts | null;
  years: CashflowYearRow[];
  cgt: CashflowCGT | null;
  summary: CashflowSummary;
}

export function fetchCashflowSingle(
  params: CashflowSingleRequest,
  signal?: AbortSignal,
): Promise<CashflowSingleResponse> {
  return postJson("/api/cashflow/single", params, signal);
}

// ── Purchase costs ─────────────────────────

export interface PurchaseCostsRequest {
  state: string;
  price: number;
  deposit_percent: number;
  property_type: string;
  buyer_type: string;
  owner_occupier: boolean;
  first_home_buyer: boolean;
  selected_grants: string[];
}

export interface PurchaseCostsGrantApplied {
  scheme_id: string;
  scheme_name: string;
  category: string;
  effect_type: string;
  amount: number;
  description: string;
}

export interface PurchaseCostsResponse {
  stamp_duty_base: number;
  stamp_duty_concession: number;
  stamp_duty_payable: number;
  lmi_base: number;
  lmi_waived: boolean;
  lmi_payable: number;
  legal_fees: number;
  registration_fee: number;
  mortgage_registration_fee: number;
  building_pest_inspection: number;
  loan_establishment_fee: number;
  total_fees: number;
  grants_applied: PurchaseCostsGrantApplied[];
  total_grant_savings: number;
  equity_contribution: number;
  effective_loan_amount: number;
  deposit_amount: number;
  min_deposit_percent: number;
  total_upfront_cost: number;
  lvr: number;
}

export function fetchPurchaseCosts(
  params: PurchaseCostsRequest,
  signal?: AbortSignal,
): Promise<PurchaseCostsResponse> {
  return postJson("/api/purchase-costs/calculate", params, signal);
}

// ── Amortisation schedule ───────────────────

export function fetchSchedule(params: ScheduleRequest, signal?: AbortSignal): Promise<ScheduleResponse> {
  return postJson("/api/amortisation/schedule", params, signal);
}
