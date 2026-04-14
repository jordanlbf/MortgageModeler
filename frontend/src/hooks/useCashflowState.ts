"use client";

import { useState, useMemo } from "react";
import type { PropertyUse, PurchaseMode, LoanType, ViewMode, YearData } from "@/lib/cashflow-types";
import {
  parseCurrencyCf,
  calculateMonthlyRepayment,
  calculateIOPayment,
  calculateLoanBalanceAtYear,
  getMarginalTaxRate,
  calculateIncomeTax,
} from "@/lib/cashflow-calculations";

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

  // ── 30-year projection ─────────────────────────────────────────────────────

  const yearData = useMemo((): YearData[] => {
    if (!allComplete) return [];

    const data: YearData[] = [];
    const rate = parseFloat(interestRate) || 6.5;
    const term = parseInt(loanTerm) || 30;
    const ioPeriodYears = loanType === "interest-only" ? parseInt(ioPeriod) || 5 : 0;
    const growth = parseFloat(capitalGrowth) || 3.5;
    const taxRate = getMarginalTaxRate(parseCurrencyCf(taxableIncome)) + 0.02;
    const annualRent = parseCurrencyCf(weeklyRent) * 52;
    const vacRate = parseFloat(vacancyRate) / 100 || 0.038;
    const mgmtFee = usePropertyManager ? parseFloat(managementFee) / 100 || 0.075 : 0;
    const annualDepreciation = parseCurrencyCf(depreciation);
    const annualCouncil = parseCurrencyCf(councilRates);
    const annualWater = parseCurrencyCf(waterRates);
    const annualInsurance = parseCurrencyCf(insurance);
    const maintenanceRate = parseFloat(maintenance) / 100 || 0.005;
    const annualStrata = hasStrata ? parseCurrencyCf(strataFees) * 4 : 0;
    const effectiveOffset = hasOffset ? parseCurrencyCf(offsetBalance) : 0;
    const monthlyExtra = parseCurrencyCf(extraRepayments);

    for (let year = 1; year <= 30; year++) {
      const propValue = propertyValue * Math.pow(1 + growth / 100, year);
      const loanBal = calculateLoanBalanceAtYear(
        loanAmount - effectiveOffset, rate, term, year, loanType, ioPeriodYears
      );
      const equity = propValue - loanBal;

      const rental = isInvestment ? annualRent * Math.pow(1 + growth / 100, year - 1) : 0;
      const vacancy = isInvestment ? rental * vacRate : 0;
      const mgmt = isInvestment ? (rental - vacancy) * mgmtFee : 0;
      const netRental = rental - vacancy - mgmt;

      let annualRepayment: number;
      let interestPaid: number;
      let principalPaid: number;

      if (loanType === "interest-only" && year <= ioPeriodYears) {
        const monthlyIO = calculateIOPayment(loanAmount - effectiveOffset, rate);
        annualRepayment = (monthlyIO + monthlyExtra) * 12;
        interestPaid = monthlyIO * 12;
        principalPaid = monthlyExtra * 12;
      } else {
        const effectiveTerm = loanType === "interest-only" ? term - ioPeriodYears : term;
        const monthlyPI = calculateMonthlyRepayment(loanAmount - effectiveOffset, rate, effectiveTerm);
        annualRepayment = (monthlyPI + monthlyExtra) * 12;
        const avgBalance = (calculateLoanBalanceAtYear(loanAmount - effectiveOffset, rate, term, year - 1, loanType, ioPeriodYears) + loanBal) / 2;
        interestPaid = avgBalance * (rate / 100);
        principalPaid = annualRepayment - interestPaid;
      }

      const annualMaintenance = propValue * maintenanceRate;
      const totalExpenses = interestPaid + annualCouncil + annualWater + annualInsurance + annualMaintenance + annualStrata;
      const preTax = netRental - totalExpenses;

      const depDiv43 = isInvestment ? annualDepreciation * 0.5 : 0;
      const depDiv40 = isInvestment ? annualDepreciation * 0.5 : 0;
      const otherDeductibles = isInvestment ? (annualCouncil + annualWater + annualInsurance + annualMaintenance + annualStrata + mgmt) : 0;
      const totalDeductions = isInvestment ? (interestPaid + depDiv43 + depDiv40 + otherDeductibles) : 0;
      const rentalLossOrGain = isInvestment ? netRental - totalDeductions : 0;
      const taxBenefitAmt = (isInvestment && rentalLossOrGain < 0) ? Math.abs(rentalLossOrGain) * taxRate : 0;
      const afterTaxCashflow = preTax + taxBenefitAmt;

      const salaryVal = parseCurrencyCf(taxableIncome) * Math.pow(1 + growth / 100, year - 1);
      const otherIncomeVal = 0;
      const ongoingCostsVal = annualCouncil + annualWater + annualInsurance + annualMaintenance + annualStrata;
      const gearingVal = rental - interestPaid - ongoingCostsVal - depDiv43 - depDiv40;
      const totalIncomeAllVal = salaryVal + otherIncomeVal + rental;
      const totalDeductionsForTaxVal = interestPaid + ongoingCostsVal + depDiv43 + depDiv40;
      const taxableIncomeCalcVal = totalIncomeAllVal - totalDeductionsForTaxVal;
      const incomeTaxCalcVal = calculateIncomeTax(taxableIncomeCalcVal);
      const incomeTaxWithoutVal = calculateIncomeTax(salaryVal + otherIncomeVal);
      const incomeTaxWithRentalVal = calculateIncomeTax(salaryVal + otherIncomeVal + rental);
      const taxSavedVal = incomeTaxWithRentalVal - incomeTaxCalcVal;
      const grossIncomeVal = salaryVal + otherIncomeVal + rental;
      const afterTaxIncomeVal = grossIncomeVal - incomeTaxCalcVal;
      const cfTotalIncomeVal = salaryVal + otherIncomeVal + rental - interestPaid - ongoingCostsVal;
      const netCashflowVal = cfTotalIncomeVal - principalPaid - incomeTaxCalcVal;
      const propertyCashflowVal = gearingVal - principalPaid;
      const offsetBalAtYear = effectiveOffset;
      const propertyEquityVal = propValue - loanBal;
      const netEquityVal = propValue - loanBal + offsetBalAtYear;

      data.push({
        year,
        propertyValue: propValue,
        loanBalance: loanBal,
        equity,
        rentalIncome: rental,
        vacancy,
        managementFee: mgmt,
        netRentalIncome: netRental,
        loanRepayment: annualRepayment,
        interestPortion: interestPaid,
        principalPortion: principalPaid,
        councilRates: annualCouncil,
        waterRates: annualWater,
        insurance: annualInsurance,
        maintenance: annualMaintenance,
        strataFees: annualStrata,
        totalExpenses,
        preTaxCashflow: preTax,
        depDiv43,
        depDiv40,
        otherDeductibles,
        totalDeductions,
        rentalLossOrGain,
        taxBenefit: taxBenefitAmt,
        afterTaxCashflow,
        salary: salaryVal,
        otherIncome: otherIncomeVal,
        ongoingCosts: ongoingCostsVal,
        gearing: gearingVal,
        totalIncomeAll: totalIncomeAllVal,
        totalDeductionsForTax: totalDeductionsForTaxVal,
        taxableIncomeCalc: taxableIncomeCalcVal,
        incomeTaxCalc: incomeTaxCalcVal,
        incomeTaxWithout: incomeTaxWithoutVal,
        taxSaved: taxSavedVal,
        grossIncome: grossIncomeVal,
        afterTaxIncome: afterTaxIncomeVal,
        cfTotalIncome: cfTotalIncomeVal,
        netCashflow: netCashflowVal,
        propertyCashflow: propertyCashflowVal,
        offsetBalanceAtYear: offsetBalAtYear,
        propertyEquity: propertyEquityVal,
        netEquity: netEquityVal,
      });
    }

    return data;
  }, [
    allComplete, propertyValue, loanAmount, interestRate, loanTerm, loanType, ioPeriod,
    capitalGrowth, taxableIncome, weeklyRent, vacancyRate, usePropertyManager, managementFee,
    depreciation, councilRates, waterRates, insurance, maintenance, hasStrata, strataFees,
    hasOffset, offsetBalance, extraRepayments, isInvestment
  ]);

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
    taxableIncome, depreciation, capitalGrowth,
    viewMode, selectedYear, hoveredYear, expandedSections,
    yearData, chartData, selectedYearData,
    setPropertyUse, setPurchaseMode,
    setSetupComplete, setPropertyComplete, setLoanComplete, setCostsComplete, setRentalComplete, setTaxComplete,
    setPurchasePrice, setDepositAmount, setCurrentValue, setOriginalPurchasePrice, setPurchaseYear, setCurrentLoanBalance,
    setInterestRate, setLoanTerm, setLoanType, setIoPeriod, setHasOffset, setOffsetBalance, setExtraRepayments,
    setCouncilRates, setWaterRates, setInsurance, setMaintenance, setHasStrata, setStrataFees,
    setWeeklyRent, setVacancyRate, setUsePropertyManager, setManagementFee,
    setTaxableIncome, setDepreciation, setCapitalGrowth,
    setViewMode, setSelectedYear, setHoveredYear, setExpandedSections,
    toggleSection, resetSection,
  };
}
