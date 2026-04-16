"use client";

import { useReducer, useCallback, useMemo, useState } from "react";
import type { PropertyUse, PurchaseMode, ViewMode } from "@/lib/cashflow-types";

// ── State shape ─────────────────────────────────────────────────────────────

export interface CashflowFormValues {
  // Mode
  propertyUse: PropertyUse | null;
  purchaseMode: PurchaseMode | null;

  // Completion flags
  setupComplete: boolean;
  propertyComplete: boolean;
  loanComplete: boolean;
  costsComplete: boolean;
  rentalComplete: boolean;
  taxComplete: boolean;

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
  extraRepayments: string;

  // Costs
  councilRates: string;
  waterRates: string;
  insurance: string;
  maintenance: string;
  hasStrata: boolean;
  strataFees: string;

  // Rental
  weeklyRent: string;
  vacancyRate: string;
  usePropertyManager: boolean;
  managementFee: string;

  // Tax
  taxableIncome: string;
  depreciation: string;
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

const INITIAL: CashflowFormValues = {
  propertyUse: null,
  purchaseMode: null,
  setupComplete: false,
  propertyComplete: false,
  loanComplete: false,
  costsComplete: false,
  rentalComplete: false,
  taxComplete: false,
  purchasePrice: "",
  depositAmount: "",
  currentValue: "$850,000",
  originalPurchasePrice: "$650,000",
  purchaseYear: String(new Date().getFullYear() - 3),
  currentLoanBalance: "$480,000",
  interestRate: "6.5",
  loanTerm: "30",
  hasOffset: false,
  offsetBalance: "",
  extraRepayments: "",
  councilRates: "$1,800",
  waterRates: "$1,200",
  insurance: "$2,000",
  maintenance: "0.5",
  hasStrata: false,
  strataFees: "$800",
  weeklyRent: "$650",
  vacancyRate: "3.8",
  usePropertyManager: true,
  managementFee: "7.5",
  taxableIncome: "$120,000",
  depreciation: "8000",
  depreciationMode: "estimate",
  depBuildings: [],
  depAssets: [],
  capitalGrowth: "3.5",
  viewMode: "summary",
  selectedYear: 1,
  hoveredYear: null,
};

const RESET_MAP: Record<string, (keyof CashflowFormValues)[]> = {
  propertyUse: ["propertyUse", "purchaseMode", "setupComplete", "propertyComplete", "loanComplete", "costsComplete", "rentalComplete", "taxComplete"],
  purchaseMode: ["purchaseMode", "setupComplete", "propertyComplete", "loanComplete", "costsComplete", "rentalComplete", "taxComplete"],
  property: ["propertyComplete", "loanComplete", "costsComplete", "rentalComplete", "taxComplete"],
  loan: ["loanComplete", "costsComplete", "rentalComplete", "taxComplete"],
  costs: ["costsComplete", "rentalComplete", "taxComplete"],
  rental: ["rentalComplete", "taxComplete"],
  tax: ["taxComplete"],
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
        (next as Record<string, unknown>)[f] = INITIAL[f];
      }
      return next;
    }
    default:
      return state;
  }
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useCashflowFormState() {
  const [form, dispatch] = useReducer(reducer, INITIAL);

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
    setPurchaseMode: set("purchaseMode"),
    setSetupComplete: set("setupComplete"),
    setPropertyComplete: set("propertyComplete"),
    setLoanComplete: set("loanComplete"),
    setCostsComplete: set("costsComplete"),
    setRentalComplete: set("rentalComplete"),
    setTaxComplete: set("taxComplete"),
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
    setExtraRepayments: set("extraRepayments"),
    setCouncilRates: set("councilRates"),
    setWaterRates: set("waterRates"),
    setInsurance: set("insurance"),
    setMaintenance: set("maintenance"),
    setHasStrata: set("hasStrata"),
    setStrataFees: set("strataFees"),
    setWeeklyRent: set("weeklyRent"),
    setVacancyRate: set("vacancyRate"),
    setUsePropertyManager: set("usePropertyManager"),
    setManagementFee: set("managementFee"),
    setTaxableIncome: set("taxableIncome"),
    setDepreciation: set("depreciation"),
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
