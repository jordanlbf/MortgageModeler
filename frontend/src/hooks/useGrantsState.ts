"use client";

import { useCallback, useState } from "react";
import { fetchGrantsEligibility, type GrantSchemeWithEligibility } from "@/lib/api";
import { useApiCall } from "./useApiCall";

export const GRANT_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;
export type GrantState = (typeof GRANT_STATES)[number];

export type GrantPropertyType = "existing" | "new" | "land" | "off-the-plan";

export interface GrantsInputs {
  /** Null until picked: federal schemes only. */
  state: GrantState | null;
  price: number;
  income: number;
  partnerIncome: number;
  /** Null until picked: no scheme is ruled out by type. */
  propertyType: GrantPropertyType | null;
  ownerOcc: boolean;
  firstHome: boolean;
  couple: boolean;
  singleParent: boolean;
  /** ACT only: owned property anywhere in Australia in the last 2 years. */
  ownedRecently: boolean;
}

/** Sample data for the kitchen sink: inputs plus a fixed response, so no API call is made. */
export interface GrantsSource {
  inputs?: Partial<GrantsInputs>;
  schemes: GrantSchemeWithEligibility[];
}

/** What kind of help a scheme gives, for the headline counts. */
export type GrantKind = "grant" | "duty" | "deposit";

/** The API's categories, grouped: cash grants, stamp duty concessions, and deposit help (guarantees, shared equity, super). */
export function grantKind(category: string): GrantKind {
  if (category === "grant") return "grant";
  if (category === "concession") return "duty";
  return "deposit";
}

const DEFAULTS: GrantsInputs = {
  // Nothing picked: you fill it in.
  state: null,
  price: 0,
  income: 0,
  partnerIncome: 0,
  propertyType: null,
  ownerOcc: false,
  firstHome: false,
  couple: false,
  singleParent: false,
  ownedRecently: false,
};

/**
 * Government Grants state: inputs, the eligibility call and the schemes split
 * into those you qualify for and those you don't. Federal schemes are always
 * included, plus the chosen state's once one is picked.
 */
export function useGrantsState(source?: GrantsSource) {
  const start = { ...DEFAULTS, ...source?.inputs };
  const [inputs, setInputs] = useState<GrantsInputs>(start);
  const set = useCallback(<K extends keyof GrantsInputs>(key: K, value: GrantsInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Bumped by retry() to run the same request again.
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const i = inputs;
  const otp = i.propertyType === "off-the-plan";
  const api = useApiCall<GrantSchemeWithEligibility[]>(
    async (signal) => {
      const resp = await fetchGrantsEligibility({
        states: i.state ? ["Federal", i.state] : ["Federal"],
        price: i.price,
        income: i.income,
        partner_income: i.couple ? i.partnerIncome : 0,
        // Off the plan is a new home bought before it's built.
        property_type: otp ? "new" : i.propertyType,
        buyer_type: i.couple ? "couple" : "individual",
        first_home_buyer: i.firstHome,
        owner_occupier: i.ownerOcc,
        single_parent: i.couple ? false : i.singleParent,
        off_the_plan: otp,
        owned_property_in_last_2_years: i.state === "ACT" ? i.ownedRecently : null,
      }, signal);
      return resp.schemes;
    },
    [i.state, i.price, i.income, i.partnerIncome, i.propertyType, i.ownerOcc, i.firstHome, i.couple, i.singleParent, i.ownedRecently, attempt],
    { debounce: 300, enabled: !source },
  );

  // The purchase is described: where, what and for how much. Before that,
  // most schemes would "miss" only on blanks, so the misses aren't worth showing.
  const described = i.state !== null && i.propertyType !== null && i.price > 0;

  const schemes = source?.schemes ?? api.data;
  const eligible = schemes?.filter((s) => s.result.eligible) ?? [];
  const ineligible = schemes?.filter((s) => !s.result.eligible) ?? [];
  const counts = { grant: 0, duty: 0, deposit: 0 } satisfies Record<GrantKind, number>;
  for (const s of eligible) counts[grantKind(s.scheme.category)] += 1;

  return {
    inputs,
    set,
    schemes,
    eligible,
    ineligible,
    counts,
    described,
    loading: !source && api.loading,
    error: source ? null : api.error,
    retry,
  };
}

export type GrantsState = ReturnType<typeof useGrantsState>;
