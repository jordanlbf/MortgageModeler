"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { PropertyUse, PurchaseMode, LoanType, ViewMode, YearData } from "@/lib/cashflow-types";
import {
  parseCurrencyCf,
  getMarginalTaxRate,
  calculateIncomeTax,
} from "@/lib/cashflow-calculations";
import { fetchCashflowSingle, type CashflowSingleRequest, type CashflowYearRow } from "@/lib/api";
import { generateDepreciationEstimate } from "@/lib/depreciation-estimate";

// ── Public interface ─────────────────────────────────────────────────────────

export interface CashflowState {
  // Mode
  propertyUse: PropertyUse | null;
  purchaseMode: PurchaseMode | null;
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
  loanType: LoanType;
  ioPeriod: string;
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
  setPropertyUse: (v: PropertyUse | null) => void;
  setPurchaseMode: (v: PurchaseMode | null) => void;
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
  setLoanType: (v: LoanType) => void;
  setIoPeriod: (v: string) => void;
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

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCashflowState(): CashflowState {
  // Mode selections
  const [propertyUse, setPropertyUse] = useState<PropertyUse | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode | null>(null);

  // Progressive form completion
  const [setupComplete, setSetupComplete] = useState(false);
  const [propertyComplete, setPropertyComplete] = useState(false);
  const [loanComplete, setLoanComplete] = useState(false);
  const [costsComplete, setCostsComplete] = useState(false);
  const [rentalComplete, setRentalComplete] = useState(false);
  const [taxComplete, setTaxComplete] = useState(false);

  // Form values - Property
  const [purchasePrice, setPurchasePrice] = useState("0");
  const [depositAmount, setDepositAmount] = useState("0");
  const [currentValue, setCurrentValue] = useState("850000");
  const [originalPurchasePrice, setOriginalPurchasePrice] = useState("650000");
  const [purchaseYear, setPurchaseYear] = useState(String(new Date().getFullYear() - 3));
  const [currentLoanBalance, setCurrentLoanBalance] = useState("480000");

  // Form values - Loan
  const [interestRate, setInterestRate] = useState("6.5");
  const [loanTerm, setLoanTerm] = useState("30");
  const [loanType, setLoanType] = useState<LoanType>("principal-interest");
  const [ioPeriod, setIoPeriod] = useState("5");
  const [hasOffset, setHasOffset] = useState(false);
  const [offsetBalance, setOffsetBalance] = useState("0");
  const [extraRepayments, setExtraRepayments] = useState("0");

  // Form values - Costs
  const [councilRates, setCouncilRates] = useState("1800");
  const [waterRates, setWaterRates] = useState("1200");
  const [insurance, setInsurance] = useState("2000");
  const [maintenance, setMaintenance] = useState("0.5");
  const [hasStrata, setHasStrata] = useState(false);
  const [strataFees, setStrataFees] = useState("800");

  // Form values - Rental
  const [weeklyRent, setWeeklyRent] = useState("650");
  const [vacancyRate, setVacancyRate] = useState("3.8");
  const [usePropertyManager, setUsePropertyManager] = useState(true);
  const [managementFee, setManagementFee] = useState("7.5");

  // Form values - Tax
  const [taxableIncome, setTaxableIncome] = useState("120000");
  const [depreciation, setDepreciation] = useState("8000");
  const [depreciationMode, setDepreciationMode] = useState<"estimate" | "detailed">("estimate");
  const [depBuildings, setDepBuildings] = useState<Array<{ name: string; construction_cost: number; purchase_date: string; construction_start_date: string }>>([]);
  const [depAssets, setDepAssets] = useState<Array<{ name: string; cost: number; effective_life_years: number; purchase_date: string; method: "diminishing_value" | "prime_cost"; written_down_value: number }>>([]);
  const [capitalGrowth, setCapitalGrowth] = useState("3.5");

  // Output view state
  const [viewMode, setViewMode] = useState<ViewMode>("summary");
  const [selectedYear, setSelectedYear] = useState(1);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["propertyUse"]));

  // ── Derived ────────────────────────────────────────────────────────────────

  const isInvestment = propertyUse === "investment";
  const isNewPurchase = purchaseMode === "new";

  const allComplete = isInvestment
    ? setupComplete && propertyComplete && loanComplete && costsComplete && rentalComplete && taxComplete
    : setupComplete && propertyComplete && loanComplete && costsComplete;

  const loanAmount = isNewPurchase
    ? parseCurrencyCf(purchasePrice) - parseCurrencyCf(depositAmount)
    : parseCurrencyCf(currentLoanBalance);

  const propertyValue = isNewPurchase
    ? parseCurrencyCf(purchasePrice)
    : parseCurrencyCf(currentValue);

  const effectiveViewMode: ViewMode = viewMode;
  const marginalRate = getMarginalTaxRate(parseCurrencyCf(taxableIncome));

  // ── API-driven 30-year projection ──────────────────────────────────────────

  const [yearData, setYearData] = useState<YearData[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildRequest = useCallback((): CashflowSingleRequest | null => {
    if (!allComplete) return null;

    const growth = parseFloat(capitalGrowth) / 100 || 0.035;
    const vacWeeks = Math.round((parseFloat(vacancyRate) || 3.8) / 100 * 52);
    const mgmtRate = usePropertyManager ? (parseFloat(managementFee) / 100 || 0.075) : 0;
    const maintenanceRate = parseFloat(maintenance) / 100 || 0.005;
    const income = parseCurrencyCf(taxableIncome);
    const estYear = isNewPurchase ? new Date().getFullYear() : parseInt(purchaseYear) || new Date().getFullYear();
    const purchaseDate = isNewPurchase ? new Date().toISOString().slice(0, 10) : `${estYear}-07-01`;
    const propPrice = isNewPurchase ? parseCurrencyCf(purchasePrice) : parseCurrencyCf(currentValue);

    // Depreciation schedules
    let depBuilds = depBuildings;
    let depAsts = depAssets;
    if (depreciationMode === "estimate" && isInvestment) {
      const est = generateDepreciationEstimate(propPrice, isNewPurchase, estYear);
      depBuilds = est.buildings;
      depAsts = est.assets;
    }

    const base: CashflowSingleRequest = {
      mode: isNewPurchase ? "new" : "existing",
      property_use: isInvestment ? "investment" : "ppor",
      projection_years: 30,
      tax_profile: {
        taxable_income: income,
        repayment_income: income,
        mls_income: income,
        hecs_balance: 0,
        has_private_health: false,
        income_growth_rate: growth,
      },
      ongoing_costs: {
        council_rates: parseCurrencyCf(councilRates),
        water_rates: parseCurrencyCf(waterRates),
        building_insurance: parseCurrencyCf(insurance),
        strata_fees: hasStrata ? parseCurrencyCf(strataFees) * 4 : 0,
        maintenance_rate: maintenanceRate,
        landlord_insurance: 0,
        management_rate: mgmtRate,
        annual_cost_growth_rate: 0.03,
      },
      rental: isInvestment ? {
        weekly_rent: parseCurrencyCf(weeklyRent),
        annual_growth_rate: growth,
        vacancy_weeks: vacWeeks,
      } : null,
    };

    if (isNewPurchase) {
      base.property = {
        purchase_price: parseCurrencyCf(purchasePrice),
        purchase_date: purchaseDate,
        is_new_property: true,
        is_ppor: !isInvestment,
        annual_appreciation: growth,
        purchase_costs: { other_costs: 0, capitalise_lmi: false, capitalise_mortgage_registration_fee: false, capitalise_loan_establishment_fee: false } as any,
        rental: base.rental ?? { weekly_rent: 0, annual_growth_rate: growth, vacancy_weeks: 2 },
        depreciable_buildings: depBuilds,
        depreciable_assets: depAsts,
      };
      base.loan = {
        deposit: parseCurrencyCf(depositAmount),
        annual_rate: parseFloat(interestRate) / 100 || 0.065,
        loan_term_years: parseInt(loanTerm) || 30,
        frequency: "monthly",
        offset_balance: hasOffset ? parseCurrencyCf(offsetBalance) : 0,
        offset_contribution: 0,
        extra_repayment: parseCurrencyCf(extraRepayments),
        rate_changes: [],
        borrowing_costs: {
          lmi: 0,
          mortgage_registration_fee: 0,
          loan_establishment_fee: 0,
          capitalise_lmi: false,
          capitalise_mortgage_registration_fee: false,
          capitalise_loan_establishment_fee: false,
        },
      };
    } else {
      base.existing_property = {
        purchase_date: purchaseDate,
        purchase_price: parseCurrencyCf(originalPurchasePrice),
        is_new_property: false,
        current_value: parseCurrencyCf(currentValue),
        annual_appreciation: growth,
        depreciable_buildings: depBuilds,
        depreciable_assets: depAsts,
      };
      base.existing_loan = {
        current_balance: parseCurrencyCf(currentLoanBalance),
        remaining_term_years: parseInt(loanTerm) || 25,
        annual_rate: parseFloat(interestRate) / 100 || 0.065,
        frequency: "monthly",
        offset_balance: hasOffset ? parseCurrencyCf(offsetBalance) : 0,
        offset_contribution: 0,
        extra_repayment: parseCurrencyCf(extraRepayments),
        rate_changes: [],
      };
    }

    return base;
  }, [
    allComplete, isNewPurchase, isInvestment, capitalGrowth, vacancyRate,
    usePropertyManager, managementFee, maintenance, taxableIncome, purchaseYear,
    purchasePrice, currentValue, depreciationMode, depBuildings, depAssets,
    councilRates, waterRates, insurance, hasStrata, strataFees, weeklyRent,
    depositAmount, interestRate, loanTerm, offsetBalance, hasOffset,
    extraRepayments, originalPurchasePrice, currentLoanBalance,
  ]);

  const mapResponseToYearData = useCallback((years: CashflowYearRow[]): YearData[] => {
    return years.map((y) => {
      const d = y.ongoing_costs_detail;
      const t = y.tax_deduction_detail;
      const salary = y.salary;
      const incomeTaxCalcVal = y.income_tax;
      const rental = y.rental_income;
      const interestPaid = y.mortgage_interest;
      const principalPaid = y.mortgage_principal;
      const ongoingCostsVal = d ? d.council_rates + d.water_rates + d.building_insurance + d.maintenance_cost + d.strata_fees : y.property_costs;
      const depDiv43 = t ? t.depreciation_building : 0;
      const depDiv40 = t ? t.depreciation_plant : 0;
      const totalDeductionsVal = t ? t.total_deductions : 0;
      const taxSavedVal = y.tax_saving;
      const gearingVal = rental - interestPaid - ongoingCostsVal - depDiv43 - depDiv40;
      const incomeTaxWithoutVal = calculateIncomeTax(salary);
      const grossIncomeVal = salary + rental;
      const netCashflowVal = salary + rental - ongoingCostsVal - y.mortgage_repayment - incomeTaxCalcVal;
      const propertyCashflowVal = gearingVal - principalPaid;
      const netEquityVal = y.equity + y.offset_balance;

      // Derive vacancy and management from the ongoing costs detail
      const vacRate = parseFloat(vacancyRate) / 100 || 0.038;
      const mgmtFee = usePropertyManager ? parseFloat(managementFee) / 100 || 0.075 : 0;
      const vacancyVal = rental * vacRate;
      const mgmtVal = (rental - vacancyVal) * mgmtFee;

      return {
        year: y.year + 1, // backend is 0-indexed, frontend is 1-indexed
        propertyValue: y.property_value,
        loanBalance: y.loan_balance,
        equity: y.equity,
        rentalIncome: rental,
        vacancy: vacancyVal,
        managementFee: mgmtVal,
        netRentalIncome: rental - vacancyVal - mgmtVal,
        loanRepayment: y.mortgage_repayment,
        interestPortion: interestPaid,
        principalPortion: principalPaid,
        councilRates: d?.council_rates ?? 0,
        waterRates: d?.water_rates ?? 0,
        insurance: d?.building_insurance ?? 0,
        maintenance: d?.maintenance_cost ?? 0,
        strataFees: d?.strata_fees ?? 0,
        totalExpenses: ongoingCostsVal + interestPaid,
        preTaxCashflow: (rental - vacancyVal - mgmtVal) - (ongoingCostsVal + interestPaid),
        depDiv43,
        depDiv40,
        otherDeductibles: t ? t.deductible_expenses : 0,
        totalDeductions: totalDeductionsVal,
        rentalLossOrGain: t ? t.net_rental_income : 0,
        taxBenefit: taxSavedVal,
        afterTaxCashflow: (rental - vacancyVal - mgmtVal) - (ongoingCostsVal + interestPaid) + taxSavedVal,
        salary,
        otherIncome: 0,
        ongoingCosts: ongoingCostsVal,
        gearing: gearingVal,
        totalIncomeAll: grossIncomeVal,
        totalDeductionsForTax: totalDeductionsVal,
        taxableIncomeCalc: grossIncomeVal - totalDeductionsVal,
        incomeTaxCalc: incomeTaxCalcVal,
        incomeTaxWithout: incomeTaxWithoutVal,
        taxSaved: taxSavedVal,
        grossIncome: grossIncomeVal,
        afterTaxIncome: grossIncomeVal - incomeTaxCalcVal,
        cfTotalIncome: salary + rental - interestPaid - ongoingCostsVal,
        netCashflow: netCashflowVal,
        propertyCashflow: propertyCashflowVal,
        offsetBalanceAtYear: y.offset_balance,
        propertyEquity: y.equity,
        netEquity: netEquityVal,
      };
    });
  }, [vacancyRate, usePropertyManager, managementFee]);

  // Fetch from API when inputs change (debounced)
  useEffect(() => {
    const req = buildRequest();
    if (!req) {
      setYearData([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetchCashflowSingle(req, controller.signal);
        setYearData(mapResponseToYearData(response.years));
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Cashflow API error:", err);
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [buildRequest, mapResponseToYearData]);

  // ── Chart data ─────────────────────────────────────────────────────────────

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

  const selectedYearData = yearData[selectedYear - 1] || null;

  // ── Actions ────────────────────────────────────────────────────────────────

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const resetSection = (section: string) => {
    switch (section) {
      case "propertyUse":
        setPropertyUse(null);
        setPurchaseMode(null);
        setSetupComplete(false);
        setPropertyComplete(false);
        setLoanComplete(false);
        setCostsComplete(false);
        setRentalComplete(false);
        setTaxComplete(false);
        break;
      case "purchaseMode":
        setPurchaseMode(null);
        setSetupComplete(false);
        setPropertyComplete(false);
        setLoanComplete(false);
        setCostsComplete(false);
        setRentalComplete(false);
        setTaxComplete(false);
        break;
      case "property":
        setPropertyComplete(false);
        setLoanComplete(false);
        setCostsComplete(false);
        setRentalComplete(false);
        setTaxComplete(false);
        break;
      case "loan":
        setLoanComplete(false);
        setCostsComplete(false);
        setRentalComplete(false);
        setTaxComplete(false);
        break;
      case "costs":
        setCostsComplete(false);
        setRentalComplete(false);
        setTaxComplete(false);
        break;
      case "rental":
        setRentalComplete(false);
        setTaxComplete(false);
        break;
      case "tax":
        setTaxComplete(false);
        break;
    }
    setExpandedSections(prev => new Set([...prev, section]));
  };

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    propertyUse, purchaseMode, isInvestment, isNewPurchase,
    setupComplete, propertyComplete, loanComplete, costsComplete, rentalComplete, taxComplete, allComplete,
    loanAmount, propertyValue, effectiveViewMode, marginalRate,
    purchasePrice, depositAmount, currentValue, originalPurchasePrice, purchaseYear, currentLoanBalance,
    interestRate, loanTerm, loanType, ioPeriod, hasOffset, offsetBalance, extraRepayments,
    councilRates, waterRates, insurance, maintenance, hasStrata, strataFees,
    weeklyRent, vacancyRate, usePropertyManager, managementFee,
    taxableIncome, depreciation, depreciationMode, depBuildings, depAssets, capitalGrowth,
    viewMode, selectedYear, hoveredYear, expandedSections,
    yearData, chartData, selectedYearData,
    setPropertyUse, setPurchaseMode,
    setSetupComplete, setPropertyComplete, setLoanComplete, setCostsComplete, setRentalComplete, setTaxComplete,
    setPurchasePrice, setDepositAmount, setCurrentValue, setOriginalPurchasePrice, setPurchaseYear, setCurrentLoanBalance,
    setInterestRate, setLoanTerm, setLoanType, setIoPeriod, setHasOffset, setOffsetBalance, setExtraRepayments,
    setCouncilRates, setWaterRates, setInsurance, setMaintenance, setHasStrata, setStrataFees,
    setWeeklyRent, setVacancyRate, setUsePropertyManager, setManagementFee,
    setTaxableIncome, setDepreciation, setDepreciationMode, setDepBuildings, setDepAssets, setCapitalGrowth,
    setViewMode, setSelectedYear, setHoveredYear, setExpandedSections,
    toggleSection, resetSection,
  };
}
