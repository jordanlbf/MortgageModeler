"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowRight, Home, Building2, Sparkles, Landmark, Coins, Key, Calculator, Check } from "lucide-react";
import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyCf, formatCurrencyCf } from "@/lib/cashflow-calculations";

interface Props {
  s: CashflowState;
  currentStep: string;
  onStepComplete: () => void;
}

type StepId = "propertyUse" | "purchaseMode" | "property" | "loan" | "costs" | "rental" | "tax";

const STEP_META: Record<StepId, { title: string; subtitle: string; icon: React.ElementType; shortLabel: string }> = {
  propertyUse: {
    title: "How will you use this property?",
    subtitle: "This determines tax treatment and cashflow calculations",
    icon: Home,
    shortLabel: "Use",
  },
  purchaseMode: {
    title: "Is this a new purchase?",
    subtitle: "We'll tailor the inputs based on your situation",
    icon: Sparkles,
    shortLabel: "Type",
  },
  property: {
    title: "Property Details",
    subtitle: "Enter the key financials for your property",
    icon: Building2,
    shortLabel: "Property",
  },
  loan: {
    title: "Loan Structure",
    subtitle: "Configure your mortgage details",
    icon: Landmark,
    shortLabel: "Loan",
  },
  costs: {
    title: "Ongoing Costs",
    subtitle: "Annual expenses for maintaining the property",
    icon: Coins,
    shortLabel: "Costs",
  },
  rental: {
    title: "Rental Income",
    subtitle: "Expected rental returns and management",
    icon: Key,
    shortLabel: "Rental",
  },
  tax: {
    title: "Tax Profile",
    subtitle: "Your income details for tax benefit calculations",
    icon: Calculator,
    shortLabel: "Tax",
  },
};

// Get steps based on property type (investment has more steps)
function getStepOrder(isInvestment: boolean): StepId[] {
  const base: StepId[] = ["propertyUse", "purchaseMode", "property", "loan", "costs"];
  if (isInvestment) {
    return [...base, "rental", "tax"];
  }
  return base;
}

