"use client";

import { useState } from "react";
import { fetchPurchaseCosts } from "@/lib/api";
import type { PurchaseCostsResponse } from "@/lib/api";
import { formatDollars, parseCurrencyInput } from "@/lib/formatters";
import { PURCHASE_COST_COLORS } from "@/lib/theme";
import { useApiCall } from "@/hooks/useApiCall";

export const PC_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

export interface CostDetail {
  label: string;
  value: string;
}

export interface CostItem {
  key: "deposit" | "duty" | "lmi" | "fees" | "grants";
  name: string;
  amount: number;
  color?: string;
  /** Short data-bearing note (e.g. "−$8,750 concession"); empty when there's nothing to add. */
  subtitle: string;
  details?: CostDetail[];
  /** A saving (grants): shown as a negative, kept out of cost bars. */
  saving?: boolean;
}

/**
 * Purchase Costs state: inputs, the API call and everything derived from it.
 * Shared by every Purchase Costs layout/prototype so they stay in sync.
 */
export function usePurchaseCostsState() {
  const [state, setState] = useState<string>("QLD");
  // Starts empty so the results visibly build up as the user types.
  const [priceStr, setPriceStr] = useState("");
  const [depositAmountStr, setDepositAmountStr] = useState("");
  const [propertyType, setPropertyType] = useState<string>("existing");
  const [firstHome, setFirstHome] = useState(true);
  const [ownerOcc, setOwnerOcc] = useState(true);
  const [couple, setCouple] = useState(false);
  const [lmiExempt, setLmiExempt] = useState(false);

  const price = parseCurrencyInput(priceStr);
  const depositAmount = parseCurrencyInput(depositAmountStr);
  const depositPct = price > 0 ? depositAmount / price : 0;

  const { data, error, loading } = useApiCall<PurchaseCostsResponse>(
    (signal) => fetchPurchaseCosts({
      state,
      price,
      deposit_percent: Math.min(depositPct, 1),
      property_type: propertyType,
      buyer_type: couple ? "couple" : "individual",
      owner_occupier: ownerOcc,
      first_home_buyer: firstHome,
      selected_grants: [],
      income: 0,
      partner_income: 0,
    }, signal),
    [state, price, depositPct, propertyType, firstHome, ownerOcc, couple],
    { debounce: 300, enabled: price > 0 },
  );

  /** Accepts any typed text; keeps digits only and re-formats as dollars. */
  const setPriceInput = (text: string) => {
    const raw = text.replace(/[^0-9]/g, "");
    setPriceStr(raw ? formatDollars(Number(raw)) : "");
  };

  /** Deposit typed as a dollar amount; keeps digits only and re-formats as dollars. */
  const setDepositAmountInput = (text: string) => {
    const raw = text.replace(/[^0-9]/g, "");
    setDepositAmountStr(raw ? formatDollars(Number(raw)) : "");
  };

  // ── Derived ─────────────────────────────────
  const effectiveLmi = data ? (lmiExempt ? 0 : data.lmi_payable) : 0;
  const lmiSaving = data ? data.lmi_payable - effectiveLmi : 0;
  const grants = data?.total_grant_savings ?? 0;
  const deposit = data?.deposit_amount ?? price * Math.min(depositPct, 1);
  const costs = data ? data.stamp_duty_payable + effectiveLmi + data.total_fees - grants : 0;
  const total = data ? data.total_upfront_cost - lmiSaving : 0;

  const items: CostItem[] = data
    ? [
        {
          key: "duty",
          name: "Stamp duty",
          amount: data.stamp_duty_payable,
          color: PURCHASE_COST_COLORS.stampDuty,
          subtitle: data.stamp_duty_concession > 0 ? `−${formatDollars(data.stamp_duty_concession)} concession` : "",
          details: data.stamp_duty_concession > 0
            ? [
                { label: "Base duty", value: formatDollars(data.stamp_duty_base) },
                { label: "Concession", value: `−${formatDollars(data.stamp_duty_concession)}` },
              ]
            : undefined,
        },
        {
          key: "lmi",
          name: "Lenders mortgage insurance",
          amount: effectiveLmi,
          color: PURCHASE_COST_COLORS.lmi,
          subtitle: data.lmi_base === 0
            ? ""
            : lmiExempt || data.lmi_waived
              ? "Waived"
              : `${Math.round(data.lvr * 100)}% LVR`,
          details: data.lmi_base > 0 && (lmiExempt || data.lmi_waived)
            ? [
                { label: "Base LMI", value: formatDollars(data.lmi_base) },
                { label: lmiExempt ? "Professional exemption" : "Waived by grant", value: `−${formatDollars(data.lmi_base)}` },
              ]
            : undefined,
        },
        {
          key: "fees",
          name: "Fees",
          amount: data.total_fees,
          color: PURCHASE_COST_COLORS.fees,
          subtitle: "",
          details: [
            { label: "Legal / conveyancing", value: formatDollars(data.legal_fees) },
            { label: "Title registration", value: formatDollars(data.registration_fee) },
            { label: "Mortgage registration", value: formatDollars(data.mortgage_registration_fee) },
            { label: "Building & pest", value: formatDollars(data.building_pest_inspection) },
            { label: "Loan establishment", value: formatDollars(data.loan_establishment_fee) },
          ],
        },
        ...(grants > 0
          ? [{
              key: "grants" as const,
              name: "Grants",
              amount: grants,
              saving: true,
              subtitle: data.grants_applied.map((g) => g.scheme_name).join(", "),
              details: data.grants_applied.map((g) => ({
                label: g.scheme_name,
                value: g.amount > 0 ? `−${formatDollars(g.amount)}` : g.description,
              })),
            }]
          : []),
      ]
    : [];

  return {
    // raw API state
    data,
    error,
    loading,
    // inputs (display strings + parsed)
    inputs: {
      state, priceStr, depositAmountStr, propertyType, firstHome, ownerOcc, couple, lmiExempt,
      price, depositAmount, depositPct,
    },
    setters: {
      setState, setPropertyType, setFirstHome, setOwnerOcc, setCouple, setLmiExempt,
      setPriceInput, setDepositAmountInput,
    },
    // derived results (0 / [] until data arrives)
    derived: {
      deposit,
      costs,
      total,
      effectiveLmi,
      grants,
      loanAmount: data?.effective_loan_amount ?? 0,
      lvr: data?.lvr ?? 0,
      items,
    },
  };
}

export type PurchaseCostsState = ReturnType<typeof usePurchaseCostsState>;
