"use client";

import { useReducer, useCallback, useMemo, useState } from "react";
import type { PropertyType, PropertyUse, PurchaseMode, ViewMode } from "@/lib/cashflow-types";

// ── State shape ─────────────────────────────────────────────────────────────

export interface CashflowFormValues {
  // Mode
  propertyUse: PropertyUse | null;
  propertyType: PropertyType | null;
  purchaseMode: PurchaseMode | null;
  /** New purchases of a building only: new build (true) or established (false). */
  newBuild: boolean | null;

  // Completion flags
  setupComplete: boolean;
  loanComplete: boolean;
  costsComplete: boolean;
  rentalComplete: boolean;
  incomeComplete: boolean;
  depreciationComplete: boolean;

  // Property
  purchasePrice: string;
  depositAmount: string;
  currentValue: string;
  originalPurchasePrice: string;
  purchaseYear: string;
  currentLoanBalance: string;

  // Loan
  interestRate: string;
  loanTerm: string;
  hasOffset: boolean;
  offsetBalance: string;
  offsetMonthlyContribution: string;
  extraRepayments: string;

  // Costs
  councilRates: string;
  waterRates: string;
  insurance: string;
  landlordInsurance: string;
  maintenance: string;
  annualCostGrowthRate: string;
  strataFees: string;

  // Rental
  weeklyRent: string;
  vacancyRate: string;
  usePropertyManager: boolean;
  managementFee: string;

  // Tax
  taxableIncome: string;
  wageGrowth: string;
  depreciationMode: "estimate" | "detailed";
  depBuildings: Array<{ name: string; construction_cost: number; purchase_date: string; construction_start_date: string }>;
  depAssets: Array<{ name: string; cost: number; effective_life_years: number; purchase_date: string; method: "diminishing_value" | "prime_cost"; written_down_value: number }>;
  capitalGrowth: string;

  // View
  viewMode: ViewMode;
  selectedYear: number;
  hoveredYear: number | null;
}

// ── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET"; field: keyof CashflowFormValues; value: CashflowFormValues[keyof CashflowFormValues] }
  | { type: "RESET_SECTION"; section: string };

/** A fresh form. Several later-step fields start pre-filled (rate, term, costs, rent, income). */
export const CASHFLOW_FORM_DEFAULTS: CashflowFormValues = {
  propertyUse: null,
  propertyType: null,
  purchaseMode: null,
  newBuild: null,
  setupComplete: false,
  loanComplete: false,
  costsComplete: false,
  rentalComplete: false,
  incomeComplete: false,
  depreciationComplete: false,
  purchasePrice: "",
  depositAmount: "",
  // Blank like the new-purchase amounts: the fields show placeholders only.
  currentValue: "",
  originalPurchasePrice: "",
  purchaseYear: "",
  currentLoanBalance: "",
  // Blank: the user enters their own rate and term (placeholders show 6.5 / 30).
  interestRate: "",
  loanTerm: "",
  hasOffset: false,
  offsetBalance: "",
  offsetMonthlyContribution: "",
  extraRepayments: "",
  // Running costs start blank; the Costs step shows typical figures as placeholders.
  councilRates: "",
  waterRates: "",
  insurance: "",
  landlordInsurance: "",
  maintenance: "",
  annualCostGrowthRate: "2.5",
  // Blank: most houses have no strata; it only counts once entered.
  strataFees: "",
  weeklyRent: "$650",
  vacancyRate: "3.8",
  usePropertyManager: true,
  managementFee: "7.5",
  taxableIncome: "$120,000",
  wageGrowth: "3",
  depreciationMode: "estimate",
  depBuildings: [],
  depAssets: [],
  capitalGrowth: "3.5",
  viewMode: "summary",
  selectedYear: 1,
  hoveredYear: null,
};