export default function CashflowWizardStep({ s, currentStep, onStepComplete }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const step = currentStep as StepId;
  const meta = STEP_META[step];
  const Icon = meta?.icon || Home;

  // Calculate step order and progress
  const stepOrder = useMemo(() => getStepOrder(s.isInvestment), [s.isInvestment]);
  const currentStepIndex = stepOrder.indexOf(step);
  const totalSteps = stepOrder.length;

  useEffect(() => {
    // Animate in on mount
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleContinue = () => {
    setIsVisible(false);
    setTimeout(() => {
      onStepComplete();
    }, 200);
  };

  if (!meta) return null;

  return (
    <div className="cf-wizard-container">
      {/* Progress indicator */}
      <div className="cf-wizard-progress">
        <div className="cf-wizard-progress-steps">
          {stepOrder.map((stepId, index) => {
            const stepMeta = STEP_META[stepId];
            const StepIcon = stepMeta.icon;
            const isComplete = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isFuture = index > currentStepIndex;

            return (
              <div key={stepId} className="cf-wizard-progress-step-wrapper">
                <div
                  className={`cf-wizard-progress-step ${isComplete ? "complete" : ""} ${isCurrent ? "current" : ""} ${isFuture ? "future" : ""}`}
                >
                  <div className="cf-wizard-progress-icon">
                    {isComplete ? <Check size={14} /> : <StepIcon size={14} />}
                  </div>
                  <span className="cf-wizard-progress-label">{stepMeta.shortLabel}</span>
                </div>
                {index < stepOrder.length - 1 && (
                  <div className={`cf-wizard-progress-line ${isComplete ? "complete" : ""}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="cf-wizard-progress-text">
          Step {currentStepIndex + 1} of {totalSteps}
        </div>
      </div>

      {/* Card */}
      <div className={`cf-wizard-card ${isVisible ? "visible" : ""}`}>
        {/* Header */}
        <div className="cf-wizard-header">
          <div className="cf-wizard-icon">
            <Icon size={24} />
          </div>
          <h2 className="cf-wizard-title">{meta.title}</h2>
          <p className="cf-wizard-subtitle">{meta.subtitle}</p>
        </div>

        {/* Content */}
        <div className="cf-wizard-content">
          {step === "propertyUse" && (
            <div className="cf-wizard-options">
              <button
                className={`cf-wizard-option ${s.propertyUse === "investment" ? "selected" : ""}`}
                onClick={() => s.setPropertyUse("investment")}
              >
                <Building2 size={28} />
                <span className="cf-wizard-option-title">Investment</span>
                <span className="cf-wizard-option-desc">Rental property for income and growth</span>
              </button>
              <button
                className={`cf-wizard-option ${s.propertyUse === "ppor" ? "selected" : ""}`}
                onClick={() => s.setPropertyUse("ppor")}
              >
                <Home size={28} />
                <span className="cf-wizard-option-title">Owner-Occupier</span>
                <span className="cf-wizard-option-desc">Your primary place of residence</span>
              </button>
            </div>
          )}

          {step === "purchaseMode" && (
            <div className="cf-wizard-options">
              <button
                className={`cf-wizard-option ${s.purchaseMode === "new" ? "selected" : ""}`}
                onClick={() => s.setPurchaseMode("new")}
              >
                <Sparkles size={28} />
                <span className="cf-wizard-option-title">New Purchase</span>
                <span className="cf-wizard-option-desc">I&apos;m buying a new property</span>
              </button>
              <button
                className={`cf-wizard-option ${s.purchaseMode === "existing" ? "selected" : ""}`}
                onClick={() => s.setPurchaseMode("existing")}
              >
                <Building2 size={28} />
                <span className="cf-wizard-option-title">Existing Property</span>
                <span className="cf-wizard-option-desc">I already own this property</span>
              </button>
            </div>
          )}

          {step === "property" && (
            <div className="cf-wizard-fields">
              {s.isNewPurchase ? (
                <>
                  <div className="cf-wizard-field">
                    <label className="cf-wizard-label">Purchase Price</label>
                    <input
                      type="text"
                      className="cf-wizard-input"
                      value={`$${parseCurrencyCf(s.purchasePrice).toLocaleString()}`}
                      onChange={(e) => s.setPurchasePrice(e.target.value)}
                    />
                  </div>
                  <div className="cf-wizard-field">
                    <label className="cf-wizard-label">Deposit Amount</label>
                    <input
                      type="text"
                      className="cf-wizard-input"
                      value={`$${parseCurrencyCf(s.depositAmount).toLocaleString()}`}
                      onChange={(e) => s.setDepositAmount(e.target.value)}
                    />
                  </div>
                  <div className="cf-wizard-computed">
                    <div className="cf-wizard-computed-item">
                      <span className="cf-wizard-computed-label">Loan Amount</span>
                      <span className="cf-wizard-computed-value">
                        {formatCurrencyCf(parseCurrencyCf(s.purchasePrice) - parseCurrencyCf(s.depositAmount))}
                      </span>
                    </div>
                    <div className="cf-wizard-computed-item">
                      <span className="cf-wizard-computed-label">LVR</span>
                      <span className="cf-wizard-computed-value">
                        {((1 - parseCurrencyCf(s.depositAmount) / parseCurrencyCf(s.purchasePrice)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="cf-wizard-field">
                    <label className="cf-wizard-label">Current Value</label>
                    <input
                      type="text"
                      className="cf-wizard-input"
                      value={`$${parseCurrencyCf(s.currentValue).toLocaleString()}`}
                      onChange={(e) => s.setCurrentValue(e.target.value)}
                    />
                  </div>
                  <div className="cf-wizard-field">
                    <label className="cf-wizard-label">Original Purchase Price</label>
                    <input
                      type="text"
                      className="cf-wizard-input"
                      value={`$${parseCurrencyCf(s.originalPurchasePrice).toLocaleString()}`}
                      onChange={(e) => s.setOriginalPurchasePrice(e.target.value)}
                    />
                  </div>
                  <div className="cf-wizard-field">
                    <label className="cf-wizard-label">Current Loan Balance</label>
                    <input
                      type="text"
                      className="cf-wizard-input"
                      value={`$${parseCurrencyCf(s.currentLoanBalance).toLocaleString()}`}
                      onChange={(e) => s.setCurrentLoanBalance(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {step === "loan" && (
            <div className="cf-wizard-fields">
              <div className="cf-wizard-field-row">
                <div className="cf-wizard-field">
                  <label className="cf-wizard-label">Interest Rate (%)</label>
                  <input
                    type="text"
                    className="cf-wizard-input"
                    value={s.interestRate}
                    onChange={(e) => s.setInterestRate(e.target.value)}
                  />
                </div>
                <div className="cf-wizard-field">
                  <label className="cf-wizard-label">Loan Term (years)</label>
                  <input
                    type="text"
                    className="cf-wizard-input"
                    value={s.loanTerm}
                    onChange={(e) => s.setLoanTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="cf-wizard-field">
                <label className="cf-wizard-label">Loan Type</label>
                <div className="cf-wizard-toggle-group">
                  <button
                    className={`cf-wizard-toggle ${s.loanType === "principal-interest" ? "active" : ""}`}
                    onClick={() => s.setLoanType("principal-interest")}
                  >
                    Principal & Interest
                  </button>
                  <button
                    className={`cf-wizard-toggle ${s.loanType === "interest-only" ? "active" : ""}`}
                    onClick={() => s.setLoanType("interest-only")}
                  >
                    Interest Only
                  </button>
                </div>
              </div>
              {s.loanType === "interest-only" && (
                <div className="cf-wizard-field">
                  <label className="cf-wizard-label">IO Period (years)</label>
                  <input
                    type="text"
                    className="cf-wizard-input"
                    value={s.ioPeriod}
                    onChange={(e) => s.setIoPeriod(e.target.value)}
                  />
                </div>
              )}
              <div className="cf-wizard-checkbox-row">
                <label className="cf-wizard-checkbox">
                  <input
                    type="checkbox"
                    checked={s.hasOffset}
                    onChange={(e) => s.setHasOffset(e.target.checked)}
                  />
                  <span className="cf-wizard-checkbox-box" />
                  Offset Account
                </label>
              </div>
              {s.hasOffset && (
                <div className="cf-wizard-field">
                  <label className="cf-wizard-label">Offset Balance</label>
                  <input
                    type="text"
                    className="cf-wizard-input"
                    value={`$${parseCurrencyCf(s.offsetBalance).toLocaleString()}`}
                    onChange={(e) => s.setOffsetBalance(e.target.value)}
                  />
                </div>
              )}
              <div className="cf-wizard-field">
                <label className="cf-wizard-label">Extra Repayments (monthly)</label>
                <input
                  type="text"
                  className="cf-wizard-input"
                  value={`$${parseCurrencyCf(s.extraRepayments).toLocaleString()}`}
                  onChange={(e) => s.setExtraRepayments(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === "costs" && (
            <div className="cf-wizard-fields">
              <div className="cf-wizard-field-row">
                <div className="cf-wizard-field">
                  <label className="cf-wizard-label">Council Rates (p.a.)</label>
                  <input
                    type="text"
                    className="cf-wizard-input"
                    value={`$${parseCurrencyCf(s.councilRates).toLocaleString()}`}
                    onChange={(e) => s.setCouncilRates(e.target.value)}
                  />
                </div>
                <div className="cf-wizard-field">
                  <label className="cf-wizard-label">Water Rates (p.a.)</label>
                  <input
                    type="text"
                    className="cf-wizard-input"
                    value={`$${parseCurrencyCf(s.waterRates).toLocaleString()}`}
                    onChange={(e) => s.setWaterRates(e.target.value)}
                  />
                </div>
              </div>
              <div className="cf-wizard-field-row">
                <div className="cf-wizard-field">
                  <label className="cf-wizard-label">Insurance (p.a.)</label>
                  <input
                    type="text"
                    className="cf-wizard-input"
                    value={`$${parseCurrencyCf(s.insurance).toLocaleString()}`}
                    onChange={(e) => s.setInsurance(e.target.value)}
                  />
                </div>
                <div className="cf-wizard-field">
                  <label className="cf-wizard-label">Maintenance (%)</label>
                  <input
                    type="text"
                    className="cf-wizard-input"
                    value={s.maintenance}
                    onChange={(e) => s.setMaintenance(e.target.value)}
                  />
                </div>
              </div>
              <div className="cf-wizard-checkbox-row">
                <label className="cf-wizard-checkbox">
                  <input
                    type="checkbox"
                    checked={s.hasStrata}
                    onChange={(e) => s.setHasStrata(e.target.checked)}
                  />
                  <span className="cf-wizard-checkbox-box" />
                  Strata / Body Corp
                </label>
              </div>
              {s.hasStrata && (
                <div className="cf-wizard-field">
                  <label className="cf-wizard-label">Strata Fees (quarterly)</label>
                  <input
                    type="text"
                    className="cf-wizard-input"
                    value={`$${parseCurrencyCf(s.strataFees).toLocaleString()}`}
                    onChange={(e) => s.setStrataFees(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {step === "rental" && (
            <div className="cf-wizard-fields">
              <div className="cf-wizard-field">
                <label className="cf-wizard-label">Weekly Rent</label>
                <input
                  type="text"
                  className="cf-wizard-input"
                  value={`$${parseCurrencyCf(s.weeklyRent).toLocaleString()}`}
                  onChange={(e) => s.setWeeklyRent(e.target.value)}
                />
              </div>
              <div className="cf-wizard-field">
                <label className="cf-wizard-label">Vacancy Rate (%)</label>
                <input
                  type="text"
                  className="cf-wizard-input"
                  value={s.vacancyRate}
                  onChange={(e) => s.setVacancyRate(e.target.value)}
                />
              </div>
              <div className="cf-wizard-checkbox-row">
                <label className="cf-wizard-checkbox">
                  <input
                    type="checkbox"
                    checked={s.usePropertyManager}
                    onChange={(e) => s.setUsePropertyManager(e.target.checked)}
                  />
                  <span className="cf-wizard-checkbox-box" />
                  Property Manager
                </label>
              </div>
              {s.usePropertyManager && (
                <div className="cf-wizard-field">
                  <label className="cf-wizard-label">Management Fee (%)</label>
                  <input
                    type="text"
                    className="cf-wizard-input"
                    value={s.managementFee}
                    onChange={(e) => s.setManagementFee(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {step === "tax" && (
            <div className="cf-wizard-fields">
              <div className="cf-wizard-field">
                <label className="cf-wizard-label">Taxable Income (p.a.)</label>
                <input
                  type="text"
                  className="cf-wizard-input"
                  value={`$${parseCurrencyCf(s.taxableIncome).toLocaleString()}`}
                  onChange={(e) => s.setTaxableIncome(e.target.value)}
                />
              </div>
              <div className="cf-wizard-field">
                <label className="cf-wizard-label">Depreciation (p.a.)</label>
                <input
                  type="text"
                  className="cf-wizard-input"
                  value={`$${parseCurrencyCf(s.depreciation).toLocaleString()}`}
                  onChange={(e) => s.setDepreciation(e.target.value)}
                />
              </div>
              <div className="cf-wizard-field">
                <label className="cf-wizard-label">Capital Growth Assumption (%)</label>
                <input
                  type="text"
                  className="cf-wizard-input"
                  value={s.capitalGrowth}
                  onChange={(e) => s.setCapitalGrowth(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cf-wizard-footer">
          <button
            className="cf-wizard-continue"
            onClick={handleContinue}
            disabled={
              (step === "propertyUse" && !s.propertyUse) ||
              (step === "purchaseMode" && !s.purchaseMode)
            }
          >
            {step === "tax" || (!s.isInvestment && step === "costs") ? "Calculate" : "Continue"}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

