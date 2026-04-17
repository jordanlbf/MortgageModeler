/**
 * API client for the MortgageModeler backend.
 *
 * Request/response types are aliased from `api-types.ts`, which is auto-generated
 * from the backend's OpenAPI spec via `npm run generate-api`. Do not hand-edit
 * those types — regenerate them when the backend schema changes.
 */

import type { Frequency } from "@/lib/types";
import type { components } from "@/lib/api-types";

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

type Schemas = components["schemas"];

// ── Amortisation schedule ───────────────────

export type ScheduleRequest = Schemas["ScheduleRequest"];
export type ScheduleResponse = Schemas["ScheduleResponse"];
export type ScheduleRow = Schemas["ScheduleRowResponse"];
export type ScheduleSummary = Schemas["ScheduleSummary"];

export function fetchSchedule(params: ScheduleRequest, signal?: AbortSignal): Promise<ScheduleResponse> {
  return postJson("/api/amortisation/schedule", params, signal);
}

// ── Tax breakdown ───────────────────────────

export type TaxBreakdownRequest = Schemas["TaxBreakdownRequest"];
export type TaxBreakdownResponse = Schemas["TaxBreakdownResponse"];

export function fetchTaxBreakdown(
  params: TaxBreakdownRequest,
  signal?: AbortSignal,
): Promise<TaxBreakdownResponse> {
  return postJson("/api/tax/breakdown", params, signal);
}

// ── Grants eligibility ─────────────────────

export type GrantSchemeMeta = Schemas["SchemeMetaResponse"];
export type GrantScheme = Schemas["SchemeResponse"];
export type GrantEligibilityResult = Schemas["EligibilityResult"];
export type GrantSchemeWithEligibility = Schemas["SchemeWithEligibility"];
export type GrantsEligibilityRequest = Schemas["GrantsEligibilityRequest"];

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

export type CashflowTaxProfileRequest = Schemas["TaxProfileRequest"];
export type CashflowPurchaseCostsRequest = Schemas["app__schemas__cashflow__PurchaseCostsRequest"];
export type CashflowBorrowingCostsRequest = Schemas["BorrowingCostsRequest"];
export type CashflowRentalConfigRequest = Schemas["RentalConfigRequest"];
export type CashflowPropertyRequest = Schemas["PropertyRequest"];
export type CashflowLoanRequest = Schemas["LoanRequest"];
export type CashflowOngoingCostsRequest = Schemas["OngoingCostsRequest"];
export type CashflowPPORRequest = Schemas["CashFlowPPORRequest"];
export type CashflowRentvestRequest = Schemas["CashFlowRentvestRequest"];

export type CashflowYearRow = Schemas["CashFlowYearResponse"];
export type CashflowSummary = Schemas["CashFlowSummaryResponse"];
export type CashflowCGT = Schemas["CGTResponse"];
export type CashflowUpfrontCosts = Schemas["UpfrontCostsResponse"];
export type CashflowPPORResponse = Schemas["CashFlowPPORResponse"];
export type CashflowRentvestResponse = Schemas["CashFlowRentvestResponse"];
export type CashflowResponse = CashflowPPORResponse | CashflowRentvestResponse;

export type OngoingCostsDetail = Schemas["OngoingCostsDetailResponse"];
export type TaxDeductionDetail = Schemas["TaxDeductionDetailResponse"];

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

export type CashflowSingleExistingPropertyRequest = Schemas["ExistingPropertyRequest"];
export type CashflowSingleExistingLoanRequest = Schemas["ExistingLoanRequest"];
export type CashflowSingleRequest = Schemas["CashFlowSingleRequest"];
export type CashflowSingleResponse = Schemas["CashFlowSingleResponse"];

export function fetchCashflowSingle(
  params: CashflowSingleRequest,
  signal?: AbortSignal,
): Promise<CashflowSingleResponse> {
  return postJson("/api/cashflow/single", params, signal);
}

// ── Purchase costs ─────────────────────────

export type PurchaseCostsRequest = Schemas["app__schemas__purchase_costs__PurchaseCostsRequest"];
export type PurchaseCostsGrantApplied = Schemas["GrantAppliedResponse"];
export type PurchaseCostsResponse = Schemas["app__schemas__purchase_costs__PurchaseCostsResponse"];

export function fetchPurchaseCosts(
  params: PurchaseCostsRequest,
  signal?: AbortSignal,
): Promise<PurchaseCostsResponse> {
  return postJson("/api/purchase-costs/calculate", params, signal);
}
