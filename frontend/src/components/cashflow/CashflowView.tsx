"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import "./cashflow.css";

// ============================================================================
// TYPES
// ============================================================================

type PropertyUse = "investment" | "ppor";
type PurchaseMode = "new" | "existing";
type LoanType = "principal-interest" | "interest-only";
type CashflowView = 1 | 2 | 3 | 5 | 10;

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
  interestDeduction: number;
  depreciationDeduction: number;
  otherDeductions: number;
  totalTaxBenefit: number;
  netCashflow: number;
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
  const [cashflowView, setCashflowView] = useState<CashflowView>(1);

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["property"]));

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
    const taxRate = getMarginalTaxRate(parseCurrency(taxableIncome));
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
      const totalExpenses = annualRepayment + annualCouncil + annualWater + annualInsurance + annualMaintenance + annualStrata;

      // Pre-tax cashflow
      const preTax = netRental - totalExpenses;

      // Tax deductions (investment only)
      const interestDeduct = isInvestment ? interestPaid * taxRate : 0;
      const deprecDeduct = isInvestment ? annualDepreciation * taxRate : 0;
      const otherDeduct = isInvestment ? (annualCouncil + annualWater + annualInsurance + annualMaintenance + annualStrata) * taxRate * 0.3 : 0; // Simplified
      const totalTaxBenefit = interestDeduct + deprecDeduct + otherDeduct;

      // Net cashflow
      const netCash = preTax + totalTaxBenefit;

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
        interestDeduction: interestDeduct,
        depreciationDeduction: deprecDeduct,
        otherDeductions: otherDeduct,
        totalTaxBenefit,
        netCashflow: netCash,
      });
    }

    return data;
  }, [
    allComplete, propertyValue, loanAmount, interestRate, loanTerm, loanType, ioPeriod,
    capitalGrowth, taxableIncome, weeklyRent, vacancyRate, usePropertyManager, managementFee,
    depreciation, councilRates, waterRates, insurance, maintenance, hasStrata, strataFees,
    hasOffset, offsetBalance, extraRepayments, isInvestment
  ]);

  // Aggregate data for selected cashflow view period
  const aggregatedData = useMemo(() => {
    if (yearData.length === 0) return null;

    const yearsToSum = Math.min(cashflowView, yearData.length);
    const relevantYears = yearData.slice(0, yearsToSum);

    return {
      totalRentalIncome: relevantYears.reduce((sum, y) => sum + y.rentalIncome, 0),
      totalVacancy: relevantYears.reduce((sum, y) => sum + y.vacancy, 0),
      totalManagementFee: relevantYears.reduce((sum, y) => sum + y.managementFee, 0),
      totalNetRentalIncome: relevantYears.reduce((sum, y) => sum + y.netRentalIncome, 0),
      totalLoanRepayment: relevantYears.reduce((sum, y) => sum + y.loanRepayment, 0),
      totalInterest: relevantYears.reduce((sum, y) => sum + y.interestPortion, 0),
      totalPrincipal: relevantYears.reduce((sum, y) => sum + y.principalPortion, 0),
      totalCouncilRates: relevantYears.reduce((sum, y) => sum + y.councilRates, 0),
      totalWaterRates: relevantYears.reduce((sum, y) => sum + y.waterRates, 0),
      totalInsurance: relevantYears.reduce((sum, y) => sum + y.insurance, 0),
      totalMaintenance: relevantYears.reduce((sum, y) => sum + y.maintenance, 0),
      totalStrataFees: relevantYears.reduce((sum, y) => sum + y.strataFees, 0),
      totalExpenses: relevantYears.reduce((sum, y) => sum + y.totalExpenses, 0),
      totalPreTaxCashflow: relevantYears.reduce((sum, y) => sum + y.preTaxCashflow, 0),
      totalInterestDeduction: relevantYears.reduce((sum, y) => sum + y.interestDeduction, 0),
      totalDepreciationDeduction: relevantYears.reduce((sum, y) => sum + y.depreciationDeduction, 0),
      totalOtherDeductions: relevantYears.reduce((sum, y) => sum + y.otherDeductions, 0),
      totalTaxBenefit: relevantYears.reduce((sum, y) => sum + y.totalTaxBenefit, 0),
      totalNetCashflow: relevantYears.reduce((sum, y) => sum + y.netCashflow, 0),
      years: yearsToSum,
    };
  }, [yearData, cashflowView]);

  // Milestone data for property value & equity card
  const milestones = useMemo(() => {
    return [5, 10, 20, 30].map(year => {
      const data = yearData[year - 1];
      return data ? {
        year,
        propertyValue: data.propertyValue,
        equity: data.equity,
      } : {
        year,
        propertyValue: propertyValue * Math.pow(1.035, year),
        equity: propertyValue * Math.pow(1.035, year) - Math.max(0, loanAmount - year * 12000),
      };
    });
  }, [yearData, propertyValue, loanAmount]);

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

  // Reset to edit a completed section
  const resetSection = (section: string) => {
    switch (section) {
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
    <div className="cf-layout">
      {/* LEFT SIDEBAR - INPUTS */}
      <aside className="cf-sidebar">
        <div className="cf-sidebar-inner">
          {/* Mode Selection */}
          <div className="cf-section">
            <div className="cf-section-content" style={{ paddingTop: 16 }}>
              <p className="cf-section-label">Property Use</p>
              <div className="cf-button-group">
                <button
                  className={`cf-button-option ${propertyUse === "investment" ? "active" : ""}`}
                  onClick={() => {
                    setPropertyUse("investment");
                    setPurchaseMode(null);
                    setPropertyComplete(false);
                    setLoanComplete(false);
                    setCostsComplete(false);
                    setRentalComplete(false);
                    setTaxComplete(false);
                  }}
                >
                  Investment
                </button>
                <button
                  className={`cf-button-option ${propertyUse === "ppor" ? "active" : ""}`}
                  onClick={() => {
                    setPropertyUse("ppor");
                    setPurchaseMode(null);
                    setPropertyComplete(false);
                    setLoanComplete(false);
                    setCostsComplete(false);
                    setRentalComplete(false);
                    setTaxComplete(false);
                  }}
                >
                  PPOR
                </button>
              </div>

              {propertyUse && (
                <>
                  <p className="cf-section-label" style={{ marginTop: 8 }}>Purchase Mode</p>
                  <div className="cf-button-group">
                    <button
                      className={`cf-button-option ${purchaseMode === "new" ? "active" : ""}`}
                      onClick={() => {
                        setPurchaseMode("new");
                        setPropertyComplete(false);
                        setLoanComplete(false);
                        setCostsComplete(false);
                        setRentalComplete(false);
                        setTaxComplete(false);
                      }}
                    >
                      New Purchase
                    </button>
                    <button
                      className={`cf-button-option ${purchaseMode === "existing" ? "active" : ""}`}
                      onClick={() => {
                        setPurchaseMode("existing");
                        setPropertyComplete(false);
                        setLoanComplete(false);
                        setCostsComplete(false);
                        setRentalComplete(false);
                        setTaxComplete(false);
                      }}
                    >
                      Existing Property
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Property Details */}
          {purchaseMode && (
            <div className="cf-section">
              <button
                className="cf-section-header"
                onClick={() => toggleSection("property")}
              >
                <span>Property Details</span>
                {propertyComplete && (
                  <button
                    className="cf-edit-link"
                    onClick={(e) => { e.stopPropagation(); resetSection("property"); }}
                  >
                    Edit
                  </button>
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
                  <button
                    className="cf-edit-link"
                    onClick={(e) => { e.stopPropagation(); resetSection("loan"); }}
                  >
                    Edit
                  </button>
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
                  <button
                    className="cf-edit-link"
                    onClick={(e) => { e.stopPropagation(); resetSection("costs"); }}
                  >
                    Edit
                  </button>
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
                  <button
                    className="cf-edit-link"
                    onClick={(e) => { e.stopPropagation(); resetSection("rental"); }}
                  >
                    Edit
                  </button>
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
                  <button
                    className="cf-edit-link"
                    onClick={(e) => { e.stopPropagation(); resetSection("tax"); }}
                  >
                    Edit
                  </button>
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
        {allComplete && aggregatedData && (
          <div className="cf-outputs">
            {/* Property Value & Equity Milestones */}
            <div className="cf-card">
              <div className="cf-card-header">
                <span>Property Value & Equity</span>
                {isNewPurchase && (
                  <span className="cf-card-header-note">
                    Starting: <span className="cf-tabular">{formatCurrency(propertyValue)}</span>
                  </span>
                )}
              </div>
              <div className="cf-milestones">
                {milestones.map((m) => (
                  <div key={m.year} className="cf-milestone">
                    <p className="cf-milestone-year">Year {m.year}</p>
                    <div className="cf-milestone-values">
                      <div>
                        <p className="cf-milestone-value">{formatAbbreviated(m.propertyValue)}</p>
                        <p className="cf-milestone-label">Value</p>
                      </div>
                      <div className="cf-milestone-equity">
                        <p className="cf-milestone-equity-value">{formatAbbreviated(m.equity)}</p>
                        <p className="cf-milestone-label">Equity</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cashflow Section */}
            <div className="cf-card">
              <div className="cf-card-header">
                <span>Cashflow Breakdown</span>
                <div className="cf-year-selector">
                  {([1, 2, 3, 5, 10] as CashflowView[]).map((years) => (
                    <button
                      key={years}
                      className={`cf-year-button ${cashflowView === years ? "active" : ""}`}
                      onClick={() => setCashflowView(years)}
                    >
                      {years === 1 ? "Year 1" : `${years} Years`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focal Monthly Cashflow */}
              <div className="cf-focal">
                <div className="cf-focal-main">
                  <p className="cf-focal-label">
                    {cashflowView === 1 ? "Monthly Cashflow (Year 1 Average)" : `Monthly Cashflow (Year 1-${cashflowView} Average)`}
                  </p>
                  <p className="cf-focal-value">
                    {formatCurrency(Math.round(aggregatedData.totalNetCashflow / (cashflowView * 12)))}
                  </p>
                  <p className="cf-focal-note">
                    {isInvestment ? "After tax benefits and rental income" : "Total holding cost per month"}
                  </p>
                </div>
                <div className="cf-focal-total">
                  <p className="cf-focal-label">Total over {cashflowView} {cashflowView === 1 ? "year" : "years"}</p>
                  <p className="cf-focal-total-value">{formatCurrency(Math.round(aggregatedData.totalNetCashflow))}</p>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="cf-table-container">
                <table className="cf-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Monthly</th>
                      <th>Annual</th>
                      <th>{cashflowView === 1 ? "Year 1" : `${cashflowView} Year Total`}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Income Section - Investment only */}
                    {isInvestment && (
                      <>
                        <tr className="cf-table-section">
                          <td colSpan={4}>Income</td>
                        </tr>
                        <tr>
                          <td>Rental Income</td>
                          <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalRentalIncome / (cashflowView * 12)))}</td>
                          <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalRentalIncome / cashflowView))}</td>
                          <td className="cf-tabular cf-bold">{formatCurrency(Math.round(aggregatedData.totalRentalIncome))}</td>
                        </tr>
                        <tr className="cf-muted">
                          <td>Less: Vacancy</td>
                          <td className="cf-tabular">{formatCurrency(-Math.round(aggregatedData.totalVacancy / (cashflowView * 12)))}</td>
                          <td className="cf-tabular">{formatCurrency(-Math.round(aggregatedData.totalVacancy / cashflowView))}</td>
                          <td className="cf-tabular">{formatCurrency(-Math.round(aggregatedData.totalVacancy))}</td>
                        </tr>
                        {usePropertyManager && (
                          <tr className="cf-muted">
                            <td>Less: Management Fee</td>
                            <td className="cf-tabular">{formatCurrency(-Math.round(aggregatedData.totalManagementFee / (cashflowView * 12)))}</td>
                            <td className="cf-tabular">{formatCurrency(-Math.round(aggregatedData.totalManagementFee / cashflowView))}</td>
                            <td className="cf-tabular">{formatCurrency(-Math.round(aggregatedData.totalManagementFee))}</td>
                          </tr>
                        )}
                        <tr className="cf-table-subtotal">
                          <td>Net Rental Income</td>
                          <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalNetRentalIncome / (cashflowView * 12)))}</td>
                          <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalNetRentalIncome / cashflowView))}</td>
                          <td className="cf-tabular cf-bold">{formatCurrency(Math.round(aggregatedData.totalNetRentalIncome))}</td>
                        </tr>
                      </>
                    )}

                    {/* Expenses Section */}
                    <tr className="cf-table-section">
                      <td colSpan={4}>Expenses</td>
                    </tr>
                    <tr>
                      <td>Loan Repayment</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalLoanRepayment / (cashflowView * 12)))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalLoanRepayment / cashflowView))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalLoanRepayment))}</td>
                    </tr>
                    <tr className="cf-muted cf-indent">
                      <td>— Interest portion</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalInterest / (cashflowView * 12)))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalInterest / cashflowView))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalInterest))}</td>
                    </tr>
                    <tr className="cf-muted cf-indent">
                      <td>— Principal portion</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalPrincipal / (cashflowView * 12)))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalPrincipal / cashflowView))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalPrincipal))}</td>
                    </tr>
                    <tr>
                      <td>Council Rates</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalCouncilRates / (cashflowView * 12)))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalCouncilRates / cashflowView))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalCouncilRates))}</td>
                    </tr>
                    <tr>
                      <td>Water Rates</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalWaterRates / (cashflowView * 12)))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalWaterRates / cashflowView))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalWaterRates))}</td>
                    </tr>
                    <tr>
                      <td>Insurance</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalInsurance / (cashflowView * 12)))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalInsurance / cashflowView))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalInsurance))}</td>
                    </tr>
                    <tr>
                      <td>Maintenance</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalMaintenance / (cashflowView * 12)))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalMaintenance / cashflowView))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalMaintenance))}</td>
                    </tr>
                    {hasStrata && (
                      <tr>
                        <td>Strata Fees</td>
                        <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalStrataFees / (cashflowView * 12)))}</td>
                        <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalStrataFees / cashflowView))}</td>
                        <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalStrataFees))}</td>
                      </tr>
                    )}
                    <tr className="cf-table-subtotal">
                      <td>Total Expenses</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalExpenses / (cashflowView * 12)))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalExpenses / cashflowView))}</td>
                      <td className="cf-tabular cf-bold">{formatCurrency(Math.round(aggregatedData.totalExpenses))}</td>
                    </tr>

                    {/* Pre-tax cashflow */}
                    <tr className="cf-table-highlight">
                      <td>Pre-Tax Cashflow</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalPreTaxCashflow / (cashflowView * 12)))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalPreTaxCashflow / cashflowView))}</td>
                      <td className="cf-tabular cf-bold">{formatCurrency(Math.round(aggregatedData.totalPreTaxCashflow))}</td>
                    </tr>

                    {/* Tax Benefits - Investment only */}
                    {isInvestment && aggregatedData.totalTaxBenefit > 0 && (
                      <>
                        <tr className="cf-table-section">
                          <td colSpan={4}>Tax Benefits</td>
                        </tr>
                        <tr>
                          <td>Interest Deduction</td>
                          <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalInterestDeduction / (cashflowView * 12)))}</td>
                          <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalInterestDeduction / cashflowView))}</td>
                          <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalInterestDeduction))}</td>
                        </tr>
                        {parseCurrency(depreciation) > 0 && (
                          <tr>
                            <td>Depreciation Deduction</td>
                            <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalDepreciationDeduction / (cashflowView * 12)))}</td>
                            <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalDepreciationDeduction / cashflowView))}</td>
                            <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalDepreciationDeduction))}</td>
                          </tr>
                        )}
                        <tr className="cf-table-subtotal">
                          <td>Total Tax Benefit</td>
                          <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalTaxBenefit / (cashflowView * 12)))}</td>
                          <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalTaxBenefit / cashflowView))}</td>
                          <td className="cf-tabular cf-bold">{formatCurrency(Math.round(aggregatedData.totalTaxBenefit))}</td>
                        </tr>
                      </>
                    )}

                    {/* Final Net Cashflow */}
                    <tr className="cf-table-total">
                      <td>Net Cashflow</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalNetCashflow / (cashflowView * 12)))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalNetCashflow / cashflowView))}</td>
                      <td className="cf-tabular">{formatCurrency(Math.round(aggregatedData.totalNetCashflow))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="cf-stats-row">
              {isInvestment && (
                <>
                  <div className="cf-stat-card">
                    <p className="cf-stat-label">Gross Yield</p>
                    <p className="cf-stat-value">{((parseCurrency(weeklyRent) * 52) / propertyValue * 100).toFixed(2)}%</p>
                  </div>
                  <div className="cf-stat-card">
                    <p className="cf-stat-label">Net Yield</p>
                    <p className="cf-stat-value">{(aggregatedData.totalNetRentalIncome / cashflowView / propertyValue * 100).toFixed(2)}%</p>
                  </div>
                </>
              )}
              {isNewPurchase && (
                <div className="cf-stat-card">
                  <p className="cf-stat-label">Total Upfront</p>
                  <p className="cf-stat-value">{formatCurrency(parseCurrency(depositAmount) + calculateStampDuty(parseCurrency(purchasePrice), isInvestment) + 5000)}</p>
                </div>
              )}
              <div className="cf-stat-card">
                <p className="cf-stat-label">Interest Paid ({cashflowView}yr)</p>
                <p className="cf-stat-value">{formatCurrency(Math.round(aggregatedData.totalInterest))}</p>
              </div>
            </div>

            {/* CGT Section - Investment only */}
            {isInvestment && (
              <div className="cf-card">
                <p className="cf-card-title">Capital Gains Tax (if sold at end of Year {cashflowView})</p>
                <div className="cf-cgt-grid">
                  <div>
                    <p className="cf-cgt-label">Cost Base</p>
                    <p className="cf-cgt-value">{formatCurrency(propertyValue + calculateStampDuty(propertyValue, true) + 5000)}</p>
                  </div>
                  <div>
                    <p className="cf-cgt-label">Capital Gain</p>
                    <p className="cf-cgt-value">{formatCurrency(Math.round(milestones.find(m => m.year >= cashflowView)?.propertyValue || propertyValue * Math.pow(1.035, cashflowView)) - propertyValue)}</p>
                  </div>
                  <div>
                    <p className="cf-cgt-label">CGT Discount</p>
                    <p className="cf-cgt-value">{cashflowView >= 1 ? "50%" : "0%"}</p>
                  </div>
                  <div>
                    <p className="cf-cgt-label">Discounted Gain</p>
                    <p className="cf-cgt-value">{formatCurrency(Math.round(((milestones.find(m => m.year >= cashflowView)?.propertyValue || propertyValue * Math.pow(1.035, cashflowView)) - propertyValue) * 0.5))}</p>
                  </div>
                  <div>
                    <p className="cf-cgt-label">Est. CGT Payable</p>
                    <p className="cf-cgt-value">{formatCurrency(Math.round(((milestones.find(m => m.year >= cashflowView)?.propertyValue || propertyValue * Math.pow(1.035, cashflowView)) - propertyValue) * 0.5 * getMarginalTaxRate(parseCurrency(taxableIncome))))}</p>
                  </div>
                  <div>
                    <p className="cf-cgt-label">Net Proceeds</p>
                    <p className="cf-cgt-value cf-bold">{formatCurrency(Math.round((milestones.find(m => m.year >= cashflowView)?.equity || 0) - ((milestones.find(m => m.year >= cashflowView)?.propertyValue || propertyValue * Math.pow(1.035, cashflowView)) - propertyValue) * 0.5 * getMarginalTaxRate(parseCurrency(taxableIncome))))}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
