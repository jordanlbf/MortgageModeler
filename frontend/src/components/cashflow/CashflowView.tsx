"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, DollarSign, Home, Percent, Receipt, Building } from "lucide-react";
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
          // SVG chart dimensions - LARGER for spacious design
          const svgW = 1000, svgH = 280;
          const mL = 60, mR = 20, mT = 20, mB = 40;
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
          const pad = range * 0.15;
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
                crossoverLabel = `Positive at Year ${Math.ceil(crossoverYear)}`;
                break;
              }
            }
          }

          // Y-axis ticks
          const yTicks: number[] = [yMin, 0, yMax].filter(v => v >= yMin && v <= yMax);
          yTicks.sort((a, b) => a - b);

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
          <div className="space-y-8">
            {/* ============================================================ */}
            {/* HERO CHART - SPACIOUS DESIGN                                 */}
            {/* ============================================================ */}
            <section className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-[var(--cf-card)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--cf-border)] px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--cf-accent)]/10">
                    <TrendingUp className="h-5 w-5 text-[var(--cf-accent)]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[var(--cf-text)]">
                      {effectiveMetric === "cashflow" ? "Monthly Cashflow Projection" :
                       effectiveMetric === "equity" ? "Equity Growth Projection" :
                       effectiveMetric === "gearing" ? "Gearing Position" :
                       effectiveMetric === "netIncome" ? "Net Rental Income" : "Tax Benefit Projection"}
                    </h2>
                    <p className="text-sm text-[var(--cf-text-dim)]">
                      {isInvestment ? "Investment property" : "Owner-occupier"} analysis over 30 years
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
                  <span className="rounded-full bg-[var(--cf-accent)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--cf-accent)]">
                    {isInvestment ? "Investment" : "PPOR"}
                  </span>
                </div>
              </div>

              {/* Chart Area - Enhanced with better visual hierarchy */}
              <div className="px-8 py-6">
                <div className="relative h-[260px] w-full">
                  <svg className="h-full w-full" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradPosA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.25" />
                        <stop offset="70%" stopColor="#2dd4bf" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="gradNegA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171" stopOpacity="0" />
                        <stop offset="30%" stopColor="#f87171" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#f87171" stopOpacity="0.15" />
                      </linearGradient>
                      <clipPath id="clipAboveA">
                        <rect x={mL} y={0} width={plotW} height={Math.max(0, zeroY)} />
                      </clipPath>
                      <clipPath id="clipBelowA">
                        <rect x={mL} y={Math.max(0, zeroY)} width={plotW} height={svgH - Math.max(0, zeroY)} />
                      </clipPath>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Subtle vertical grid lines at key years */}
                    {[1, 5, 10, 15, 20, 25, 30].map(y => (
                      <line key={y} x1={mapX(y)} x2={mapX(y)} y1={mT} y2={svgH - mB}
                        stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    ))}

                    {/* Horizontal grid lines - subtle */}
                    {yTicks.map((v, i) => (
                      <line key={i} x1={mL} x2={svgW - mR} y1={mapY(v)} y2={mapY(v)}
                        stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    ))}

                    {/* Zero line - emphasized */}
                    {yMin < 0 && yMax > 0 && (
                      <line x1={mL} x2={svgW - mR} y1={zeroY} y2={zeroY}
                        stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="8,4" />
                    )}

                    {!isGearing && activeData.length > 0 && (
                      <>
                        {/* Area fills */}
                        <path d={areaPath} clipPath="url(#clipAboveA)" fill="url(#gradPosA)" />
                        <path d={areaPath} clipPath="url(#clipBelowA)" fill="url(#gradNegA)" />
                        {/* Main line with subtle glow */}
                        <polyline points={linePoints} stroke="#2dd4bf" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
                      </>
                    )}

                    {isGearing && gearingData.income.length > 0 && (
                      <>
                        <polyline points={incomePoints} stroke="#4ade80" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points={deductionPoints} stroke="#f87171" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </>
                    )}

                    {/* Crossover marker with pulse effect */}
                    {crossoverYear !== null && (
                      <>
                        <circle cx={mapX(crossoverYear)} cy={isGearing
                          ? mapY(gearingData.income[Math.floor(crossoverYear) - 1]?.value ?? 0)
                          : zeroY}
                          r="10" fill="#2dd4bf" fillOpacity="0.2" />
                        <circle cx={mapX(crossoverYear)} cy={isGearing
                          ? mapY(gearingData.income[Math.floor(crossoverYear) - 1]?.value ?? 0)
                          : zeroY}
                          r="5" fill="#2dd4bf" />
                      </>
                    )}

                    {/* Selected year vertical guide line */}
                    {!isGearing && (
                      <line
                        x1={mapX(selectedYear)} x2={mapX(selectedYear)}
                        y1={mapY(activeData[selectedYear - 1]?.value ?? 0)} y2={svgH - mB}
                        stroke="rgba(45, 212, 191, 0.3)" strokeWidth="1" strokeDasharray="4,4" />
                    )}

                    {/* Selected year marker - enhanced */}
                    {!isGearing && (
                      <>
                        <circle cx={mapX(selectedYear)} cy={mapY(activeData[selectedYear - 1]?.value ?? 0)} r="12" fill="#2dd4bf" fillOpacity="0.15" />
                        <circle cx={mapX(selectedYear)} cy={mapY(activeData[selectedYear - 1]?.value ?? 0)} r="7" fill="#2dd4bf" />
                        <circle cx={mapX(selectedYear)} cy={mapY(activeData[selectedYear - 1]?.value ?? 0)} r="3" fill="#0f1115" />
                      </>
                    )}

                    {/* Y-axis labels */}
                    {yTicks.map((v, i) => (
                      <text key={i} x={mL - 12} y={mapY(v) + 4} textAnchor="end"
                        fill="var(--cf-text-dim)" fontSize="11" fontFamily="inherit" fontWeight="500">
                        {formatChartLabel(v)}
                      </text>
                    ))}

                    {/* X-axis labels */}
                    {xLabels.map(y => (
                      <text key={y} x={mapX(y)} y={svgH - 8} textAnchor="middle"
                        fill={selectedYear === y ? "var(--cf-accent)" : "var(--cf-text-dim)"}
                        fontSize="11" fontFamily="inherit" fontWeight={selectedYear === y ? "600" : "400"}>
                        {y}
                      </text>
                    ))}
                  </svg>

                  {/* Crossover annotation */}
                  {crossoverYear !== null && (
                    <div
                      className="absolute flex items-center gap-2 rounded-full border border-[var(--cf-accent)]/30 bg-[var(--cf-accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--cf-accent)] backdrop-blur-sm"
                      style={{
                        left: `${(mapX(crossoverYear) / svgW) * 100}%`,
                        top: `${((isGearing ? mapY(gearingData.income[Math.floor(crossoverYear) - 1]?.value ?? 0) : zeroY) / svgH) * 100}%`,
                        transform: "translate(12px, -50%)",
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--cf-accent)]" />
                      {crossoverLabel}
                    </div>
                  )}

                  {/* Selected year value tooltip */}
                  {!isGearing && activeData[selectedYear - 1] && (
                    <div
                      className="pointer-events-none absolute rounded-md border border-[var(--cf-border)] bg-[var(--cf-card)] px-2.5 py-1.5 text-xs font-medium shadow-lg"
                      style={{
                        left: `${(mapX(selectedYear) / svgW) * 100}%`,
                        top: `${(mapY(activeData[selectedYear - 1]?.value ?? 0) / svgH) * 100}%`,
                        transform: "translate(-50%, -140%)",
                      }}
                    >
                      <span className="text-[var(--cf-text-dim)]">Yr {selectedYear}: </span>
                      <span className={activeData[selectedYear - 1].value >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}>
                        {formatCurrency(Math.round(activeData[selectedYear - 1].value))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Stats - Centered */}
              <div className="grid grid-cols-4 border-t border-[var(--cf-border)]">
                {effectiveMetric === "cashflow" && (
                  <>
                    {[
                      { label: "Year 1 Monthly", value: formatCurrency(Math.round(yr(1).afterTaxCashflow / 12)), negative: yr(1).afterTaxCashflow < 0 },
                      { label: "Crossover", value: cashflowCrossoverYear ? `Year ${cashflowCrossoverYear}` : "N/A", positive: true },
                      { label: "Year 30 Monthly", value: formatCurrency(Math.round(yr(30).afterTaxCashflow / 12)), positive: yr(30).afterTaxCashflow >= 0 },
                      { label: "Cumulative Outlay", value: formatCurrency(Math.round(cumulativeOutlay)), negative: true },
                    ].map((stat, i) => (
                      <div key={i} className="border-r border-[var(--cf-border)] p-5 text-center last:border-r-0">
                        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--cf-text-dim)]">{stat.label}</p>
                        <p className={`text-lg font-semibold tabular-nums ${stat.positive ? "text-[#4ade80]" : stat.negative ? "text-[#f87171]" : "text-[var(--cf-text)]"}`}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </>
                )}
                {effectiveMetric === "equity" && (
                  <>
                    {[1, 10, 20, 30].map(y => (
                      <div key={y} className="border-r border-[var(--cf-border)] p-5 text-center last:border-r-0">
                        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--cf-text-dim)]">Year {y}</p>
                        <p className="text-lg font-semibold tabular-nums text-[#4ade80]">{formatAbbreviated(yr(y).equity)}</p>
                      </div>
                    ))}
                  </>
                )}
                {effectiveMetric === "gearing" && (
                  <>
                    {[
                      { label: "Year 1 Loss", value: formatCurrency(Math.round(yr(1).rentalLossOrGain)), negative: true },
                      { label: "Crossover Year", value: crossoverYear ? `Year ${Math.ceil(crossoverYear)}` : "N/A", positive: true },
                      { label: "Year 30 Position", value: formatCurrency(Math.round(yr(30).rentalLossOrGain)), positive: yr(30).rentalLossOrGain >= 0 },
                      { label: "Peak Deductions", value: formatCurrency(Math.round(peakDeductions)) },
                    ].map((stat, i) => (
                      <div key={i} className="border-r border-[var(--cf-border)] p-5 text-center last:border-r-0">
                        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--cf-text-dim)]">{stat.label}</p>
                        <p className={`text-lg font-semibold tabular-nums ${stat.positive ? "text-[#4ade80]" : stat.negative ? "text-[#f87171]" : "text-[var(--cf-text)]"}`}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </>
                )}
                {effectiveMetric === "netIncome" && (
                  <>
                    {[1, 10, 20, 30].map(y => (
                      <div key={y} className="border-r border-[var(--cf-border)] p-5 text-center last:border-r-0">
                        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--cf-text-dim)]">Year {y}/mo</p>
                        <p className="text-lg font-semibold tabular-nums text-[var(--cf-text)]">{formatCurrency(Math.round(yr(y).netRentalIncome / 12))}</p>
                      </div>
                    ))}
                  </>
                )}
                {effectiveMetric === "taxBenefit" && (
                  <>
                    {[
                      { label: "Year 1", value: formatCurrency(Math.round(yr(1).taxBenefit)), positive: true },
                      { label: "Peak Benefit", value: formatCurrency(Math.round(peakTaxBenefit)), positive: true },
                      { label: "Ends Year", value: taxBenefitEndsYear ? `Year ${taxBenefitEndsYear}` : "N/A" },
                      { label: "Lifetime Total", value: formatCurrency(Math.round(lifetimeTaxBenefit)), positive: true },
                    ].map((stat, i) => (
                      <div key={i} className="border-r border-[var(--cf-border)] p-5 text-center last:border-r-0">
                        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--cf-text-dim)]">{stat.label}</p>
                        <p className={`text-lg font-semibold tabular-nums ${stat.positive ? "text-[#4ade80]" : "text-[var(--cf-text)]"}`}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </section>

            {/* ============================================================ */}
            {/* YEAR SELECTOR - BUTTONS + SLIDER                            */}
            {/* ============================================================ */}
            <section className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-[var(--cf-card)]">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--cf-text-muted)]">Year</span>
                  <span className="min-w-[2.5rem] rounded-md bg-[var(--cf-accent)]/10 px-2.5 py-1 text-center text-sm font-semibold tabular-nums text-[var(--cf-accent)]">
                    {selectedYear}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Quick year buttons */}
                  <div className="flex items-center gap-1 rounded-lg bg-[var(--cf-surface-subtle)] p-1">
                    {[1, 2, 5, 10, 20, 30].map(y => (
                      <button
                        key={y}
                        onClick={() => setSelectedYear(y)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition-all ${
                          selectedYear === y
                            ? "bg-[var(--cf-accent)] text-[#0f1115] shadow-sm"
                            : "text-[var(--cf-text-muted)] hover:bg-[var(--cf-border)] hover:text-[var(--cf-text)]"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                  {/* Slider */}
                  <div className="ml-3 flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-[var(--cf-input-bg)] accent-[var(--cf-accent)]"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ============================================================ */}
            {/* KPI SUMMARY CARDS - REFINED WITH SUBTLE ACCENTS             */}
            {/* ============================================================ */}
            {sy && (
            <div className={`grid gap-4 ${isInvestment ? "grid-cols-4" : "grid-cols-2"}`}>
              {[
                {
                  icon: DollarSign,
                  label: "After-Tax Cashflow",
                  value: formatCurrency(Math.round(sy.afterTaxCashflow)),
                  sub: `${formatCurrency(Math.round(sy.afterTaxCashflow / 12))}/mo`,
                  color: sy.afterTaxCashflow < 0 ? "negative" : "positive",
                  show: true,
                },
                {
                  icon: TrendingDown,
                  label: "Pre-Tax Cashflow",
                  value: formatCurrency(Math.round(sy.preTaxCashflow)),
                  sub: `${formatCurrency(Math.round(sy.preTaxCashflow / 12))}/mo`,
                  color: sy.preTaxCashflow < 0 ? "negative" : "positive",
                  show: true,
                },
                {
                  icon: Receipt,
                  label: "Tax Benefit",
                  value: sy.taxBenefit > 0 ? `+${formatCurrency(Math.round(sy.taxBenefit))}` : formatCurrency(Math.round(sy.taxBenefit)),
                  sub: `at ${(marginalRate * 100).toFixed(0)}% + 2% ML`,
                  color: "positive",
                  show: isInvestment,
                },
                {
                  icon: Percent,
                  label: "Gearing Position",
                  value: formatCurrency(Math.round(sy.rentalLossOrGain)),
                  sub: sy.rentalLossOrGain < 0 ? "Negatively Geared" : "Positively Geared",
                  color: sy.rentalLossOrGain < 0 ? "negative" : "positive",
                  show: isInvestment,
                },
              ].filter(kpi => kpi.show).map((kpi, i) => (
                <div
                  key={i}
                  className={`relative overflow-hidden rounded-xl border bg-[var(--cf-card)] p-5 ${
                    kpi.color === "positive"
                      ? "border-[#4ade80]/20"
                      : "border-[#f87171]/20"
                  }`}
                >
                  {/* Subtle gradient accent at top */}
                  <div className={`absolute inset-x-0 top-0 h-0.5 ${
                    kpi.color === "positive"
                      ? "bg-gradient-to-r from-transparent via-[#4ade80]/50 to-transparent"
                      : "bg-gradient-to-r from-transparent via-[#f87171]/50 to-transparent"
                  }`} />
                  <div className="flex items-start justify-between">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      kpi.color === "positive" ? "bg-[#4ade80]/10" : "bg-[#f87171]/10"
                    }`}>
                      <kpi.icon className={`h-4 w-4 ${kpi.color === "positive" ? "text-[#4ade80]" : "text-[#f87171]"}`} />
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-[var(--cf-text-dim)]">{kpi.label}</p>
                  <p className={`mt-1.5 text-2xl font-bold tabular-nums ${
                    kpi.color === "positive" ? "text-[#4ade80]" : "text-[#f87171]"
                  }`}>
                    {kpi.value}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--cf-text-dim)]">{kpi.sub}</p>
                </div>
              ))}
            </div>
            )}

            {/* ============================================================ */}
            {/* BREAKDOWN CARDS - EXPANDABLE WITH GENEROUS SPACING          */}
            {/* ============================================================ */}
            {sy && (
            <div className="space-y-4">
              {/* Income Card (investment only) */}
              {isInvestment && (
                <div className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-[var(--cf-card)]">
                  <button
                    onClick={() => toggleOutputSection("income")}
                    className="flex w-full items-center justify-between px-8 py-5 transition-colors hover:bg-[var(--cf-surface-subtle)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4ade80]/10">
                        <Home className="h-5 w-5 text-[#4ade80]" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[var(--cf-text)]">Rental Income</p>
                        <p className="text-xs text-[var(--cf-text-dim)]">Gross income less vacancy and management</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-lg font-semibold tabular-nums text-[var(--cf-text)]">
                          {formatCurrency(Math.round(sy.netRentalIncome))}
                        </p>
                        <p className="text-xs text-[var(--cf-text-dim)]">{formatCurrency(Math.round(sy.netRentalIncome / 12))}/mo</p>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-[var(--cf-text-dim)] transition-transform ${
                        expandedOutputSections.has("income") ? "rotate-180" : ""
                      }`} />
                    </div>
                  </button>

                  {expandedOutputSections.has("income") && (
                    <div className="border-t border-[var(--cf-border)] bg-[var(--cf-surface-subtle)] px-8 py-6">
                      <div className="space-y-4">
                        {[
                          { label: "Gross Rental Income", monthly: sy.rentalIncome / 12, annual: sy.rentalIncome },
                          { label: `Less: Vacancy (${vacancyRate}%)`, monthly: -sy.vacancy / 12, annual: -sy.vacancy },
                          ...(usePropertyManager ? [{ label: `Less: Management Fee (${managementFee}%)`, monthly: -sy.managementFee / 12, annual: -sy.managementFee }] : []),
                        ].map((row, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-[var(--cf-text-muted)]">{row.label}</span>
                            <div className="flex gap-12 tabular-nums">
                              <span className="w-24 text-right text-sm text-[var(--cf-text-muted)]">
                                {formatCurrency(Math.round(row.monthly))}
                              </span>
                              <span className="w-24 text-right text-sm text-[var(--cf-text-muted)]">
                                {formatCurrency(Math.round(row.annual))}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center justify-between border-t border-[var(--cf-border)] pt-4">
                          <span className="text-sm font-medium text-[var(--cf-text)]">Net Rental Income</span>
                          <div className="flex gap-12 tabular-nums">
                            <span className="w-24 text-right text-sm font-medium text-[var(--cf-text)]">
                              {formatCurrency(Math.round(sy.netRentalIncome / 12))}
                            </span>
                            <span className="w-24 text-right text-sm font-medium text-[var(--cf-text)]">
                              {formatCurrency(Math.round(sy.netRentalIncome))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Holding Costs Card */}
              <div className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-[var(--cf-card)]">
                <button
                  onClick={() => toggleOutputSection("holding")}
                  className="flex w-full items-center justify-between px-8 py-5 transition-colors hover:bg-[var(--cf-surface-subtle)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f87171]/10">
                      <TrendingDown className="h-5 w-5 text-[#f87171]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[var(--cf-text)]">Holding Costs</p>
                      <p className="text-xs text-[var(--cf-text-dim)]">Interest, rates, insurance and maintenance</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-lg font-semibold tabular-nums text-[var(--cf-text)]">
                        {formatCurrency(Math.round(sy.totalExpenses))}
                      </p>
                      <p className="text-xs text-[var(--cf-text-dim)]">{formatCurrency(Math.round(sy.totalExpenses / 12))}/mo</p>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-[var(--cf-text-dim)] transition-transform ${
                      expandedOutputSections.has("holding") ? "rotate-180" : ""
                    }`} />
                  </div>
                </button>

                {expandedOutputSections.has("holding") && (
                  <div className="border-t border-[var(--cf-border)] bg-[var(--cf-surface-subtle)] px-8 py-6">
                    <div className="space-y-4">
                      {[
                        { label: "Interest on Loan", monthly: sy.interestPortion / 12, annual: sy.interestPortion },
                        { label: "Council Rates", monthly: sy.councilRates / 12, annual: sy.councilRates },
                        { label: "Water Rates", monthly: sy.waterRates / 12, annual: sy.waterRates },
                        { label: "Insurance", monthly: sy.insurance / 12, annual: sy.insurance },
                        { label: "Maintenance", monthly: sy.maintenance / 12, annual: sy.maintenance },
                        ...(hasStrata ? [{ label: "Strata Fees", monthly: sy.strataFees / 12, annual: sy.strataFees }] : []),
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-[var(--cf-text-muted)]">{row.label}</span>
                          <div className="flex gap-12 tabular-nums">
                            <span className="w-24 text-right text-sm text-[var(--cf-text-muted)]">
                              {formatCurrency(Math.round(row.monthly))}
                            </span>
                            <span className="w-24 text-right text-sm text-[var(--cf-text-muted)]">
                              {formatCurrency(Math.round(row.annual))}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t border-[var(--cf-border)] pt-4">
                        <span className="text-sm font-medium text-[var(--cf-text)]">Total Holding Costs</span>
                        <div className="flex gap-12 tabular-nums">
                          <span className="w-24 text-right text-sm font-medium text-[var(--cf-text)]">
                            {formatCurrency(Math.round(sy.totalExpenses / 12))}
                          </span>
                          <span className="w-24 text-right text-sm font-medium text-[var(--cf-text)]">
                            {formatCurrency(Math.round(sy.totalExpenses))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tax Position Card (investment only) */}
              {isInvestment && (
                <div className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-[var(--cf-card)]">
                  <button
                    onClick={() => toggleOutputSection("tax")}
                    className="flex w-full items-center justify-between px-8 py-5 transition-colors hover:bg-[var(--cf-surface-subtle)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--cf-accent)]/10">
                        <Receipt className="h-5 w-5 text-[var(--cf-accent)]" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[var(--cf-text)]">Tax Position</p>
                        <p className="text-xs text-[var(--cf-text-dim)]">Deductions and negative gearing benefit</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="flex gap-8 text-right">
                        <div>
                          <p className="text-xs text-[var(--cf-text-dim)]">Deductions</p>
                          <p className="text-lg font-semibold tabular-nums text-[var(--cf-text)]">
                            {formatCurrency(Math.round(sy.totalDeductions))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--cf-text-dim)]">Benefit</p>
                          <p className="text-lg font-semibold tabular-nums text-[#4ade80]">
                            +{formatCurrency(Math.round(sy.taxBenefit))}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-[var(--cf-text-dim)] transition-transform ${
                        expandedOutputSections.has("tax") ? "rotate-180" : ""
                      }`} />
                    </div>
                  </button>

                  {expandedOutputSections.has("tax") && (
                    <div className="border-t border-[var(--cf-border)] bg-[var(--cf-surface-subtle)] px-8 py-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[var(--cf-text-muted)]">Net Rental Income</span>
                          <span className="text-sm tabular-nums text-[var(--cf-text-muted)]">
                            {formatCurrency(Math.round(sy.netRentalIncome))}
                          </span>
                        </div>
                        <div className="pt-2">
                          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--cf-text-dim)]">Deductions</p>
                          {[
                            { label: "Interest", value: sy.interestPortion },
                            ...(sy.depDiv43 > 0 ? [{ label: "Depreciation: Div 43", value: sy.depDiv43 }] : []),
                            ...(sy.depDiv40 > 0 ? [{ label: "Depreciation: Div 40", value: sy.depDiv40 }] : []),
                            { label: "Other (rates, insurance, etc.)", value: sy.otherDeductibles },
                          ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between py-1">
                              <span className="pl-4 text-sm text-[var(--cf-text-dim)]">{row.label}</span>
                              <span className="text-sm tabular-nums text-[var(--cf-text-muted)]">
                                {formatCurrency(Math.round(row.value))}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-[var(--cf-border)] pt-4">
                          <span className="text-sm font-medium text-[var(--cf-text)]">Total Deductions</span>
                          <span className="text-sm font-medium tabular-nums text-[var(--cf-text)]">
                            {formatCurrency(Math.round(sy.totalDeductions))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${sy.rentalLossOrGain < 0 ? "text-[#f87171]" : "text-[#4ade80]"}`}>
                            Rental {sy.rentalLossOrGain < 0 ? "Loss" : "Gain"} ({sy.rentalLossOrGain < 0 ? "negatively geared" : "positively geared"})
                          </span>
                          <span className={`text-sm font-medium tabular-nums ${sy.rentalLossOrGain < 0 ? "text-[#f87171]" : "text-[#4ade80]"}`}>
                            {formatCurrency(Math.round(sy.rentalLossOrGain))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-[#4ade80]/5 p-4">
                          <span className="text-sm font-medium text-[#4ade80]">Tax Offset at {(marginalRate * 100).toFixed(0)}% + 2% ML</span>
                          <span className="text-lg font-bold tabular-nums text-[#4ade80]">+{formatCurrency(Math.round(sy.taxBenefit))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* ============================================================ */}
            {/* WEALTH POSITION - ENHANCED BOTTOM STRIP                     */}
            {/* ============================================================ */}
            {sy && (
            <section className="relative overflow-hidden rounded-xl border border-[var(--cf-accent)]/20 bg-gradient-to-r from-[var(--cf-card)] via-[var(--cf-accent)]/[0.03] to-[var(--cf-card)]">
              {/* Subtle accent line at top */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--cf-accent)]/40 to-transparent" />

              <div className="px-6 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4 text-[var(--cf-accent)]" />
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--cf-accent)]">
                    Wealth Position at Year {selectedYear}
                  </span>
                </div>
                <div className={`grid ${isInvestment ? "grid-cols-4" : "grid-cols-3"} gap-4`}>
                  {[
                    { label: "Property Value", value: formatAbbreviated(sy.propertyValue), subValue: formatCurrency(Math.round(sy.propertyValue)), show: true },
                    { label: "Loan Balance", value: formatAbbreviated(sy.loanBalance), subValue: formatCurrency(Math.round(sy.loanBalance)), show: true },
                    { label: "Net Equity", value: formatAbbreviated(sy.equity), subValue: `${((sy.equity / sy.propertyValue) * 100).toFixed(0)}% LVR`, color: "accent", show: true },
                    { label: "Cash-on-Cash", value: `${cashOnCash.toFixed(1)}%`, subValue: cashOnCash >= 0 ? "Positive yield" : "Negative yield", color: cashOnCash < 0 ? "negative" : "positive", show: isInvestment },
                  ].filter(item => item.show).map((item, i) => (
                    <div key={i} className="rounded-lg bg-[var(--cf-surface-subtle)]/50 p-4 text-center">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--cf-text-dim)]">{item.label}</p>
                      <p className={`text-lg font-bold tabular-nums ${
                        item.color === "positive" ? "text-[#4ade80]" :
                        item.color === "negative" ? "text-[#f87171]" :
                        item.color === "accent" ? "text-[var(--cf-accent)]" :
                        "text-[var(--cf-text)]"
                      }`}>{item.value}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--cf-text-dim)]">{item.subValue}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
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
