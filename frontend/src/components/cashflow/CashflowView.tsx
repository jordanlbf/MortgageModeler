"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import "./cashflow.css";

// ============================================================================
// TYPES
// ============================================================================

type PropertyUse = "investment" | "ppor";
type PurchaseMode = "new" | "existing";
type LoanType = "principal-interest" | "interest-only";
type ChartMetric = "cashflow" | "equity" | "gearing" | "netIncome" | "taxBenefit";

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

function calculateStampDuty(purchasePrice: number, isInvestment: boolean): number {
  // NSW stamp duty brackets (simplified)
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
  // Add investor surcharge (simplified)
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
  const [chartMetric, setChartMetric] = useState<ChartMetric>("cashflow");
  const [selectedYear, setSelectedYear] = useState(1);
  const [expandedOutputSections, setExpandedOutputSections] = useState<Set<string>>(new Set(["income", "holding", "tax"]));

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["propertyUse"]));

  // Derived values
  const isInvestment = propertyUse === "investment";
  const isPPOR = propertyUse === "ppor";
  const isNewPurchase = purchaseMode === "new";

  const allComplete = isInvestment
    ? propertyComplete && loanComplete && costsComplete && rentalComplete && taxComplete
    : propertyComplete && loanComplete && costsComplete;

  // Calculate loan amount
  const loanAmount = isNewPurchase
    ? parseCurrency(purchasePrice) - parseCurrency(depositAmount)
    : parseCurrency(currentLoanBalance);

  const propertyValue = isNewPurchase
    ? parseCurrency(purchasePrice)
    : parseCurrency(currentValue);

  // Calculate all year data
  const yearData = useMemo((): YearData[] => {
    if (!allComplete) return [];

    const data: YearData[] = [];
    const rate = parseFloat(interestRate) || 6.5;
    const term = parseInt(loanTerm) || 30;
    const ioPeriodYears = loanType === "interest-only" ? parseInt(ioPeriod) || 5 : 0;
    const growth = parseFloat(capitalGrowth) || 3.5;
    const taxRate = getMarginalTaxRate(parseCurrency(taxableIncome)) + 0.02; // include Medicare Levy
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

      // Rental income calculations (investment only)
      const rental = isInvestment ? annualRent : 0;
      const vacancy = isInvestment ? rental * vacRate : 0;
      const mgmt = isInvestment ? (rental - vacancy) * mgmtFee : 0;
      const netRental = rental - vacancy - mgmt;

      // Loan repayment calculations
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
        // Approximate interest/principal split
        const avgBalance = (calculateLoanBalanceAtYear(loanAmount - effectiveOffset, rate, term, year - 1, loanType, ioPeriodYears) + loanBal) / 2;
        interestPaid = avgBalance * (rate / 100);
        principalPaid = annualRepayment - interestPaid;
      }

      // Property costs
      const annualMaintenance = propValue * maintenanceRate;
      // Holding costs = interest + running costs (excludes principal)
      const totalExpenses = interestPaid + annualCouncil + annualWater + annualInsurance + annualMaintenance + annualStrata;

      // Pre-tax cashflow
      const preTax = netRental - totalExpenses;

      // Total deductible expenses (investment only)
      const depDiv43 = isInvestment ? annualDepreciation * 0.5 : 0;
      const depDiv40 = isInvestment ? annualDepreciation * 0.5 : 0;
      const otherDeductibles = isInvestment ? (annualCouncil + annualWater + annualInsurance + annualMaintenance + annualStrata + mgmt) : 0;
      const totalDeductions = isInvestment ? (interestPaid + depDiv43 + depDiv40 + otherDeductibles) : 0;
      const rentalLossOrGain = isInvestment ? netRental - totalDeductions : 0;
      const taxBenefitAmt = (isInvestment && rentalLossOrGain < 0) ? Math.abs(rentalLossOrGain) * taxRate : 0;
      const afterTaxCashflow = preTax + taxBenefitAmt;

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
      });
    }

    return data;
  }, [
    allComplete, propertyValue, loanAmount, interestRate, loanTerm, loanType, ioPeriod,
    capitalGrowth, taxableIncome, weeklyRent, vacancyRate, usePropertyManager, managementFee,
    depreciation, councilRates, waterRates, insurance, maintenance, hasStrata, strataFees,
    hasOffset, offsetBalance, extraRepayments, isInvestment
  ]);

  // Effective chart metric (PPOR forces equity)
  const effectiveMetric = isPPOR ? "equity" : chartMetric;

  // Chart data for single-line metrics
  const chartData = useMemo(() => {
    if (yearData.length === 0) return [];
    return yearData.map(y => {
      switch (effectiveMetric) {
        case "cashflow": return { year: y.year, value: y.afterTaxCashflow / 12 };
        case "equity": return { year: y.year, value: y.equity };
        case "netIncome": return { year: y.year, value: y.netRentalIncome / 12 };
        case "taxBenefit": return { year: y.year, value: y.taxBenefit };
        default: return { year: y.year, value: 0 };
      }
    });
  }, [yearData, effectiveMetric]);

  // Gearing data (two lines)
  const gearingData = useMemo(() => {
    if (yearData.length === 0) return { income: [], deductions: [] };
    return {
      income: yearData.map(y => ({ year: y.year, value: y.netRentalIncome })),
      deductions: yearData.map(y => ({ year: y.year, value: y.totalDeductions })),
    };
  }, [yearData]);

  // Selected year data for breakdown
  const selectedYearData = yearData[selectedYear - 1] || null;

  // Marginal rate for display
  const marginalRate = getMarginalTaxRate(parseCurrency(taxableIncome));
  const taxRate = marginalRate + 0.02;

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

  const toggleOutputSection = (section: string) => {
    setExpandedOutputSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
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
          // SVG chart dimensions
          const svgW = 860, svgH = 220;
          const mL = 45, mR = 10, mT = 10, mB = 25;
          const plotW = svgW - mL - mR;
          const plotH = svgH - mT - mB;
          const mapX = (year: number) => mL + (year - 1) / 29 * plotW;

          // Chart rendering helpers
          const isGearing = effectiveMetric === "gearing";
          const activeData = isGearing ? [] : chartData;
          const allVals = isGearing
            ? [...gearingData.income.map(d => d.value), ...gearingData.deductions.map(d => d.value)]
            : activeData.map(d => d.value);
          const dataMin = allVals.length > 0 ? Math.min(...allVals) : 0;
          const dataMax = allVals.length > 0 ? Math.max(...allVals) : 1;
          const range = dataMax - dataMin || 1;
          const pad = range * 0.1;
          const yMin = dataMin - pad;
          const yMax = dataMax + pad;
          const mapY = (v: number) => mT + (1 - (v - yMin) / (yMax - yMin)) * plotH;

          // Polyline points
          const linePoints = activeData.map(d => `${mapX(d.year)},${mapY(d.value)}`).join(" ");

          // Area fill path (line → zero → close)
          const zeroY = mapY(0);
          const areaPath = activeData.length > 0
            ? `M ${mapX(1)},${mapY(activeData[0].value)} ${activeData.slice(1).map(d => `L ${mapX(d.year)},${mapY(d.value)}`).join(" ")} L ${mapX(30)},${zeroY} L ${mapX(1)},${zeroY} Z`
            : "";

          // Gearing polylines
          const incomePoints = gearingData.income.map(d => `${mapX(d.year)},${mapY(d.value)}`).join(" ");
          const deductionPoints = gearingData.deductions.map(d => `${mapX(d.year)},${mapY(d.value)}`).join(" ");

          // Zero crossover detection
          let crossoverYear: number | null = null;
          let crossoverLabel = "";
          if (isGearing) {
            for (let i = 1; i < gearingData.income.length; i++) {
              const prevDiff = gearingData.income[i - 1].value - gearingData.deductions[i - 1].value;
              const currDiff = gearingData.income[i].value - gearingData.deductions[i].value;
              if (prevDiff < 0 && currDiff >= 0) {
                const ratio = Math.abs(prevDiff) / (Math.abs(prevDiff) + currDiff);
                crossoverYear = gearingData.income[i - 1].year + ratio;
                crossoverLabel = `Positively geared: Year ${Math.ceil(crossoverYear)}`;
                break;
              }
            }
          } else if (effectiveMetric === "cashflow") {
            for (let i = 1; i < activeData.length; i++) {
              if (activeData[i - 1].value < 0 && activeData[i].value >= 0) {
                const ratio = Math.abs(activeData[i - 1].value) / (Math.abs(activeData[i - 1].value) + activeData[i].value);
                crossoverYear = activeData[i - 1].year + ratio;
                crossoverLabel = `Cashflow positive: Year ${Math.ceil(crossoverYear)}`;
                break;
              }
            }
          }

          // Y-axis ticks
          const yTicks: number[] = [yMin, yMax];
          if (yMin < 0 && yMax > 0) yTicks.push(0);
          yTicks.sort((a, b) => a - b);

          // Grid line at zero
          const showZeroLine = yMin < 0 && yMax > 0;

          // X-axis label years
          const xLabels = [1, 5, 10, 15, 20, 25, 30];

          // Footer stat helper
          const yr = (n: number) => yearData[Math.min(n - 1, yearData.length - 1)];
          const cashflowCrossoverYear = yearData.findIndex(y => y.afterTaxCashflow > 0) + 1 || null;
          const cumulativeOutlay = yearData.reduce((sum, y) => sum + (y.afterTaxCashflow < 0 ? y.afterTaxCashflow : 0), 0);
          const peakDeductions = Math.max(...yearData.map(y => y.totalDeductions));
          const peakTaxBenefit = Math.max(...yearData.map(y => y.taxBenefit));
          const taxBenefitEndsYear = (() => { for (let i = yearData.length - 1; i >= 0; i--) { if (yearData[i].taxBenefit > 0) return i + 1; } return null; })();
          const lifetimeTaxBenefit = yearData.reduce((sum, y) => sum + y.taxBenefit, 0);

          // Breakdown selected year
          const sy = selectedYearData;

          // Cash invested for cash-on-cash
          const totalCashInvested = isNewPurchase
            ? parseCurrency(depositAmount) + calculateStampDuty(parseCurrency(purchasePrice), isInvestment) + 5000
            : (sy ? sy.equity : 0);
          const cashOnCash = sy && totalCashInvested > 0 ? (sy.afterTaxCashflow / totalCashInvested * 100) : 0;

          // Chart metric labels
          const metricLabels: Record<ChartMetric, string> = { cashflow: "Cashflow", equity: "Equity", gearing: "Gearing", netIncome: "Net Income", taxBenefit: "Tax Benefit" };

          return (
          <div className="cf-outputs">
            {/* ============================================================ */}
            {/* HERO CHART CARD                                              */}
            {/* ============================================================ */}
            <div className="cf-card">
              <div className="cf-hero-header">
                <div className="cf-hero-header-left">
                  <span className="cf-hero-title">{isInvestment ? "Investment" : "Owner-Occupier"} Projections</span>
                  <span className={`cf-tag ${isInvestment ? "cf-tag-investment" : "cf-tag-ppor"}`}>
                    {isInvestment ? "INVESTMENT" : "PPOR"}
                  </span>
                </div>
                <div className="cf-chart-toggles">
                  {isPPOR ? (
                    <button className="cf-chart-toggle active">Equity</button>
                  ) : (
                    (["cashflow", "equity", "gearing", "netIncome", "taxBenefit"] as ChartMetric[]).map(m => (
                      <button
                        key={m}
                        className={`cf-chart-toggle ${effectiveMetric === m ? "active" : ""}`}
                        onClick={() => setChartMetric(m)}
                      >
                        {metricLabels[m]}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="cf-chart-area">
                <div className="cf-chart-container">
                  <svg className="cf-chart-svg" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none">
                    <defs>
                      <clipPath id="clip-above-zero">
                        <rect x={mL} y={0} width={plotW} height={Math.max(0, zeroY)} />
                      </clipPath>
                      <clipPath id="clip-below-zero">
                        <rect x={mL} y={Math.max(0, zeroY)} width={plotW} height={svgH - Math.max(0, zeroY)} />
                      </clipPath>
                      <linearGradient id="grad-pos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="grad-neg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171" stopOpacity="0" />
                        <stop offset="100%" stopColor="#f87171" stopOpacity="0.08" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal grid lines */}
                    {yTicks.map((v, i) => (
                      <line key={i} x1={mL} x2={svgW - mR} y1={mapY(v)} y2={mapY(v)}
                        stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                    ))}
                    {showZeroLine && (
                      <line x1={mL} x2={svgW - mR} y1={zeroY} y2={zeroY}
                        stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4,3" />
                    )}

                    {/* Y-axis labels */}
                    {yTicks.map((v, i) => (
                      <text key={i} x={mL - 6} y={mapY(v) + 3} textAnchor="end"
                        fill="var(--cf-text-dim)" fontSize="10" fontFamily="inherit">
                        {formatChartLabel(v)}
                      </text>
                    ))}

                    {/* X-axis labels */}
                    {xLabels.map(y => (
                      <text key={y} x={mapX(y)} y={svgH - 5} textAnchor="middle"
                        fill="var(--cf-text-dim)" fontSize="10" fontFamily="inherit">
                        {y}
                      </text>
                    ))}

                    {!isGearing && activeData.length > 0 && (
                      <>
                        {/* Positive area fill */}
                        <path d={areaPath} clipPath="url(#clip-above-zero)" fill="url(#grad-pos)" />
                        {/* Negative area fill */}
                        <path d={areaPath} clipPath="url(#clip-below-zero)" fill="url(#grad-neg)" />
                        {/* Line */}
                        <polyline points={linePoints} stroke="#2dd4bf" strokeWidth="2" fill="none" />
                      </>
                    )}

                    {isGearing && gearingData.income.length > 0 && (
                      <>
                        <polyline points={incomePoints} stroke="#4ade80" strokeWidth="2" fill="none" />
                        <polyline points={deductionPoints} stroke="#f87171" strokeWidth="2" fill="none" />
                      </>
                    )}

                    {/* Crossover marker */}
                    {crossoverYear !== null && (
                      <circle cx={mapX(crossoverYear)} cy={isGearing
                        ? mapY(gearingData.income[Math.floor(crossoverYear) - 1]?.value ?? 0)
                        : zeroY}
                        r="4" fill="#2dd4bf" />
                    )}
                  </svg>

                  {/* Annotation overlay */}
                  {crossoverYear !== null && (
                    <div
                      className="cf-chart-annotation"
                      style={{
                        left: `${(mapX(crossoverYear) / svgW) * 100}%`,
                        top: `${((isGearing
                          ? mapY(gearingData.income[Math.floor(crossoverYear) - 1]?.value ?? 0)
                          : zeroY) / svgH) * 100}%`,
                        transform: "translate(8px, -50%)",
                      }}
                    >
                      <span className="cf-chart-annotation-dot" />
                      {crossoverLabel}
                    </div>
                  )}
                </div>
              </div>

              {/* Chart Footer Stats */}
              <div className="cf-chart-footer">
                {effectiveMetric === "cashflow" && (
                  <>
                    <div className="cf-chart-stat">
                      <p className="cf-chart-stat-label">Year 1 Monthly</p>
                      <p className={`cf-chart-stat-value ${yr(1).afterTaxCashflow < 0 ? "cf-negative" : "cf-positive"}`}>
                        {formatCurrency(Math.round(yr(1).afterTaxCashflow / 12))}
                      </p>
                    </div>
                    <div className="cf-chart-stat">
                      <p className="cf-chart-stat-label">Crossover</p>
                      <p className="cf-chart-stat-value cf-positive">
                        {cashflowCrossoverYear ? `Year ${cashflowCrossoverYear}` : "N/A"}
                      </p>
                    </div>
                    <div className="cf-chart-stat">
                      <p className="cf-chart-stat-label">Year 30 Monthly</p>
                      <p className={`cf-chart-stat-value ${yr(30).afterTaxCashflow < 0 ? "cf-negative" : "cf-positive"}`}>
                        {formatCurrency(Math.round(yr(30).afterTaxCashflow / 12))}
                      </p>
                    </div>
                    <div className="cf-chart-stat">
                      <p className="cf-chart-stat-label">Cumulative Outlay</p>
                      <p className="cf-chart-stat-value cf-negative">{formatCurrency(Math.round(cumulativeOutlay))}</p>
                    </div>
                  </>
                )}
                {effectiveMetric === "equity" && (
                  <>
                    {[1, 10, 20, 30].map(y => (
                      <div key={y} className="cf-chart-stat">
                        <p className="cf-chart-stat-label">Year {y}</p>
                        <p className="cf-chart-stat-value cf-positive">{formatAbbreviated(yr(y).equity)}</p>
                      </div>
                    ))}
                  </>
                )}
                {effectiveMetric === "gearing" && (
                  <>
                    <div className="cf-chart-stat">
                      <p className="cf-chart-stat-label">Year 1 Loss</p>
                      <p className="cf-chart-stat-value cf-negative">{formatCurrency(Math.round(yr(1).rentalLossOrGain))}</p>
                    </div>
                    <div className="cf-chart-stat">
                      <p className="cf-chart-stat-label">Crossover Year</p>
                      <p className="cf-chart-stat-value cf-positive">{crossoverYear ? `Year ${Math.ceil(crossoverYear)}` : "N/A"}</p>
                    </div>
                    <div className="cf-chart-stat">
                      <p className="cf-chart-stat-label">Year 30 Position</p>
                      <p className={`cf-chart-stat-value ${yr(30).rentalLossOrGain < 0 ? "cf-negative" : "cf-positive"}`}>
                        {formatCurrency(Math.round(yr(30).rentalLossOrGain))}
                      </p>
                    </div>
                    <div className="cf-chart-stat">
                      <p className="cf-chart-stat-label">Peak Deductions</p>
                      <p className="cf-chart-stat-value">{formatCurrency(Math.round(peakDeductions))}</p>
                    </div>
                  </>
                )}
                {effectiveMetric === "netIncome" && (
                  <>
                    {[1, 10, 20, 30].map(y => (
                      <div key={y} className="cf-chart-stat">
                        <p className="cf-chart-stat-label">Year {y}/mo</p>
                        <p className="cf-chart-stat-value">{formatCurrency(Math.round(yr(y).netRentalIncome / 12))}</p>
                      </div>
                    ))}
                  </>
                )}
                {effectiveMetric === "taxBenefit" && (
                  <>
                    <div className="cf-chart-stat">
                      <p className="cf-chart-stat-label">Year 1</p>
                      <p className="cf-chart-stat-value cf-positive">{formatCurrency(Math.round(yr(1).taxBenefit))}</p>
                    </div>
                    <div className="cf-chart-stat">
                      <p className="cf-chart-stat-label">Peak Benefit</p>
                      <p className="cf-chart-stat-value cf-positive">{formatCurrency(Math.round(peakTaxBenefit))}</p>
                    </div>
                    <div className="cf-chart-stat">
                      <p className="cf-chart-stat-label">Ends Year</p>
                      <p className="cf-chart-stat-value">{taxBenefitEndsYear ?? "N/A"}</p>
                    </div>
                    <div className="cf-chart-stat">
                      <p className="cf-chart-stat-label">Lifetime Total</p>
                      <p className="cf-chart-stat-value cf-positive">{formatCurrency(Math.round(lifetimeTaxBenefit))}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ============================================================ */}
            {/* CASHFLOW BREAKDOWN CARD                                      */}
            {/* ============================================================ */}
            {sy && (
            <div className="cf-card">
              <div className="cf-breakdown-header">
                <span className="cf-breakdown-title">Cashflow Breakdown</span>
                <div className="cf-chart-toggles">
                  {[1, 5, 10, 20, 30].map(y => (
                    <button
                      key={y}
                      className={`cf-chart-toggle ${selectedYear === y ? "active" : ""}`}
                      onClick={() => setSelectedYear(y)}
                    >
                      Year {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Strip */}
              <div className={`cf-summary-strip${isPPOR ? " ppor" : ""}`}>
                <div className="cf-summary-cell">
                  <p className="cf-summary-label">After-Tax Cashflow</p>
                  <p className={`cf-summary-value ${sy.afterTaxCashflow < 0 ? "cf-negative" : "cf-positive"}`}>
                    {formatCurrency(Math.round(sy.afterTaxCashflow))}
                  </p>
                  <p className="cf-summary-sub">{formatCurrency(Math.round(sy.afterTaxCashflow / 12))}/mo</p>
                </div>
                <div className="cf-summary-cell">
                  <p className="cf-summary-label">Pre-Tax Cashflow</p>
                  <p className={`cf-summary-value ${sy.preTaxCashflow < 0 ? "cf-negative" : "cf-positive"}`}>
                    {formatCurrency(Math.round(sy.preTaxCashflow))}
                  </p>
                  <p className="cf-summary-sub">{formatCurrency(Math.round(sy.preTaxCashflow / 12))}/mo</p>
                </div>
                {isInvestment && (
                  <>
                    <div className="cf-summary-cell">
                      <p className="cf-summary-label">Tax Benefit</p>
                      <p className="cf-summary-value cf-positive">{formatCurrency(Math.round(sy.taxBenefit))}</p>
                      <p className="cf-summary-sub">at {(marginalRate * 100).toFixed(0)}% + 2% ML</p>
                    </div>
                    <div className="cf-summary-cell">
                      <p className="cf-summary-label">Gearing Position</p>
                      <p className={`cf-summary-value ${sy.rentalLossOrGain < 0 ? "cf-negative" : "cf-positive"}`}>
                        {formatCurrency(Math.round(sy.rentalLossOrGain))}
                      </p>
                      <p className="cf-summary-sub">{sy.rentalLossOrGain < 0 ? "negatively geared" : "positively geared"}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Column Headers */}
              <div className="cf-col-headers">
                <span className="cf-col-header">Monthly</span>
                <span className="cf-col-header">Annual</span>
              </div>

              {/* ---- Income Section (investment only) ---- */}
              {isInvestment && (
                <div className="cf-detail-section">
                  <button
                    className={`cf-section-trigger${expandedOutputSections.has("income") ? " open" : ""}`}
                    onClick={() => toggleOutputSection("income")}
                  >
                    <div className="cf-section-trigger-left">
                      <ChevronRight size={16} className="cf-section-chevron" />
                      <span className="cf-section-name">Income</span>
                    </div>
                    <div className="cf-section-totals">
                      <div className="cf-section-total-item">
                        <p className="cf-section-total-value">{formatCurrency(Math.round(sy.netRentalIncome / 12))}</p>
                      </div>
                      <div className="cf-section-total-item">
                        <p className="cf-section-total-value">{formatCurrency(Math.round(sy.netRentalIncome))}</p>
                      </div>
                    </div>
                  </button>
                  {expandedOutputSections.has("income") && (
                    <div className="cf-detail-content">
                      <div className="cf-detail-row">
                        <span className="cf-detail-row-label">Gross Rental Income</span>
                        <div className="cf-detail-row-values">
                          <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.rentalIncome / 12))}</span>
                          <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.rentalIncome))}</span>
                        </div>
                      </div>
                      <div className="cf-detail-row">
                        <span className="cf-detail-row-label">Less: Vacancy ({vacancyRate}%)</span>
                        <div className="cf-detail-row-values">
                          <span className="cf-detail-row-val">{formatCurrency(-Math.round(sy.vacancy / 12))}</span>
                          <span className="cf-detail-row-val">{formatCurrency(-Math.round(sy.vacancy))}</span>
                        </div>
                      </div>
                      {usePropertyManager && (
                        <div className="cf-detail-row">
                          <span className="cf-detail-row-label">Less: Management Fee ({managementFee}%)</span>
                          <div className="cf-detail-row-values">
                            <span className="cf-detail-row-val">{formatCurrency(-Math.round(sy.managementFee / 12))}</span>
                            <span className="cf-detail-row-val">{formatCurrency(-Math.round(sy.managementFee))}</span>
                          </div>
                        </div>
                      )}
                      <div className="cf-detail-row subtotal">
                        <span className="cf-detail-row-label">Net Rental Income</span>
                        <div className="cf-detail-row-values">
                          <span className="cf-detail-row-val primary">{formatCurrency(Math.round(sy.netRentalIncome / 12))}</span>
                          <span className="cf-detail-row-val primary">{formatCurrency(Math.round(sy.netRentalIncome))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---- Holding Costs Section ---- */}
              <div className="cf-detail-section">
                <button
                  className={`cf-section-trigger${expandedOutputSections.has("holding") ? " open" : ""}`}
                  onClick={() => toggleOutputSection("holding")}
                >
                  <div className="cf-section-trigger-left">
                    <ChevronRight size={16} className="cf-section-chevron" />
                    <span className="cf-section-name">Holding Costs</span>
                  </div>
                  <div className="cf-section-totals">
                    <div className="cf-section-total-item">
                      <p className="cf-section-total-value">{formatCurrency(Math.round(sy.totalExpenses / 12))}</p>
                    </div>
                    <div className="cf-section-total-item">
                      <p className="cf-section-total-value">{formatCurrency(Math.round(sy.totalExpenses))}</p>
                    </div>
                  </div>
                </button>
                {expandedOutputSections.has("holding") && (
                  <div className="cf-detail-content">
                    <div className="cf-detail-row">
                      <span className="cf-detail-row-label">Interest on Loan</span>
                      <div className="cf-detail-row-values">
                        <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.interestPortion / 12))}</span>
                        <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.interestPortion))}</span>
                      </div>
                    </div>
                    <div className="cf-detail-row">
                      <span className="cf-detail-row-label indent">Principal Repaid</span>
                      <div className="cf-detail-row-values">
                        <span className="cf-detail-row-val" style={{ fontSize: 12, color: "var(--cf-text-dim)" }}>{formatCurrency(Math.round(sy.principalPortion / 12))}</span>
                        <span className="cf-detail-row-val" style={{ fontSize: 12, color: "var(--cf-text-dim)" }}>{formatCurrency(Math.round(sy.principalPortion))}</span>
                      </div>
                    </div>
                    <div className="cf-detail-row">
                      <span className="cf-detail-row-label">Council Rates</span>
                      <div className="cf-detail-row-values">
                        <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.councilRates / 12))}</span>
                        <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.councilRates))}</span>
                      </div>
                    </div>
                    <div className="cf-detail-row">
                      <span className="cf-detail-row-label">Water Rates</span>
                      <div className="cf-detail-row-values">
                        <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.waterRates / 12))}</span>
                        <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.waterRates))}</span>
                      </div>
                    </div>
                    <div className="cf-detail-row">
                      <span className="cf-detail-row-label">Insurance</span>
                      <div className="cf-detail-row-values">
                        <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.insurance / 12))}</span>
                        <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.insurance))}</span>
                      </div>
                    </div>
                    <div className="cf-detail-row">
                      <span className="cf-detail-row-label">Maintenance</span>
                      <div className="cf-detail-row-values">
                        <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.maintenance / 12))}</span>
                        <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.maintenance))}</span>
                      </div>
                    </div>
                    {hasStrata && (
                      <div className="cf-detail-row">
                        <span className="cf-detail-row-label">Strata Fees</span>
                        <div className="cf-detail-row-values">
                          <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.strataFees / 12))}</span>
                          <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.strataFees))}</span>
                        </div>
                      </div>
                    )}
                    <div className="cf-detail-row subtotal">
                      <span className="cf-detail-row-label">Total Holding Costs</span>
                      <div className="cf-detail-row-values">
                        <span className="cf-detail-row-val primary">{formatCurrency(Math.round(sy.totalExpenses / 12))}</span>
                        <span className="cf-detail-row-val primary">{formatCurrency(Math.round(sy.totalExpenses))}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ---- Tax Position Section (investment only) ---- */}
              {isInvestment && (
                <div className="cf-detail-section">
                  <button
                    className={`cf-section-trigger${expandedOutputSections.has("tax") ? " open" : ""}`}
                    onClick={() => toggleOutputSection("tax")}
                  >
                    <div className="cf-section-trigger-left">
                      <ChevronRight size={16} className="cf-section-chevron" />
                      <span className="cf-section-name">Tax Position</span>
                    </div>
                    <div className="cf-section-totals">
                      <div className="cf-section-total-item">
                        <p className="cf-section-total-label">Deductions</p>
                        <p className="cf-section-total-value">{formatCurrency(Math.round(sy.totalDeductions))}</p>
                      </div>
                      <div className="cf-section-total-item">
                        <p className="cf-section-total-label">Benefit</p>
                        <p className="cf-section-total-value cf-positive">+{formatCurrency(Math.round(sy.taxBenefit))}</p>
                      </div>
                    </div>
                  </button>
                  {expandedOutputSections.has("tax") && (
                    <div className="cf-detail-content">
                      <div className="cf-detail-row">
                        <span className="cf-detail-row-label">Net Rental Income</span>
                        <div className="cf-detail-row-values">
                          <span className="cf-detail-row-val" />
                          <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.netRentalIncome))}</span>
                        </div>
                      </div>
                      <div className="cf-detail-row">
                        <span className="cf-detail-row-label" style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--cf-text-dim)" }}>
                          DEDUCTIONS
                        </span>
                        <div className="cf-detail-row-values"><span className="cf-detail-row-val" /><span className="cf-detail-row-val" /></div>
                      </div>
                      <div className="cf-detail-row">
                        <span className="cf-detail-row-label indent">Interest</span>
                        <div className="cf-detail-row-values">
                          <span className="cf-detail-row-val" />
                          <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.interestPortion))}</span>
                        </div>
                      </div>
                      {sy.depDiv43 > 0 && (
                        <div className="cf-detail-row">
                          <span className="cf-detail-row-label indent">Depreciation: Div 43</span>
                          <div className="cf-detail-row-values">
                            <span className="cf-detail-row-val" />
                            <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.depDiv43))}</span>
                          </div>
                        </div>
                      )}
                      {sy.depDiv40 > 0 && (
                        <div className="cf-detail-row">
                          <span className="cf-detail-row-label indent">Depreciation: Div 40</span>
                          <div className="cf-detail-row-values">
                            <span className="cf-detail-row-val" />
                            <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.depDiv40))}</span>
                          </div>
                        </div>
                      )}
                      <div className="cf-detail-row">
                        <span className="cf-detail-row-label indent">Other (rates, insurance, mgmt, maint.)</span>
                        <div className="cf-detail-row-values">
                          <span className="cf-detail-row-val" />
                          <span className="cf-detail-row-val">{formatCurrency(Math.round(sy.otherDeductibles))}</span>
                        </div>
                      </div>
                      <div className="cf-detail-row subtotal">
                        <span className="cf-detail-row-label">Total Deductions</span>
                        <div className="cf-detail-row-values">
                          <span className="cf-detail-row-val" />
                          <span className="cf-detail-row-val primary">{formatCurrency(Math.round(sy.totalDeductions))}</span>
                        </div>
                      </div>
                      <div className="cf-detail-row">
                        <span className={`cf-detail-row-label ${sy.rentalLossOrGain < 0 ? "cf-negative" : "cf-positive"}`}>
                          Rental {sy.rentalLossOrGain < 0 ? "Loss" : "Gain"} ({sy.rentalLossOrGain < 0 ? "negatively geared" : "positively geared"})
                        </span>
                        <div className="cf-detail-row-values">
                          <span className="cf-detail-row-val" />
                          <span className={`cf-detail-row-val ${sy.rentalLossOrGain < 0 ? "cf-negative" : "cf-positive"}`}>
                            {formatCurrency(Math.round(sy.rentalLossOrGain))}
                          </span>
                        </div>
                      </div>
                      <div className="cf-detail-row">
                        <span className="cf-detail-row-label">Tax Offset at {(marginalRate * 100).toFixed(0)}% + 2% ML</span>
                        <div className="cf-detail-row-values">
                          <span className="cf-detail-row-val" />
                          <span className="cf-detail-row-val cf-positive">+{formatCurrency(Math.round(sy.taxBenefit))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---- True Position ---- */}
              <div className="cf-true-position">
                <div className="cf-true-position-row">
                  <span className="cf-true-position-label">Pre-Tax Cashflow</span>
                  <div className="cf-true-position-values">
                    <span className="cf-true-position-val">{formatCurrency(Math.round(sy.preTaxCashflow / 12))}</span>
                    <span className="cf-true-position-val">{formatCurrency(Math.round(sy.preTaxCashflow))}</span>
                  </div>
                </div>
                {isInvestment && (
                  <div className="cf-true-position-row">
                    <span className="cf-true-position-label">Tax Benefit</span>
                    <div className="cf-true-position-values">
                      <span className="cf-true-position-val cf-positive">+{formatCurrency(Math.round(sy.taxBenefit / 12))}</span>
                      <span className="cf-true-position-val cf-positive">+{formatCurrency(Math.round(sy.taxBenefit))}</span>
                    </div>
                  </div>
                )}
                <div className="cf-true-position-row total">
                  <span className="cf-true-position-label">After-Tax Cashflow</span>
                  <div className="cf-true-position-values">
                    <span className={`cf-true-position-val ${sy.afterTaxCashflow < 0 ? "cf-negative" : "cf-positive"}`}>
                      {formatCurrency(Math.round(sy.afterTaxCashflow / 12))}
                    </span>
                    <span className={`cf-true-position-val ${sy.afterTaxCashflow < 0 ? "cf-negative" : "cf-positive"}`}>
                      {formatCurrency(Math.round(sy.afterTaxCashflow))}
                    </span>
                  </div>
                </div>
              </div>

              {/* ---- Memo Line ---- */}
              <div className="cf-memo-row">
                <span className="cf-memo-label">Principal repaid this year (equity gained, not a cost)</span>
                <div className="cf-memo-values">
                  <span className="cf-memo-val">{formatCurrency(Math.round(sy.principalPortion / 12))}</span>
                  <span className="cf-memo-val">{formatCurrency(Math.round(sy.principalPortion))}</span>
                </div>
              </div>

              {/* ---- Wealth Strip ---- */}
              <div className={`cf-wealth-strip${isPPOR ? " ppor" : ""}`}>
                <div className="cf-wealth-cell">
                  <p className="cf-wealth-label">Property Value</p>
                  <p className="cf-wealth-value">{formatAbbreviated(sy.propertyValue)}</p>
                </div>
                <div className="cf-wealth-cell">
                  <p className="cf-wealth-label">Loan Balance</p>
                  <p className="cf-wealth-value">{formatAbbreviated(sy.loanBalance)}</p>
                </div>
                <div className="cf-wealth-cell">
                  <p className="cf-wealth-label">Equity</p>
                  <p className="cf-wealth-value">{formatAbbreviated(sy.equity)}</p>
                </div>
                {isInvestment && (
                  <div className="cf-wealth-cell">
                    <p className="cf-wealth-label">Cash-on-Cash</p>
                    <p className={`cf-wealth-value ${cashOnCash < 0 ? "cf-negative" : "cf-positive"}`}>
                      {cashOnCash.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            )}
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
