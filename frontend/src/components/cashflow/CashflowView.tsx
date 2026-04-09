"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import Header from "@/components/layout/Header";
import "./cashflow.css";

// ============================================================================
// TYPES
// ============================================================================

type PropertyUse = "investment" | "ppor";
type PurchaseMode = "new" | "existing";
type LoanType = "principal-interest" | "interest-only";
type ViewMode = "summary" | "property" | "equity" | "deductions";

interface YearData {
  year: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  rentalIncome: number;
  vacancy: number;
  managementFee: number;
  netRentalIncome: number;
  loanRepayment: number;
  interestPortion: number;
  principalPortion: number;
  councilRates: number;
  waterRates: number;
  insurance: number;
  maintenance: number;
  strataFees: number;
  totalExpenses: number;
  preTaxCashflow: number;
  depDiv43: number;
  depDiv40: number;
  otherDeductibles: number;
  totalDeductions: number;
  rentalLossOrGain: number;
  taxBenefit: number;
  afterTaxCashflow: number;
  // New fields
  salary: number;
  otherIncome: number;
  ongoingCosts: number;
  gearing: number;
  totalIncomeAll: number;
  totalDeductionsForTax: number;
  taxableIncomeCalc: number;
  incomeTaxCalc: number;
  incomeTaxWithout: number;
  taxSaved: number;
  grossIncome: number;
  afterTaxIncome: number;
  cfTotalIncome: number;
  netCashflow: number;
  propertyCashflow: number;
  offsetBalanceAtYear: number;
  propertyEquity: number;
  netEquity: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, "")) || 0;
}

function formatCurrency(value: number): string {
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString("en-AU", { maximumFractionDigits: 0 });
  return value < 0 ? `\u2212$${formatted}` : `$${formatted}`;
}