const RESET_MAP: Record<string, (keyof CashflowFormValues)[]> = {
  propertyUse: ["propertyUse", "propertyType", "purchaseMode", "newBuild", "setupComplete", "loanComplete", "costsComplete", "rentalComplete", "incomeComplete", "depreciationComplete"],
  purchaseMode: ["purchaseMode", "newBuild", "setupComplete", "loanComplete", "costsComplete", "rentalComplete", "incomeComplete", "depreciationComplete"],
  setup: ["setupComplete", "loanComplete", "costsComplete", "rentalComplete", "incomeComplete", "depreciationComplete"],
  loan: ["loanComplete", "costsComplete", "rentalComplete", "incomeComplete", "depreciationComplete"],
  costs: ["costsComplete", "rentalComplete", "incomeComplete", "depreciationComplete"],
  rental: ["rentalComplete", "incomeComplete", "depreciationComplete"],
  income: ["incomeComplete", "depreciationComplete"],
  depreciation: ["depreciationComplete"],
};

function reducer(state: CashflowFormValues, action: Action): CashflowFormValues {
  switch (action.type) {
    case "SET":
      if (state[action.field] === action.value) return state;
      return { ...state, [action.field]: action.value };
    case "RESET_SECTION": {
      const fields = RESET_MAP[action.section];
      if (!fields) return state;
      const next = { ...state };
      for (const f of fields) {
        (next as Record<string, unknown>)[f] = CASHFLOW_FORM_DEFAULTS[f];
      }
      return next;
    }
    default:
      return state;
  }
}

// ── Hook ────────────────────────────────────────────────────────────────────

/** `initial` overrides the defaults (e.g. sample values in the kitchen sink). */
export function useCashflowFormState(initial?: Partial<CashflowFormValues>) {
  const [form, dispatch] = useReducer(reducer, initial, (i) => ({ ...CASHFLOW_FORM_DEFAULTS, ...i }));

  // Collapsible sections (separate state — Set is not serialisable in the reducer)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["propertyUse"]));

  const set = useCallback(
    <K extends keyof CashflowFormValues>(field: K) =>
      (value: CashflowFormValues[K]) => dispatch({ type: "SET", field, value }),
    [],
  );

  const resetSection = useCallback((section: string) => {
    dispatch({ type: "RESET_SECTION", section });
    setExpandedSections(prev => new Set([...prev, section]));
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const setters = useMemo(() => ({
    setPropertyUse: set("propertyUse"),
    setPropertyType: set("propertyType"),
    setPurchaseMode: set("purchaseMode"),
    setNewBuild: set("newBuild"),
    setSetupComplete: set("setupComplete"),
    setLoanComplete: set("loanComplete"),
    setCostsComplete: set("costsComplete"),
    setRentalComplete: set("rentalComplete"),
    setIncomeComplete: set("incomeComplete"),
    setDepreciationComplete: set("depreciationComplete"),
    setPurchasePrice: set("purchasePrice"),
    setDepositAmount: set("depositAmount"),
    setCurrentValue: set("currentValue"),
    setOriginalPurchasePrice: set("originalPurchasePrice"),
    setPurchaseYear: set("purchaseYear"),
    setCurrentLoanBalance: set("currentLoanBalance"),
    setInterestRate: set("interestRate"),
    setLoanTerm: set("loanTerm"),
    setHasOffset: set("hasOffset"),
    setOffsetBalance: set("offsetBalance"),
    setOffsetMonthlyContribution: set("offsetMonthlyContribution"),
    setExtraRepayments: set("extraRepayments"),
    setCouncilRates: set("councilRates"),
    setWaterRates: set("waterRates"),
    setInsurance: set("insurance"),
    setLandlordInsurance: set("landlordInsurance"),
    setMaintenance: set("maintenance"),
    setAnnualCostGrowthRate: set("annualCostGrowthRate"),
    setStrataFees: set("strataFees"),
    setWeeklyRent: set("weeklyRent"),
    setVacancyRate: set("vacancyRate"),
    setUsePropertyManager: set("usePropertyManager"),
    setManagementFee: set("managementFee"),
    setTaxableIncome: set("taxableIncome"),
    setWageGrowth: set("wageGrowth"),
    setDepreciationMode: set("depreciationMode"),
    setDepBuildings: set("depBuildings"),
    setDepAssets: set("depAssets"),
    setCapitalGrowth: set("capitalGrowth"),
    setViewMode: set("viewMode"),
    setSelectedYear: set("selectedYear"),
    setHoveredYear: set("hoveredYear"),
  }), [set]);

  return { form, setters, expandedSections, setExpandedSections, toggleSection, resetSection };
}
