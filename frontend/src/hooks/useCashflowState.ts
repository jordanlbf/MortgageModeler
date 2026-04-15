"use client";

import { useMemo } from "react";
import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { parseCurrencyCf, getMarginalTaxRate } from "@/lib/cashflow-calculations";
import { useCashflowFormState } from "./useCashflowFormState";
import { useCashflowAPI } from "./useCashflowAPI";

// ── Public interface (unchanged) ────────────────────────────────────────────

export interface CashflowState {
  // Mode
  propertyUse: import("@/lib/cashflow-types").PropertyUse | null;
  purchaseMode: import("@/lib/cashflow-types").PurchaseMode | null;
  isInvestment: boolean;
  isNewPurchase: boolean;

  // Completion
  setupComplete: boolean;
  propertyComplete: boolean;
  loanComplete: boolean;
  costsComplete: boolean;
  rentalComplete: boolean;
  taxComplete: boolean;
  allComplete: boolean;

  // Derived
  loanAmount: number;
  propertyValue: number;
  effectiveViewMode: ViewMode;
  marginalRate: number;

  // Form values – Property
  purchasePrice: string;
  depositAmount: string;
  currentValue: string;
  originalPurchasePrice: string;
  purchaseYear: string;
  currentLoanBalance: string;

  // Form values – Loan
  interestRate: string;
  loanTerm: string;
  hasOffset: boolean;
  offsetBalance: string;
  extraRepayments: string;

  // Form values – Costs
  councilRates: string;
  waterRates: string;
  insurance: string;
  maintenance: string;
  hasStrata: boolean;
  strataFees: string;

  // Form values – Rental
  weeklyRent: string;
  vacancyRate: string;
  usePropertyManager: boolean;
  managementFee: string;

  // Form values – Tax
  taxableIncome: string;
  depreciation: string;
  depreciationMode: "estimate" | "detailed";
  depBuildings: Array<{ name: string; construction_cost: number; purchase_date: string; construction_start_date: string }>;
  depAssets: Array<{ name: string; cost: number; effective_life_years: number; purchase_date: string; method: "diminishing_value" | "prime_cost"; written_down_value: number }>;
  capitalGrowth: string;

  // View state
  viewMode: ViewMode;
  selectedYear: number;
  hoveredYear: number | null;
  expandedSections: Set<string>;

  // Computed data
  yearData: YearData[];
  chartData: { year: number; value: number }[];
  selectedYearData: YearData | null;

  // Setters
  setPropertyUse: (v: import("@/lib/cashflow-types").PropertyUse | null) => void;
  setPurchaseMode: (v: import("@/lib/cashflow-types").PurchaseMode | null) => void;
  setSetupComplete: (v: boolean) => void;
  setPropertyComplete: (v: boolean) => void;
  setLoanComplete: (v: boolean) => void;
  setCostsComplete: (v: boolean) => void;
  setRentalComplete: (v: boolean) => void;
  setTaxComplete: (v: boolean) => void;
  setPurchasePrice: (v: string) => void;
  setDepositAmount: (v: string) => void;
  setCurrentValue: (v: string) => void;
  setOriginalPurchasePrice: (v: string) => void;
  setPurchaseYear: (v: string) => void;
  setCurrentLoanBalance: (v: string) => void;
  setInterestRate: (v: string) => void;
  setLoanTerm: (v: string) => void;
  setHasOffset: (v: boolean) => void;
  setOffsetBalance: (v: string) => void;
  setExtraRepayments: (v: string) => void;
  setCouncilRates: (v: string) => void;
  setWaterRates: (v: string) => void;
  setInsurance: (v: string) => void;
  setMaintenance: (v: string) => void;
  setHasStrata: (v: boolean) => void;
  setStrataFees: (v: string) => void;
  setWeeklyRent: (v: string) => void;
  setVacancyRate: (v: string) => void;
  setUsePropertyManager: (v: boolean) => void;
  setManagementFee: (v: string) => void;
  setTaxableIncome: (v: string) => void;
  setDepreciation: (v: string) => void;
  setDepreciationMode: (v: "estimate" | "detailed") => void;
  setDepBuildings: (v: Array<{ name: string; construction_cost: number; purchase_date: string; construction_start_date: string }>) => void;
  setDepAssets: (v: Array<{ name: string; cost: number; effective_life_years: number; purchase_date: string; method: "diminishing_value" | "prime_cost"; written_down_value: number }>) => void;
  setCapitalGrowth: (v: string) => void;
  setViewMode: (v: ViewMode) => void;
  setSelectedYear: (v: number) => void;
  setHoveredYear: (v: number | null) => void;
  setExpandedSections: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Actions
  toggleSection: (section: string) => void;
  resetSection: (section: string) => void;
}

// ── Hook (composition) ──────────────────────────────────────────────────────

export function useCashflowState(): CashflowState {
  const { form, setters, expandedSections, setExpandedSections, toggleSection, resetSection } = useCashflowFormState();

  // Derived values
  const isInvestment = form.propertyUse === "investment";
  const isNewPurchase = form.purchaseMode === "new";

  const allComplete = isInvestment
    ? form.setupComplete && form.propertyComplete && form.loanComplete && form.costsComplete && form.rentalComplete && form.taxComplete
    : form.setupComplete && form.propertyComplete && form.loanComplete && form.costsComplete;

  const loanAmount = isNewPurchase
    ? parseCurrencyCf(form.purchasePrice) - parseCurrencyCf(form.depositAmount)
    : parseCurrencyCf(form.currentLoanBalance);

  const propertyValue = isNewPurchase
    ? parseCurrencyCf(form.purchasePrice)
    : parseCurrencyCf(form.currentValue);

  const effectiveViewMode: ViewMode = form.viewMode;
  const marginalRate = getMarginalTaxRate(parseCurrencyCf(form.taxableIncome));

  // API layer
  const yearData = useCashflowAPI(form, allComplete);

  // Chart data
  const chartData = useMemo(() => {
    if (yearData.length === 0) return [];
    return yearData.map(y => {
      switch (effectiveViewMode) {
        case "summary": return { year: y.year, value: y.netCashflow / 12 };
        case "property": return { year: y.year, value: y.propertyCashflow / 12 };
        case "tax": return { year: y.year, value: -y.incomeTaxCalc };
        case "equity": return { year: y.year, value: y.netEquity };
        case "deductions": return { year: y.year, value: isInvestment ? y.totalDeductions : y.ongoingCosts };
      }
    });
  }, [yearData, effectiveViewMode, isInvestment]);

  const selectedYearData = yearData[form.selectedYear - 1] || null;

  return {
    // Form values (spread)
    ...form,
    // Derived
    isInvestment,
    isNewPurchase,
    allComplete,
    loanAmount,
    propertyValue,
    effectiveViewMode,
    marginalRate,
    // View state
    expandedSections,
    // Computed data
    yearData,
    chartData,
    selectedYearData,
    // Setters
    ...setters,
    setExpandedSections,
    // Actions
    toggleSection,
    resetSection,
  };
}