function formatAbbreviated(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}m`;
  }
  return `$${Math.round(value / 1000).toLocaleString()}k`;
}

function formatChartLabel(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "\u2212" : "";
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}m`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${Math.round(abs)}`;
}

function calculateMonthlyRepayment(principal: number, annualRate: number, termYears: number): number {
  if (annualRate === 0) return principal / (termYears * 12);
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

function calculateIOPayment(principal: number, annualRate: number): number {
  return principal * (annualRate / 100 / 12);
}

function calculateLoanBalanceAtYear(
  principal: number,
  annualRate: number,
  termYears: number,
  yearsElapsed: number,
  loanType: LoanType,
  ioPeriod: number
): number {
  if (loanType === "interest-only" && yearsElapsed < ioPeriod) {
    return principal;
  }

  const effectiveYearsElapsed = loanType === "interest-only"
    ? yearsElapsed - ioPeriod
    : yearsElapsed;
  const effectiveTermYears = loanType === "interest-only"
    ? termYears - ioPeriod
    : termYears;

  if (effectiveYearsElapsed <= 0) return principal;
  if (effectiveYearsElapsed >= effectiveTermYears) return 0;

  const monthlyRate = annualRate / 100 / 12;
  const paymentsMade = effectiveYearsElapsed * 12;

  const monthlyPayment = calculateMonthlyRepayment(principal, annualRate, effectiveTermYears);
  const balance = principal * Math.pow(1 + monthlyRate, paymentsMade) -
                  monthlyPayment * ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate);

  return Math.max(0, balance);
}

function getMarginalTaxRate(income: number): number {
  if (income <= 18200) return 0;
  if (income <= 45000) return 0.19;
  if (income <= 120000) return 0.325;
  if (income <= 180000) return 0.37;
  return 0.45;
}

function calculateIncomeTax(taxableIncome: number): number {
  let tax = 0;
  if (taxableIncome <= 18200) tax = 0;
  else if (taxableIncome <= 45000) tax = (taxableIncome - 18200) * 0.19;
  else if (taxableIncome <= 120000) tax = 5092 + (taxableIncome - 45000) * 0.325;
  else if (taxableIncome <= 180000) tax = 29467 + (taxableIncome - 120000) * 0.37;
  else tax = 51667 + (taxableIncome - 180000) * 0.45;
  return Math.round(tax + taxableIncome * 0.02);
}

function calculateStampDuty(purchasePrice: number, isInvestment: boolean): number {
  let duty = 0;
  if (purchasePrice <= 16000) {
    duty = purchasePrice * 0.0125;
  } else if (purchasePrice <= 35000) {
    duty = 200 + (purchasePrice - 16000) * 0.015;
  } else if (purchasePrice <= 93000) {
    duty = 485 + (purchasePrice - 35000) * 0.0175;
  } else if (purchasePrice <= 351000) {
    duty = 1500 + (purchasePrice - 93000) * 0.035;
  } else if (purchasePrice <= 1168000) {
    duty = 10530 + (purchasePrice - 351000) * 0.045;
  } else {
    duty = 47295 + (purchasePrice - 1168000) * 0.055;
  }
  if (isInvestment) {
    duty += purchasePrice * 0.005;
  }
  return Math.round(duty);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CashflowCalculator() {
  // Mode selections
  const [propertyUse, setPropertyUse] = useState<PropertyUse | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode | null>(null);

  // Progressive form completion
  const [propertyComplete, setPropertyComplete] = useState(false);
  const [loanComplete, setLoanComplete] = useState(false);
  const [costsComplete, setCostsComplete] = useState(false);
  const [rentalComplete, setRentalComplete] = useState(false);
  const [taxComplete, setTaxComplete] = useState(false);

  // Form values - Property
  const [purchasePrice, setPurchasePrice] = useState("750000");
  const [depositAmount, setDepositAmount] = useState("150000");
  const [currentValue, setCurrentValue] = useState("850000");
  const [originalPurchasePrice, setOriginalPurchasePrice] = useState("650000");
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

  // Form values - Rental (investment only)
  const [weeklyRent, setWeeklyRent] = useState("650");
  const [vacancyRate, setVacancyRate] = useState("3.8");
  const [usePropertyManager, setUsePropertyManager] = useState(true);
  const [managementFee, setManagementFee] = useState("7.5");

  // Form values - Tax (investment only)
  const [taxableIncome, setTaxableIncome] = useState("120000");
  const [depreciation, setDepreciation] = useState("8000");
  const [capitalGrowth, setCapitalGrowth] = useState("3.5");

  // Output view state
  const [viewMode, setViewMode] = useState<ViewMode>("summary");
  const [selectedYear, setSelectedYear] = useState(1);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["propertyUse"]));

  // Derived values
  const isInvestment = propertyUse === "investment";
  const isPPOR = propertyUse === "ppor";
  const isNewPurchase = purchaseMode === "new";

  const allComplete = isInvestment
    ? propertyComplete && loanComplete && costsComplete && rentalComplete && taxComplete
    : propertyComplete && loanComplete && costsComplete;

  const loanAmount = isNewPurchase
    ? parseCurrency(purchasePrice) - parseCurrency(depositAmount)
    : parseCurrency(currentLoanBalance);

  const propertyValue = isNewPurchase
    ? parseCurrency(purchasePrice)
    : parseCurrency(currentValue);

  const effectiveViewMode: ViewMode = viewMode;

  // Calculate all year data
  const yearData = useMemo((): YearData[] => {
    if (!allComplete) return [];

    const data: YearData[] = [];
    const rate = parseFloat(interestRate) || 6.5;
    const term = parseInt(loanTerm) || 30;
    const ioPeriodYears = loanType === "interest-only" ? parseInt(ioPeriod) || 5 : 0;
    const growth = parseFloat(capitalGrowth) || 3.5;
    const taxRate = getMarginalTaxRate(parseCurrency(taxableIncome)) + 0.02;
    const annualRent = parseCurrency(weeklyRent) * 52;
    const vacRate = parseFloat(vacancyRate) / 100 || 0.038;
    const mgmtFee = usePropertyManager ? parseFloat(managementFee) / 100 || 0.075 : 0;
    const annualDepreciation = parseCurrency(depreciation);
    const annualCouncil = parseCurrency(councilRates);
    const annualWater = parseCurrency(waterRates);
    const annualInsurance = parseCurrency(insurance);
    const maintenanceRate = parseFloat(maintenance) / 100 || 0.005;
    const annualStrata = hasStrata ? parseCurrency(strataFees) * 4 : 0;
    const effectiveOffset = hasOffset ? parseCurrency(offsetBalance) : 0;
    const monthlyExtra = parseCurrency(extraRepayments);

    for (let year = 1; year <= 30; year++) {
      const propValue = propertyValue * Math.pow(1 + growth / 100, year);
      const loanBal = calculateLoanBalanceAtYear(
        loanAmount - effectiveOffset,
        rate,
        term,
        year,
        loanType,
        ioPeriodYears
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

      // New fields
      const salaryVal = parseCurrency(taxableIncome);
      const otherIncomeVal = 0;
      const ongoingCostsVal = annualCouncil + annualWater + annualInsurance + annualMaintenance + annualStrata;
      const gearingVal = rental - interestPaid - ongoingCostsVal - depDiv43 - depDiv40;
      const totalIncomeAllVal = salaryVal + otherIncomeVal + rental;
      const totalDeductionsForTaxVal = interestPaid + ongoingCostsVal + depDiv43 + depDiv40;
      const taxableIncomeCalcVal = totalIncomeAllVal - totalDeductionsForTaxVal;
      const incomeTaxCalcVal = calculateIncomeTax(taxableIncomeCalcVal);
      const incomeTaxWithoutVal = calculateIncomeTax(salaryVal + otherIncomeVal);
      const taxSavedVal = incomeTaxWithoutVal - incomeTaxCalcVal;
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

  // Chart data
  const chartData = useMemo(() => {
    if (yearData.length === 0) return [];
    return yearData.map(y => {
      switch (effectiveViewMode) {
        case "summary": return { year: y.year, value: y.netCashflow / 12 };
        case "property": return { year: y.year, value: y.propertyCashflow / 12 };
        case "equity": return { year: y.year, value: y.netEquity };
        case "deductions": return { year: y.year, value: isInvestment ? y.totalDeductions : y.ongoingCosts };
      }
    });
  }, [yearData, effectiveViewMode]);

  // Selected year data
  const selectedYearData = yearData[selectedYear - 1] || null;

  // Marginal rate for display
  const marginalRate = getMarginalTaxRate(parseCurrency(taxableIncome));

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Whether each mode step is "complete"
  const propertyUseComplete = propertyUse !== null;
  const purchaseModeComplete = purchaseMode !== null;

  // Reset to edit a completed section
  const resetSection = (section: string) => {
    switch (section) {
      case "propertyUse":
        setPropertyUse(null);
        setPurchaseMode(null);
        setPropertyComplete(false);
        setLoanComplete(false);
        setCostsComplete(false);
        setRentalComplete(false);
        setTaxComplete(false);
        break;
      case "purchaseMode":
        setPurchaseMode(null);
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

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
    <Header />
    <div className="cf-layout">
      {/* LEFT SIDEBAR - INPUTS */}
      <aside className="cf-sidebar">
        <div className="cf-sidebar-inner">
          {/* Property Use */}
          <div className="cf-section">
            <button
              className="cf-section-header"
              onClick={() => toggleSection("propertyUse")}
            >
              <span>{propertyUseComplete ? (propertyUse === "investment" ? "Investment" : "PPOR") : "Property Use"}</span>
              {propertyUseComplete && (
                <span
                  role="button"
                  tabIndex={0}
                  className="cf-edit-link"
                  onClick={(e) => { e.stopPropagation(); resetSection("propertyUse"); }}
                >
                  Edit
                </span>
              )}
              {!propertyUseComplete && (
                expandedSections.has("propertyUse") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>

            {!propertyUseComplete && expandedSections.has("propertyUse") && (
              <div className="cf-section-content">
                <div className="cf-button-group">
                  <button
                    className={`cf-button-option ${propertyUse === "investment" ? "active" : ""}`}
                    onClick={() => {
                      setPropertyUse("investment");
                      setPurchaseMode(null);
                      setExpandedSections(prev => {
                        const next = new Set(prev);
                        next.delete("propertyUse");
                        next.add("purchaseMode");
                        return next;
                      });
                    }}
                  >
                    Investment
                  </button>
                  <button
                    className={`cf-button-option ${propertyUse === "ppor" ? "active" : ""}`}
                    onClick={() => {
                      setPropertyUse("ppor");
                      setPurchaseMode(null);
                      setExpandedSections(prev => {
                        const next = new Set(prev);
                        next.delete("propertyUse");
                        next.add("purchaseMode");
                        return next;
                      });
                    }}
                  >
                    PPOR
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Purchase Mode */}
          {propertyUseComplete && (
            <div className="cf-section">
              <button
                className="cf-section-header"
                onClick={() => toggleSection("purchaseMode")}
              >
                <span>{purchaseModeComplete ? (purchaseMode === "new" ? "New Purchase" : "Existing Property") : "Purchase Mode"}</span>
                {purchaseModeComplete && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="cf-edit-link"
                    onClick={(e) => { e.stopPropagation(); resetSection("purchaseMode"); }}
                  >
                    Edit
                  </span>
                )}
                {!purchaseModeComplete && (
                  expandedSections.has("purchaseMode") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                )}
              </button>

              {!purchaseModeComplete && expandedSections.has("purchaseMode") && (
                <div className="cf-section-content">
                  <div className="cf-button-group">
                    <button
                      className={`cf-button-option ${purchaseMode === "new" ? "active" : ""}`}
                      onClick={() => {
                        setPurchaseMode("new");
                        setExpandedSections(prev => {
                          const next = new Set(prev);
                          next.delete("purchaseMode");
                          next.add("property");
                          return next;
                        });
                      }}
                    >
                      New Purchase
                    </button>
                    <button
                      className={`cf-button-option ${purchaseMode === "existing" ? "active" : ""}`}
                      onClick={() => {
                        setPurchaseMode("existing");
                        setExpandedSections(prev => {
                          const next = new Set(prev);
                          next.delete("purchaseMode");
                          next.add("property");
                          return next;
                        });
                      }}
                    >
                      Existing Property
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Property Details */}
          {purchaseMode && (
            <div className="cf-section">
              <button
                className="cf-section-header"
                onClick={() => toggleSection("property")}
              >
                <span>Property Details</span>
                {propertyComplete && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="cf-edit-link"
                    onClick={(e) => { e.stopPropagation(); resetSection("property"); }}
                  >
                    Edit
                  </span>
                )}
                {!propertyComplete && (
                  expandedSections.has("property") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                )}
              </button>

              {!propertyComplete && expandedSections.has("property") && (
                <div className="cf-section-content">
                  {isNewPurchase ? (
                    <>
                      <div className="cf-field">
                        <label className="cf-label">Purchase Price</label>
                        <input
                          type="text"
                          className="cf-input"
                          value={`$${parseCurrency(purchasePrice).toLocaleString()}`}
                          onChange={(e) => setPurchasePrice(e.target.value)}
                        />
                      </div>
                      <div className="cf-field">
                        <label className="cf-label">Deposit Amount</label>
                        <input
                          type="text"
                          className="cf-input"
                          value={`$${parseCurrency(depositAmount).toLocaleString()}`}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </div>
                      <div className="cf-field-row">
                        <div className="cf-field">
                          <label className="cf-label">Loan Amount</label>
                          <div className="cf-input-display">
                            {formatCurrency(parseCurrency(purchasePrice) - parseCurrency(depositAmount))}
                          </div>
                        </div>
                        <div className="cf-field">
                          <label className="cf-label">LVR</label>
                          <div className="cf-input-display">
                            {((1 - parseCurrency(depositAmount) / parseCurrency(purchasePrice)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="cf-field">
                        <label className="cf-label">Current Value</label>
                        <input
                          type="text"
                          className="cf-input"
                          value={`$${parseCurrency(currentValue).toLocaleString()}`}
                          onChange={(e) => setCurrentValue(e.target.value)}
                        />
                      </div>
                      <div className="cf-field">
                        <label className="cf-label">Original Purchase Price</label>
                        <input
                          type="text"
                          className="cf-input"
                          value={`$${parseCurrency(originalPurchasePrice).toLocaleString()}`}
                          onChange={(e) => setOriginalPurchasePrice(e.target.value)}
                        />
                      </div>
                      <div className="cf-field">
                        <label className="cf-label">Current Loan Balance</label>
                        <input
                          type="text"
                          className="cf-input"
                          value={`$${parseCurrency(currentLoanBalance).toLocaleString()}`}
                          onChange={(e) => setCurrentLoanBalance(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  <button
                    className="cf-continue"
                    onClick={() => {
                      setPropertyComplete(true);
                      setExpandedSections(prev => {
                        const next = new Set(prev);
                        next.delete("property");
                        next.add("loan");
                        return next;
                      });
                    }}
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loan Details */}
          {propertyComplete && (
            <div className="cf-section">
              <button
                className="cf-section-header"
                onClick={() => toggleSection("loan")}
              >
                <span>Loan Details</span>
                {loanComplete && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="cf-edit-link"
                    onClick={(e) => { e.stopPropagation(); resetSection("loan"); }}
                  >
                    Edit
                  </span>
                )}
                {!loanComplete && (
                  expandedSections.has("loan") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                )}
              </button>

              {!loanComplete && expandedSections.has("loan") && (
                <div className="cf-section-content">
                  <div className="cf-field-row">
                    <div className="cf-field">
                      <label className="cf-label">Interest Rate (%)</label>
                      <input
                        type="text"
                        className="cf-input"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                      />
                    </div>
                    <div className="cf-field">
                      <label className="cf-label">Loan Term (years)</label>
                      <input
                        type="text"
                        className="cf-input"
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="cf-field">
                    <label className="cf-label">Loan Type</label>
                    <div className="cf-button-group">
                      <button
                        className={`cf-button-option ${loanType === "principal-interest" ? "active" : ""}`}
                        onClick={() => setLoanType("principal-interest")}
                      >
                        Principal & Interest
                      </button>
                      <button
                        className={`cf-button-option ${loanType === "interest-only" ? "active" : ""}`}
                        onClick={() => setLoanType("interest-only")}
                      >
                        Interest Only
                      </button>
                    </div>
                  </div>

                  {loanType === "interest-only" && (
                    <div className="cf-field">
                      <label className="cf-label">Interest Only Period (years)</label>
                      <input
                        type="text"
                        className="cf-input"
                        value={ioPeriod}
                        onChange={(e) => setIoPeriod(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="cf-toggle-row">
                    <label className="cf-toggle">
                      <input
                        type="checkbox"
                        checked={hasOffset}
                        onChange={(e) => setHasOffset(e.target.checked)}
                      />
                      <span className="cf-toggle-slider"></span>
                    </label>
                    <span className="cf-toggle-label">Offset Account</span>
                  </div>

                  {hasOffset && (
                    <div className="cf-field">
                      <label className="cf-label">Offset Balance</label>
                      <input
                        type="text"
                        className="cf-input"
                        value={`$${parseCurrency(offsetBalance).toLocaleString()}`}
                        onChange={(e) => setOffsetBalance(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="cf-field">
                    <label className="cf-label">Extra Repayments (monthly)</label>
                    <input
                      type="text"
                      className="cf-input"
                      value={`$${parseCurrency(extraRepayments).toLocaleString()}`}
                      onChange={(e) => setExtraRepayments(e.target.value)}
                    />
                  </div>

                  <button
                    className="cf-continue"
                    onClick={() => {
                      setLoanComplete(true);
                      setExpandedSections(prev => {
                        const next = new Set(prev);
                        next.delete("loan");
                        next.add("costs");
                        return next;
                      });
                    }}
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ongoing Costs */}
          {loanComplete && (
            <div className="cf-section">
              <button
                className="cf-section-header"
                onClick={() => toggleSection("costs")}
              >
                <span>Ongoing Costs</span>
                {costsComplete && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="cf-edit-link"
                    onClick={(e) => { e.stopPropagation(); resetSection("costs"); }}
                  >
                    Edit
                  </span>
                )}
                {!costsComplete && (
                  expandedSections.has("costs") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                )}
              </button>

              {!costsComplete && expandedSections.has("costs") && (
                <div className="cf-section-content">
                  <div className="cf-field-row">
                    <div className="cf-field">
                      <label className="cf-label">Council Rates (annual)</label>
                      <input
                        type="text"
                        className="cf-input"
                        value={`$${parseCurrency(councilRates).toLocaleString()}`}
                        onChange={(e) => setCouncilRates(e.target.value)}
                      />
                    </div>
                    <div className="cf-field">
                      <label className="cf-label">Water Rates (annual)</label>
                      <input
                        type="text"
                        className="cf-input"
                        value={`$${parseCurrency(waterRates).toLocaleString()}`}
                        onChange={(e) => setWaterRates(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="cf-field-row">
                    <div className="cf-field">
                      <label className="cf-label">Insurance (annual)</label>
                      <input
                        type="text"
                        className="cf-input"
                        value={`$${parseCurrency(insurance).toLocaleString()}`}
                        onChange={(e) => setInsurance(e.target.value)}
                      />
                    </div>
                    <div className="cf-field">
                      <label className="cf-label">Maintenance (% of value)</label>
                      <input
                        type="text"
                        className="cf-input"
                        value={maintenance}
                        onChange={(e) => setMaintenance(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="cf-toggle-row">
                    <label className="cf-toggle">
                      <input
                        type="checkbox"
                        checked={hasStrata}
                        onChange={(e) => setHasStrata(e.target.checked)}
                      />
                      <span className="cf-toggle-slider"></span>
                    </label>
                    <span className="cf-toggle-label">Strata Property</span>
                  </div>

                  {hasStrata && (
                    <div className="cf-field">
                      <label className="cf-label">Strata Fees (quarterly)</label>
                      <input
                        type="text"
                        className="cf-input"
                        value={`$${parseCurrency(strataFees).toLocaleString()}`}
                        onChange={(e) => setStrataFees(e.target.value)}
                      />
                    </div>
                  )}

                  <button
                    className="cf-continue"
                    onClick={() => {
                      setCostsComplete(true);
                      if (isInvestment) {
                        setExpandedSections(prev => {
                          const next = new Set(prev);
                          next.delete("costs");
                          next.add("rental");
                          return next;
                        });
                      }
                    }}
                  >
                    {isPPOR ? "Calculate" : "Continue"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Rental Income - Investment only */}
          {isInvestment && costsComplete && (
            <div className="cf-section">
              <button
                className="cf-section-header"
                onClick={() => toggleSection("rental")}
              >
                <span>Rental Income</span>
                {rentalComplete && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="cf-edit-link"
                    onClick={(e) => { e.stopPropagation(); resetSection("rental"); }}
                  >
                    Edit
                  </span>
                )}
                {!rentalComplete && (
                  expandedSections.has("rental") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                )}
              </button>

              {!rentalComplete && expandedSections.has("rental") && (
                <div className="cf-section-content">
                  <div className="cf-field">
                    <label className="cf-label">Weekly Rent</label>
                    <input
                      type="text"
                      className="cf-input"
                      value={`$${parseCurrency(weeklyRent).toLocaleString()}`}
                      onChange={(e) => setWeeklyRent(e.target.value)}
                    />
                  </div>

                  <div className="cf-field">
                    <label className="cf-label">Vacancy Rate (%)</label>
                    <input
                      type="text"
                      className="cf-input"
                      value={vacancyRate}
                      onChange={(e) => setVacancyRate(e.target.value)}
                    />
                  </div>

                  <div className="cf-toggle-row">
                    <label className="cf-toggle">
                      <input
                        type="checkbox"
                        checked={usePropertyManager}
                        onChange={(e) => setUsePropertyManager(e.target.checked)}
                      />
                      <span className="cf-toggle-slider"></span>
                    </label>
                    <span className="cf-toggle-label">Property Manager</span>
                  </div>

                  {usePropertyManager && (
                    <div className="cf-field">
                      <label className="cf-label">Management Fee (%)</label>
                      <input
                        type="text"
                        className="cf-input"
                        value={managementFee}
                        onChange={(e) => setManagementFee(e.target.value)}
                      />
                    </div>
                  )}

                  <button
                    className="cf-continue"
                    onClick={() => {
                      setRentalComplete(true);
                      setExpandedSections(prev => {
                        const next = new Set(prev);
                        next.delete("rental");
                        next.add("tax");
                        return next;
                      });
                    }}
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tax Profile - Investment only */}
          {isInvestment && rentalComplete && (
            <div className="cf-section">
              <button
                className="cf-section-header"
                onClick={() => toggleSection("tax")}
              >
                <span>Tax Profile</span>
                {taxComplete && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="cf-edit-link"
                    onClick={(e) => { e.stopPropagation(); resetSection("tax"); }}
                  >
                    Edit
                  </span>
                )}
                {!taxComplete && (
                  expandedSections.has("tax") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                )}
              </button>

              {!taxComplete && expandedSections.has("tax") && (
                <div className="cf-section-content">
                  <div className="cf-field">
                    <label className="cf-label">Taxable Income</label>
                    <input
                      type="text"
                      className="cf-input"
                      value={`$${parseCurrency(taxableIncome).toLocaleString()}`}
                      onChange={(e) => setTaxableIncome(e.target.value)}
                    />
                  </div>

                  <div className="cf-field">
                    <label className="cf-label">Depreciation (annual)</label>
                    <input
                      type="text"
                      className="cf-input"
                      value={`$${parseCurrency(depreciation).toLocaleString()}`}
                      onChange={(e) => setDepreciation(e.target.value)}
                    />
                  </div>

                  <div className="cf-field">
                    <label className="cf-label">Capital Growth Assumption (%)</label>
                    <input
                      type="text"
                      className="cf-input"
                      value={capitalGrowth}
                      onChange={(e) => setCapitalGrowth(e.target.value)}
                    />
                  </div>

                  <button
                    className="cf-continue"
                    onClick={() => setTaxComplete(true)}
                  >
                    Calculate
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT SIDE - OUTPUTS */}
      <main className="cf-main">
        {/* Placeholder when not complete */}
        {!allComplete && (
          <div className="cf-placeholder">
            <div className="cf-placeholder-content">
              <p className="cf-placeholder-title">Complete the form to see your analysis</p>
              <p className="cf-placeholder-subtitle">
                {!propertyUse && "Start by selecting property use"}
                {propertyUse && !purchaseMode && "Select purchase mode"}
                {purchaseMode && !propertyComplete && "Enter property details"}
                {propertyComplete && !loanComplete && "Enter loan details"}
                {loanComplete && !costsComplete && "Enter ongoing costs"}
                {isInvestment && costsComplete && !rentalComplete && "Enter rental income"}
                {isInvestment && rentalComplete && !taxComplete && "Enter tax profile"}
              </p>
            </div>
          </div>
        )}

        {/* Complete - Show outputs */}
        {allComplete && yearData.length > 0 && (() => {
          const sy = selectedYearData;
          const baseYear = new Date().getFullYear();

          // Column visibility flags
          const showOtherIncome = yearData.some(y => y.otherIncome !== 0);
          const showOffset = hasOffset && yearData.some(y => y.offsetBalanceAtYear > 0);

          // SVG chart dimensions
          const svgW = 900, svgH = 220;
          const mL = 60, mR = 20, mT = 30, mB = 35;
          const plotW = svgW - mL - mR;
          const plotH = svgH - mT - mB;
          const slotW = plotW / 30;
          const barW = slotW - 3;

          // Y scale - always include 0
          const vals = chartData.map(d => d.value);
          const dataMin = Math.min(...vals, 0);
          const dataMax = Math.max(...vals, 0);
          const range = dataMax - dataMin || 1;
          const pad = range * 0.12;
          const yMin = dataMin - pad;
          const yMax = dataMax + pad;
          const mapY = (v: number) => mT + (1 - (v - yMin) / (yMax - yMin)) * plotH;
          const zeroY = mapY(0);

          // Y-axis ticks
          const ySteps = 4;
          const yTicks = Array.from({ length: ySteps + 1 }, (_, i) => yMin + (yMax - yMin) * i / ySteps);

          // X-axis label years
          const xLabels = [1, 5, 10, 15, 20, 25, 30];

          // Gradient fill per mode
          const barFill = (val: number) => {
            if (effectiveViewMode === "summary" || effectiveViewMode === "property") return val >= 0 ? "url(#barGradPos)" : "url(#barGradNeg)";
            if (effectiveViewMode === "equity") return "url(#barGradTeal)";
            return "url(#barGradPurple)";
          };

          // Chart title
          const chartTitle = effectiveViewMode === "summary" ? "Monthly Net Cashflow"
            : effectiveViewMode === "property" ? "Monthly Property Cashflow"
            : effectiveViewMode === "equity" ? "Net Equity Position"
            : isInvestment ? "Total Annual Deductions" : "Total Annual Expenses";

          // Hovered year data for tooltip
          const hy = hoveredYear !== null ? yearData[hoveredYear - 1] : null;
          const hd = hoveredYear !== null ? chartData[hoveredYear - 1] : null;

          return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* MODE SELECTOR */}
            <div className="cf-mode-bar">
              {(["summary", "property", "equity", "deductions"] as ViewMode[]).map(m => (
                <button
                  key={m}
                  className={`cf-mode-btn ${effectiveViewMode === m ? "active" : ""}`}
                  onClick={() => { setViewMode(m); setSelectedYear(1); }}
                >
                  {m === "summary" ? "Summary" : m === "property" ? "Property" : m === "equity" ? "Equity" : (isInvestment ? "Deductions" : "Expenses")}
                </button>
              ))}
            </div>

            {/* CHART + KPI ROW */}
            <div className="cf-chart-kpi-row">
            {/* BAR CHART */}
            <section style={{ overflow: "hidden", borderRadius: "12px", border: "1px solid var(--cf-border)", background: "var(--cf-card)", flex: 1, minWidth: 0 }}>
              {/* Chart header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--cf-border)", padding: "16px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", height: "36px", width: "36px", alignItems: "center", justifyContent: "center", borderRadius: "8px", background: "rgba(45,212,191,0.1)" }}>
                    <TrendingUp style={{ height: "18px", width: "18px", color: "var(--cf-accent)" }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--cf-text)", margin: 0 }}>{chartTitle}</h2>
                    <p style={{ fontSize: "12px", color: "var(--cf-text-dim)", margin: 0 }}>
                      {isInvestment ? "Investment property" : "Owner-occupier"} analysis over 30 years
                    </p>
                  </div>
                </div>
                <span style={{ borderRadius: "9999px", background: "rgba(45,212,191,0.1)", padding: "4px 14px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "var(--cf-accent)" }}>
                  {isInvestment ? "Investment" : "PPOR"}
                </span>
              </div>

              {/* Chart SVG */}
              <div style={{ padding: "16px 24px", position: "relative" }}>
                <div style={{ position: "relative", width: "100%", height: "220px" }}>
                  <svg style={{ width: "100%", height: "100%" }} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none">
                    {/* Dot grid lines */}
                    {yTicks.map((v, i) => {
                      const y = mapY(v);
                      const dots = [];
                      for (let x = mL; x <= svgW - mR; x += 14) {
                        dots.push(<circle key={x} cx={x} cy={y} r={0.6} fill="rgba(255,255,255,0.07)" />);
                      }
                      return <g key={i}>{dots}</g>;
                    })}

                    {/* Zero line */}
                    {dataMin < 0 && dataMax > 0 && (
                      <line x1={mL} x2={svgW - mR} y1={zeroY} y2={zeroY}
                        stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                    )}

                    {/* Pill bars */}
                    {chartData.map((d, i) => {
                      const cx = mL + slotW * i + slotW / 2;
                      const pillW = slotW * 0.55;
                      const x = cx - pillW / 2;
                      const barTop = d.value >= 0 ? mapY(d.value) : zeroY;
                      const barBot = d.value >= 0 ? zeroY : mapY(d.value);
                      const barHeight = Math.max(1, barBot - barTop);
                      const isActive = d.year === selectedYear;
                      const isHovered = d.year === hoveredYear;

                      const barColor = (() => {
                        if (effectiveViewMode === "equity") return "#2dd4bf";
                        if (effectiveViewMode === "deductions") return "#a78bfa";
                        return d.value >= 0 ? "#2dd4bf" : "#f87171";
                      })();

                      return (
                        <g key={d.year}>
                          <rect x={x} y={barTop} width={pillW} height={barHeight}
                            rx={3} fill={barColor}
                            opacity={isActive || isHovered ? 0.85 : 0.5} />
                          {/* Active bar value label */}
                          {isActive && (
                            <text
                              x={cx}
                              y={d.value >= 0 ? mapY(d.value) - 8 : mapY(d.value) + 14}
                              textAnchor="middle" fill="var(--cf-text)" fontSize="10" fontWeight="600"
                              fontFamily="inherit"
                            >
                              {formatChartLabel(d.value)}
                            </text>
                          )}
                          {/* Click target */}
                          <rect x={mL + slotW * i} y={mT} width={slotW} height={plotH}
                            fill="transparent" cursor="pointer"
                            onClick={() => setSelectedYear(d.year)}
                            onMouseEnter={() => setHoveredYear(d.year)}
                            onMouseLeave={() => setHoveredYear(null)} />
                        </g>
                      );
                    })}

                    {/* Crossover marker */}
                    {(effectiveViewMode === "summary" || effectiveViewMode === "property") && (() => {
                      const crossIdx = chartData.findIndex(cd => cd.value >= 0);
                      if (crossIdx <= 0 || dataMin >= 0) return null;
                      const cx = mL + slotW * (crossIdx - 0.5) + slotW / 2;
                      return (
                        <g>
                          <polygon points={`${cx - 4},${zeroY + 10} ${cx + 4},${zeroY + 10} ${cx},${zeroY + 4}`}
                            fill="#2dd4bf" opacity={0.7} />
                          <text x={cx} y={zeroY + 20} textAnchor="middle"
                            fill="#2dd4bf" fontSize="9" fontFamily="inherit" fontWeight="500">
                            Crossover
                          </text>
                        </g>
                      );
                    })()}

                    {/* Y-axis labels */}
                    {yTicks.map((v, i) => (
                      <text key={i} x={mL - 10} y={mapY(v) + 4} textAnchor="end"
                        fill="var(--cf-text-dim)" fontSize="10" fontFamily="inherit" fontWeight="500">
                        {formatChartLabel(v)}
                      </text>
                    ))}

                    {/* X-axis labels */}
                    {xLabels.map(y => (
                      <text key={y} x={mL + slotW * (y - 1) + slotW / 2} y={svgH - 6} textAnchor="middle"
                        fill={selectedYear === y ? "var(--cf-accent)" : "var(--cf-text-dim)"}
                        fontSize="10" fontFamily="inherit" fontWeight={selectedYear === y ? "600" : "400"}>
                        {y}
                      </text>
                    ))}
                  </svg>

                  {/* Hover tooltip */}
                  {hoveredYear !== null && hy && hd && (
                    <div
                      className={`cf-chart-tooltip ${hoveredYear !== null ? "visible" : ""}`}
                      style={{
                        left: `${((mL + slotW * (hoveredYear - 1) + slotW / 2) / svgW) * 100}%`,
                        top: "8px",
                        transform: "translateX(-50%)",
                      }}
                    >
                      <div style={{ marginBottom: "4px", fontWeight: 600, color: "var(--cf-text)" }}>Year {hoveredYear}</div>
                      {effectiveViewMode === "summary" && (
                        <>
                          <div style={{ color: "var(--cf-text-muted)" }}>Rental Income: {formatCurrency(Math.round(hy.rentalIncome))}</div>
                          <div style={{ color: "var(--cf-text-muted)" }}>Holding Costs: {formatCurrency(Math.round(hy.totalExpenses))}</div>
                          <div style={{ color: "var(--cf-text-muted)" }}>Tax Saved: {formatCurrency(Math.round(hy.taxSaved))}</div>
                          <div style={{ color: "var(--cf-accent)", fontWeight: 600 }}>Net CF/mo: {formatCurrency(Math.round(hy.netCashflow / 12))}</div>
                        </>
                      )}
                      {effectiveViewMode === "property" && (
                        <>
                          {isInvestment && <div style={{ color: "var(--cf-text-muted)" }}>Rent: {formatCurrency(Math.round(hy.rentalIncome))}</div>}
                          <div style={{ color: "var(--cf-text-muted)" }}>Costs: {formatCurrency(Math.round(hy.interestPortion + hy.ongoingCosts))}</div>
                          {isInvestment && <div style={{ color: "#a78bfa" }}>Gearing: {formatCurrency(Math.round(hy.gearing))}</div>}
                          <div style={{ color: "var(--cf-accent)", fontWeight: 600 }}>Property CF/mo: {formatCurrency(Math.round(hy.propertyCashflow / 12))}</div>
                        </>
                      )}
                      {effectiveViewMode === "equity" && (
                        <>
                          <div style={{ color: "var(--cf-text-muted)" }}>Property: {formatCurrency(Math.round(hy.propertyValue))}</div>
                          <div style={{ color: "var(--cf-text-muted)" }}>Loan: {formatCurrency(Math.round(-hy.loanBalance))}</div>
                          {hy.offsetBalanceAtYear > 0 && <div style={{ color: "var(--cf-text-muted)" }}>Offset: {formatCurrency(Math.round(hy.offsetBalanceAtYear))}</div>}
                          <div style={{ color: "var(--cf-accent)", fontWeight: 600 }}>Net Equity: {formatCurrency(Math.round(hy.netEquity))}</div>
                        </>
                      )}
                      {effectiveViewMode === "deductions" && isInvestment && (
                        <>
                          <div style={{ color: "var(--cf-text-muted)" }}>Interest: {formatCurrency(Math.round(hy.interestPortion))}</div>
                          <div style={{ color: "var(--cf-text-muted)" }}>Ongoing: {formatCurrency(Math.round(hy.ongoingCosts))}</div>
                          <div style={{ color: "var(--cf-text-muted)" }}>Depreciation: {formatCurrency(Math.round(hy.depDiv43 + hy.depDiv40))}</div>
                          <div style={{ color: "#a78bfa", fontWeight: 600 }}>Total: {formatCurrency(Math.round(hy.totalDeductions))}</div>
                        </>
                      )}
                      {effectiveViewMode === "deductions" && !isInvestment && (
                        <>
                          <div style={{ color: "var(--cf-text-muted)" }}>Rates: {formatCurrency(Math.round(hy.councilRates + hy.waterRates))}</div>
                          <div style={{ color: "var(--cf-text-muted)" }}>Insurance: {formatCurrency(Math.round(hy.insurance))}</div>
                          <div style={{ color: "var(--cf-text-muted)" }}>Maint: {formatCurrency(Math.round(hy.maintenance + hy.strataFees))}</div>
                          <div style={{ color: "#a78bfa", fontWeight: 600 }}>Total: {formatCurrency(Math.round(hy.ongoingCosts))}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* KPI STRIP */}
            <div className="cf-kpi-strip">
              {effectiveViewMode === "summary" && (
                <>
                  <div className="cf-kpi-card">
                    <div className="cf-kpi-label">Year 1 Monthly</div>
                    <div className={`cf-kpi-value ${yearData[0].netCashflow < 0 ? "cf-negative" : "cf-positive"}`}>
                      {formatCurrency(Math.round(yearData[0].netCashflow / 12))}
                    </div>
                    <div className="cf-kpi-sub">{formatCurrency(Math.round(yearData[0].netCashflow))} annual</div>
                  </div>
                  <div className="cf-kpi-card">
                    <div className="cf-kpi-label">Year 30 Monthly</div>
                    <div className={`cf-kpi-value ${yearData[29].netCashflow < 0 ? "cf-negative" : "cf-positive"}`}>
                      {formatCurrency(Math.round(yearData[29].netCashflow / 12))}
                    </div>
                    <div className="cf-kpi-sub">{formatCurrency(Math.round(yearData[29].netCashflow))} annual</div>
                  </div>
                  <div className="cf-kpi-card">
                    <div className="cf-kpi-label">Year 1 Tax Saved</div>
                    <div className="cf-kpi-value cf-positive">
                      +{formatCurrency(Math.round(yearData[0].taxSaved))}
                    </div>
                    <div className="cf-kpi-sub">vs. no investment</div>
                  </div>
                </>
              )}
              {effectiveViewMode === "property" && (
                <>
                  <div className="cf-kpi-card">
                    <div className="cf-kpi-label">Year 1 Property CF/mo</div>
                    <div className={`cf-kpi-value ${yearData[0].propertyCashflow < 0 ? "cf-negative" : "cf-positive"}`}>
                      {formatCurrency(Math.round(yearData[0].propertyCashflow / 12))}
                    </div>
                    <div className="cf-kpi-sub">{formatCurrency(Math.round(yearData[0].propertyCashflow))} annual</div>
                  </div>
                  {isInvestment ? (
                    <div className="cf-kpi-card">
                      <div className="cf-kpi-label">Year 1 Gearing</div>
                      <div className={`cf-kpi-value ${yearData[0].gearing < 0 ? "cf-negative" : "cf-positive"}`}>
                        {formatCurrency(Math.round(yearData[0].gearing))}
                      </div>
                      <div className="cf-kpi-sub">{yearData[0].gearing < 0 ? "Negatively geared" : "Positively geared"}</div>
                    </div>
                  ) : (
                    <div className="cf-kpi-card">
                      <div className="cf-kpi-label">Total Interest</div>
                      <div className="cf-kpi-value cf-negative">
                        {formatCurrency(Math.round(yearData.reduce((s, y) => s + y.interestPortion, 0)))}
                      </div>
                      <div className="cf-kpi-sub">Over 30 years</div>
                    </div>
                  )}
                  <div className="cf-kpi-card">
                    <div className="cf-kpi-label">Total Interest</div>
                    <div className="cf-kpi-value cf-negative">
                      {formatCurrency(Math.round(yearData.reduce((s, y) => s + y.interestPortion, 0)))}
                    </div>
                    <div className="cf-kpi-sub">Over 30 years</div>
                  </div>
                </>
              )}
              {effectiveViewMode === "equity" && sy && (
                <>
                  <div className="cf-kpi-card">
                    <div className="cf-kpi-label">Net Equity</div>
                    <div className="cf-kpi-value cf-positive">{formatAbbreviated(sy.netEquity)}</div>
                    <div className="cf-kpi-sub">{formatCurrency(Math.round(sy.netEquity))}</div>
                  </div>
                  <div className="cf-kpi-card">
                    <div className="cf-kpi-label">LVR</div>
                    <div className="cf-kpi-value" style={{ color: "var(--cf-text)" }}>
                      {(sy.loanBalance / sy.propertyValue * 100).toFixed(1)}%
                    </div>
                    <div className="cf-kpi-sub">Loan-to-value ratio</div>
                  </div>
                  <div className="cf-kpi-card">
                    <div className="cf-kpi-label">Capital Growth</div>
                    <div className="cf-kpi-value cf-positive">
                      {formatAbbreviated(sy.propertyValue - propertyValue)}
                    </div>
                    <div className="cf-kpi-sub">{formatCurrency(Math.round(sy.propertyValue - propertyValue))}</div>
                  </div>
                </>
              )}
              {effectiveViewMode === "deductions" && sy && (
                <>
                  <div className="cf-kpi-card">
                    <div className="cf-kpi-label">{isInvestment ? "Total Deductions" : "Total Expenses"}</div>
                    <div className="cf-kpi-value" style={{ color: "#a78bfa" }}>
                      {formatCurrency(Math.round(isInvestment ? sy.totalDeductions : sy.ongoingCosts))}
                    </div>
                    <div className="cf-kpi-sub">Year {selectedYear}</div>
                  </div>
                  <div className="cf-kpi-card">
                    <div className="cf-kpi-label">{isInvestment ? "Holding Costs" : "Annual Expenses"}</div>
                    <div className="cf-kpi-value" style={{ color: "#f59e0b" }}>
                      {formatCurrency(Math.round(isInvestment ? sy.interestPortion + sy.ongoingCosts : sy.ongoingCosts))}
                    </div>
                    <div className="cf-kpi-sub">{isInvestment ? "Interest + expenses" : "Rates + insurance + maint."}</div>
                  </div>
                  {isInvestment ? (
                    <div className="cf-kpi-card">
                      <div className="cf-kpi-label">Depreciation</div>
                      <div className="cf-kpi-value" style={{ color: "#a78bfa" }}>
                        {formatCurrency(Math.round(sy.depDiv43 + sy.depDiv40))}
                      </div>
                      <div className="cf-kpi-sub">Div 43 + Div 40</div>
                    </div>
                  ) : (
                    <div className="cf-kpi-card">
                      <div className="cf-kpi-label">Year 30 Total</div>
                      <div className="cf-kpi-value" style={{ color: "#a78bfa" }}>
                        {formatCurrency(Math.round(yearData[29].ongoingCosts))}
                      </div>
                      <div className="cf-kpi-sub">Annual expenses</div>
                    </div>
                  )}
                </>
              )}
            </div>
            </div>{/* end cf-chart-kpi-row */}

            {/* DATA TABLE */}
            <div className="cf-table-wrap">
              {/* SUMMARY TABLE */}
              {effectiveViewMode === "summary" && (
                <table className="cf-data-table">
                  <thead>
                    <tr className="cf-col-header">
                      <th className="cf-col-center cf-col-year">Year</th>
                      <th className="cf-col-center cf-col-loan-yr">Cal. Year</th>
                      <th className="cf-group-divider">Salary</th>
                      {isInvestment && <th style={{ color: "rgba(45,212,191,0.6)" }}>Rental Income</th>}
                      <th style={{ fontWeight: 600 }}>Gross Income</th>
                      <th className="cf-group-divider" style={{ color: "rgba(167,139,250,0.55)" }}>Deductions</th>
                      <th style={{ color: "rgba(167,139,250,0.55)" }}>Taxable Income</th>
                      <th style={{ color: "rgba(167,139,250,0.55)" }}>Income Tax</th>
                      {isInvestment && <th style={{ color: "#a78bfa", fontWeight: 600 }}>Tax Saved</th>}
                      <th className="cf-group-divider" style={{ color: "rgba(45,212,191,0.6)" }}>After-Tax Income</th>
                      <th style={{ color: "rgba(245,158,11,0.55)" }}>Holding Costs</th>
                      <th style={{ color: "rgba(245,158,11,0.55)" }}>Loan Principal</th>
                      <th style={{ color: "var(--cf-text)", fontWeight: 700 }}>Net Cashflow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearData.map((y, i) => {
                      const holdingCosts = y.interestPortion + y.ongoingCosts;
                      return (
                        <tr
                          key={y.year}
                          className={y.year === selectedYear ? "cf-active-row" : ""}
                          onClick={() => setSelectedYear(y.year)}
                        >
                          <td className="cf-col-center">{y.year}</td>
                          <td className="cf-col-center">{baseYear + i}</td>
                          <td className="cf-group-divider">{formatCurrency(Math.round(y.salary))}</td>
                          {isInvestment && <td style={{ color: "var(--cf-accent)" }}>{formatCurrency(Math.round(y.rentalIncome))}</td>}
                          <td style={{ fontWeight: 700, color: "var(--cf-text)" }}>{formatCurrency(Math.round(y.grossIncome))}</td>
                          <td className="cf-group-divider cf-col-tax cf-negative">{formatCurrency(Math.round(-y.totalDeductionsForTax))}</td>
                          <td className="cf-col-tax">{formatCurrency(Math.round(y.taxableIncomeCalc))}</td>
                          <td className="cf-col-tax cf-negative">{formatCurrency(Math.round(-y.incomeTaxCalc))}</td>
                          {isInvestment && (
                            <td style={{ color: "#4ade80", fontWeight: 500 }}>+{formatCurrency(Math.round(y.taxSaved))}</td>
                          )}
                          <td className="cf-group-divider" style={{ color: "rgba(45,212,191,0.6)" }}>{formatCurrency(Math.round(y.afterTaxIncome))}</td>
                          <td className="cf-col-property cf-negative">{formatCurrency(Math.round(-holdingCosts))}</td>
                          <td className="cf-col-property cf-negative">{formatCurrency(Math.round(-y.principalPortion))}</td>
                          <td className="cf-col-cf-result" style={{ color: y.netCashflow < 0 ? "#f87171" : "#4ade80" }}>
                            {formatCurrency(Math.round(y.netCashflow))}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="cf-formula-row">
                      <td colSpan={2}></td>
                      <td colSpan={isInvestment ? 3 : 2} style={{ color: "rgba(45,212,191,0.4)", textAlign: "center" }}>
                        Salary + Rental = Gross
                      </td>
                      <td colSpan={isInvestment ? 4 : 3} style={{ color: "rgba(167,139,250,0.4)", textAlign: "center" }}>
                        Gross &minus; Ded. = Taxable &rarr; Tax
                      </td>
                      <td colSpan={4} style={{ color: "rgba(45,212,191,0.4)", textAlign: "center" }}>
                        After-Tax &minus; Costs &minus; Principal = Net CF
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* PROPERTY TABLE */}
              {effectiveViewMode === "property" && (
                <table className="cf-data-table">
                  <thead>
                    <tr className="cf-col-header">
                      <th className="cf-col-center cf-col-year">Year</th>
                      <th className="cf-col-center cf-col-loan-yr">Cal. Year</th>
                      {isInvestment && <th className="cf-group-divider" style={{ color: "rgba(45,212,191,0.6)" }}>Rental Income</th>}
                      {isInvestment ? (
                        <th style={{ color: "rgba(245,158,11,0.55)" }}>Holding Costs</th>
                      ) : (
                        <>
                          <th className="cf-group-divider" style={{ color: "rgba(245,158,11,0.55)" }}>Holding Costs</th>
                          <th style={{ color: "rgba(245,158,11,0.55)" }}>Loan Interest</th>
                          <th style={{ color: "rgba(245,158,11,0.55)" }}>Loan Principal</th>
                          <th style={{ color: "#f59e0b", fontWeight: 600 }}>Total Repayments</th>
                          <th style={{ color: "var(--cf-text)", fontWeight: 700 }}>Property Cashflow</th>
                        </>
                      )}
                      {isInvestment && <th className="cf-group-divider" style={{ color: "rgba(167,139,250,0.55)" }}>Depreciation</th>}
                      {isInvestment && <th style={{ color: "#a78bfa", fontWeight: 600 }}>Net Gearing</th>}
                      {isInvestment && <th className="cf-group-divider" style={{ color: "rgba(245,158,11,0.55)" }}>Loan Principal</th>}
                      {isInvestment && <th style={{ color: "var(--cf-text)", fontWeight: 700 }}>Property Cashflow</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {yearData.map((y, i) => {
                      const totalCosts = y.interestPortion + y.ongoingCosts;
                      const totalDep = y.depDiv43 + y.depDiv40;
                      return (
                        <tr
                          key={y.year}
                          className={y.year === selectedYear ? "cf-active-row" : ""}
                          onClick={() => setSelectedYear(y.year)}
                        >
                          <td className="cf-col-center">{y.year}</td>
                          <td className="cf-col-center">{baseYear + i}</td>
                          {isInvestment && (
                            <td className="cf-group-divider" style={{ color: "var(--cf-accent)" }}>{formatCurrency(Math.round(y.rentalIncome))}</td>
                          )}
                          {isInvestment ? (
                            <>
                              <td className="cf-col-property cf-negative">
                                {formatCurrency(Math.round(-totalCosts))}
                              </td>
                              <td className="cf-group-divider cf-col-tax cf-negative">{formatCurrency(Math.round(-totalDep))}</td>
                              <td style={{ color: y.gearing < 0 ? "#f87171" : "#4ade80", fontWeight: 600 }}>
                                {formatCurrency(Math.round(y.gearing))}
                              </td>
                              <td className="cf-group-divider cf-col-property cf-negative">
                                {formatCurrency(Math.round(-y.principalPortion))}
                              </td>
                              <td className="cf-col-cf-result" style={{ color: y.propertyCashflow < 0 ? "#f87171" : "#4ade80" }}>
                                {formatCurrency(Math.round(y.propertyCashflow))}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="cf-group-divider cf-col-property cf-negative">
                                {formatCurrency(Math.round(-y.ongoingCosts))}
                              </td>
                              <td className="cf-col-property cf-negative">
                                {formatCurrency(Math.round(-y.interestPortion))}
                              </td>
                              <td className="cf-col-property cf-negative">
                                {formatCurrency(Math.round(-y.principalPortion))}
                              </td>
                              <td className="cf-col-property-agg cf-negative">
                                {formatCurrency(Math.round(-(y.interestPortion + y.principalPortion)))}
                              </td>
                              <td className="cf-col-cf-result" style={{ color: y.propertyCashflow < 0 ? "#f87171" : "#4ade80" }}>
                                {formatCurrency(Math.round(y.propertyCashflow))}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                    <tr className="cf-formula-row">
                      <td colSpan={2}></td>
                      {isInvestment ? (
                        <>
                          <td colSpan={2}></td>
                          <td colSpan={2} style={{ color: "rgba(167,139,250,0.4)", textAlign: "center" }}>
                            Rent &minus; Costs &minus; Dep. = Gearing
                          </td>
                          <td colSpan={2} style={{ color: "rgba(45,212,191,0.4)", textAlign: "center" }}>
                            Rent &minus; Costs &minus; Principal = CF
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} style={{ color: "rgba(245,158,11,0.4)", textAlign: "center" }}>
                          Holding Costs + Repayments = Property CF
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              )}

              {/* EQUITY TABLE */}
              {effectiveViewMode === "equity" && (
                <table className="cf-data-table">
                  <thead>
                    <tr className="cf-col-header">
                      <th className="cf-col-center cf-col-year">Year</th>
                      <th className="cf-col-center cf-col-loan-yr">Cal. Year</th>
                      <th className="cf-group-divider" style={{ color: "rgba(245,158,11,0.55)" }}>Property Value</th>
                      <th style={{ color: "rgba(245,158,11,0.55)" }}>Property Growth</th>
                      <th className="cf-group-divider" style={{ color: "rgba(167,139,250,0.55)" }}>Loan Balance</th>
                      <th style={{ color: "#a78bfa", fontWeight: 600 }}>LVR</th>
                      {showOffset && <th className="cf-group-divider" style={{ color: "rgba(45,212,191,0.6)" }}>Offset Total</th>}
                      {showOffset && <th style={{ color: "rgba(45,212,191,0.6)" }}>Property Equity</th>}
                      <th style={{ color: "var(--cf-accent)", fontWeight: 700 }}>Net Equity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearData.map((y, i) => {
                      return (
                        <tr
                          key={y.year}
                          className={y.year === selectedYear ? "cf-active-row" : ""}
                          onClick={() => setSelectedYear(y.year)}
                        >
                          <td className="cf-col-center">{y.year}</td>
                          <td className="cf-col-center">{baseYear + i}</td>
                          <td className="cf-group-divider cf-col-property">{formatCurrency(Math.round(y.propertyValue))}</td>
                          <td className="cf-col-property" style={{ color: "#4ade80" }}>
                            +{formatCurrency(Math.round(y.propertyValue - propertyValue))}
                          </td>
                          <td className="cf-group-divider cf-negative">{formatCurrency(Math.round(-y.loanBalance))}</td>
                          <td className="cf-col-tax-agg">{(y.loanBalance / y.propertyValue * 100).toFixed(1)}%</td>
                          {showOffset && (
                            <td className="cf-group-divider" style={{ color: "var(--cf-accent)" }}>
                              {formatCurrency(Math.round(y.offsetBalanceAtYear))}
                            </td>
                          )}
                          {showOffset && (
                            <td style={{ color: "rgba(45,212,191,0.6)" }}>{formatCurrency(Math.round(y.propertyEquity))}</td>
                          )}
                          <td style={{ color: "var(--cf-accent)", fontWeight: 600 }}>
                            {formatCurrency(Math.round(y.netEquity))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* DEDUCTIONS / EXPENSES TABLE */}
              {effectiveViewMode === "deductions" && (
                <table className="cf-data-table">
                  <thead>
                    <tr className="cf-group-header">
                      <th colSpan={2}></th>
                      <th colSpan={isInvestment ? 5 : 4} style={{ color: "rgba(245,158,11,0.8)" }}>{isInvestment ? "Holding Costs" : "Expenses"}</th>
                      {isInvestment && <th colSpan={3} style={{ color: "rgba(167,139,250,0.8)" }}>Depreciation</th>}
                      <th style={{ color: "var(--cf-accent)" }}>Total</th>
                    </tr>
                    <tr className="cf-col-header">
                      <th className="cf-col-center cf-col-year">Year</th>
                      <th className="cf-col-center cf-col-loan-yr">Cal. Year</th>
                      {isInvestment && <th className="cf-group-divider" style={{ color: "rgba(245,158,11,0.55)" }}>Interest</th>}
                      <th className={isInvestment ? "" : "cf-group-divider"} style={{ color: "rgba(245,158,11,0.55)" }}>Rates</th>
                      <th style={{ color: "rgba(245,158,11,0.55)" }}>Insurance</th>
                      <th style={{ color: "rgba(245,158,11,0.55)" }}>Maint.</th>
                      <th style={{ color: "#f59e0b", fontWeight: 600 }}>Total</th>
                      {isInvestment && <th className="cf-group-divider" style={{ color: "rgba(167,139,250,0.55)" }}>Div 43</th>}
                      {isInvestment && <th style={{ color: "rgba(167,139,250,0.55)" }}>Div 40</th>}
                      {isInvestment && <th style={{ color: "#a78bfa", fontWeight: 600 }}>Total</th>}
                      <th className="cf-group-divider" style={{ color: "var(--cf-accent)", fontWeight: 700 }}>
                        {isInvestment ? "Total Ded." : "Total Exp."}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearData.map((y, i) => {
                      const holdingTotal = isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts;
                      const depTotal = y.depDiv43 + y.depDiv40;
                      const grandTotal = isInvestment ? holdingTotal + depTotal : holdingTotal;
                      return (
                        <tr
                          key={y.year}
                          className={y.year === selectedYear ? "cf-active-row" : ""}
                          onClick={() => setSelectedYear(y.year)}
                        >
                          <td className="cf-col-center">{y.year}</td>
                          <td className="cf-col-center">{baseYear + i}</td>
                          {isInvestment && <td className="cf-group-divider cf-col-property">{formatCurrency(Math.round(y.interestPortion))}</td>}
                          <td className={isInvestment ? "cf-col-property" : "cf-group-divider cf-col-property"}>{formatCurrency(Math.round(y.councilRates + y.waterRates))}</td>
                          <td className="cf-col-property">{formatCurrency(Math.round(y.insurance))}</td>
                          <td className="cf-col-property">{formatCurrency(Math.round(y.maintenance + y.strataFees))}</td>
                          <td className="cf-col-property-agg">{formatCurrency(Math.round(holdingTotal))}</td>
                          {isInvestment && <td className="cf-group-divider cf-col-tax">{formatCurrency(Math.round(y.depDiv43))}</td>}
                          {isInvestment && <td className="cf-col-tax">{formatCurrency(Math.round(y.depDiv40))}</td>}
                          {isInvestment && <td className="cf-col-tax-agg">{formatCurrency(Math.round(depTotal))}</td>}
                          <td className="cf-group-divider" style={{ color: "var(--cf-accent)", fontWeight: 600 }}>
                            {formatCurrency(Math.round(grandTotal))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          );
        })()}
      </main>
    </div>
    <Link
      href="/"
      className="group flex items-center justify-center gap-2 py-4 text-[14px] font-medium tracking-wide text-muted/30 no-underline transition-colors duration-300 hover:text-accent/70"
    >
      <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">&larr;</span>
      Return to Dashboard
    </Link>
    </>
  );
}
