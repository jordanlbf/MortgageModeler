"use client";

import { useMemo } from "react";
import { ArrowRight, X, Home, Building2, Sparkles, Landmark, Coins, Key, Calculator } from "lucide-react";
import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyCf, formatCurrencyCf } from "@/lib/cashflow-calculations";

interface Props {
  s: CashflowState;
  currentStep: string;
  onStepComplete: () => void;
  onStepBack: () => void;
  canGoBack: boolean;
  isModal?: boolean;
}

type StepId = "setup" | "property" | "loan" | "costs" | "rental" | "tax";

const STEP_META: Record<StepId, { title: string; subtitle: string; icon: React.ElementType }> = {
  setup:    { title: "Property Setup",   subtitle: "",  icon: Home       },
  property: { title: "Property",         subtitle: "",  icon: Building2  },
  loan:     { title: "Loan",             subtitle: "",  icon: Landmark   },
  costs:    { title: "Costs",            subtitle: "",  icon: Coins      },
  rental:   { title: "Rental Income",    subtitle: "",  icon: Key        },
  tax:      { title: "Tax",              subtitle: "",  icon: Calculator },
};

function getStepOrder(isInvestment: boolean): StepId[] {
  const base: StepId[] = ["setup", "property", "loan", "costs"];
  if (isInvestment) return [...base, "rental", "tax"];
  return base;
}

export default function CashflowWizardStep({ s, currentStep, onStepComplete, onStepBack, canGoBack, isModal }: Props) {
  const step = currentStep as StepId;
  const meta = STEP_META[step];

  const stepOrder = useMemo(() => getStepOrder(s.isInvestment), [s.isInvestment]);
  const currentStepIndex = stepOrder.indexOf(step);

  const handleContinue = () => {
    onStepComplete();
  };

  if (!meta) return null;

  const fieldsContent = (
    <>
      {step === "setup" && (
        <div className="cf-wiz-fields">
          <div className="cf-wiz-field-group">
            <span className="cf-wiz-field-label">Property type</span>
            <div className="cf-wiz-option-row">
              <button
                className={`cf-wiz-opt ${s.propertyUse === "investment" ? "selected" : ""}`}
                onClick={() => { s.setPropertyUse("investment"); s.setPurchaseMode(null); }}
              >
                <Building2 size={18} />
                <span>Investment</span>
              </button>
              <button
                className={`cf-wiz-opt ${s.propertyUse === "ppor" ? "selected" : ""}`}
                onClick={() => { s.setPropertyUse("ppor"); s.setPurchaseMode(null); }}
              >
                <Home size={18} />
                <span>Owner-occupier</span>
              </button>
            </div>
          </div>
          {s.propertyUse && (
            <div className="cf-wiz-field-group">
              <span className="cf-wiz-field-label">Purchase type</span>
              <div className="cf-wiz-option-row">
                <button
                  className={`cf-wiz-opt ${s.purchaseMode === "new" ? "selected" : ""}`}
                  onClick={() => s.setPurchaseMode("new")}
                >
                  <Sparkles size={18} />
                  <span>New purchase</span>
                </button>
                <button
                  className={`cf-wiz-opt ${s.purchaseMode === "existing" ? "selected" : ""}`}
                  onClick={() => s.setPurchaseMode("existing")}
                >
                  <Building2 size={18} />
                  <span>Existing property</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === "property" && (
        <>
          {s.isNewPurchase ? (
            <div className="cf-wiz-fields">
              <div className="cf-wiz-input-row">
                <div className="cf-wiz-input-field">
                  <label className="cf-wiz-input-label">Purchase price</label>
                  <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.purchasePrice).toLocaleString()}`} onChange={(e) => s.setPurchasePrice(e.target.value)} />
                </div>
                <div className="cf-wiz-input-field">
                  <label className="cf-wiz-input-label">Deposit</label>
                  <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.depositAmount).toLocaleString()}`} onChange={(e) => s.setDepositAmount(e.target.value)} />
                </div>
              </div>
              <div className="cf-wiz-summary-strip">
                <div className="cf-wiz-summary-item">
                  <span className="cf-wiz-summary-label">Loan amount</span>
                  <span className="cf-wiz-summary-value">{formatCurrencyCf(parseCurrencyCf(s.purchasePrice) - parseCurrencyCf(s.depositAmount))}</span>
                </div>
                <div className="cf-wiz-summary-divider" />
                <div className="cf-wiz-summary-item">
                  <span className="cf-wiz-summary-label">LVR</span>
                  <span className="cf-wiz-summary-value">{parseCurrencyCf(s.purchasePrice) > 0 ? ((1 - parseCurrencyCf(s.depositAmount) / parseCurrencyCf(s.purchasePrice)) * 100).toFixed(1) : "0.0"}%</span>
                </div>
                <div className="cf-wiz-summary-divider" />
                <div className="cf-wiz-summary-item">
                  <span className="cf-wiz-summary-label">Deposit</span>
                  <span className="cf-wiz-summary-value">{parseCurrencyCf(s.purchasePrice) > 0 ? ((parseCurrencyCf(s.depositAmount) / parseCurrencyCf(s.purchasePrice)) * 100).toFixed(1) : "0.0"}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="cf-wiz-fields">
              <div className="cf-wiz-input-row">
                <div className="cf-wiz-input-field">
                  <label className="cf-wiz-input-label">Current value</label>
                  <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.currentValue).toLocaleString()}`} onChange={(e) => s.setCurrentValue(e.target.value)} />
                </div>
                <div className="cf-wiz-input-field">
                  <label className="cf-wiz-input-label">Loan balance</label>
                  <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.currentLoanBalance).toLocaleString()}`} onChange={(e) => s.setCurrentLoanBalance(e.target.value)} />
                </div>
              </div>
              <div className="cf-wiz-input-field">
                <label className="cf-wiz-input-label">Original purchase price</label>
                <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.originalPurchasePrice).toLocaleString()}`} onChange={(e) => s.setOriginalPurchasePrice(e.target.value)} />
              </div>
              <div className="cf-wiz-input-field">
                <label className="cf-wiz-input-label">Year purchased</label>
                <input type="text" className="cf-wiz-input" value={s.purchaseYear} onChange={(e) => s.setPurchaseYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2021" />
              </div>
              <div className="cf-wiz-summary-strip">
                <div className="cf-wiz-summary-item">
                  <span className="cf-wiz-summary-label">Equity</span>
                  <span className="cf-wiz-summary-value">{formatCurrencyCf(parseCurrencyCf(s.currentValue) - parseCurrencyCf(s.currentLoanBalance))}</span>
                </div>
                <div className="cf-wiz-summary-divider" />
                <div className="cf-wiz-summary-item">
                  <span className="cf-wiz-summary-label">LVR</span>
                  <span className="cf-wiz-summary-value">{parseCurrencyCf(s.currentValue) > 0 ? (parseCurrencyCf(s.currentLoanBalance) / parseCurrencyCf(s.currentValue) * 100).toFixed(1) : "0.0"}%</span>
                </div>
                <div className="cf-wiz-summary-divider" />
                <div className="cf-wiz-summary-item">
                  <span className="cf-wiz-summary-label">Growth</span>
                  <span className="cf-wiz-summary-value">{parseCurrencyCf(s.originalPurchasePrice) > 0 ? formatCurrencyCf(parseCurrencyCf(s.currentValue) - parseCurrencyCf(s.originalPurchasePrice)) : "—"}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {step === "loan" && (() => {
        const principal = s.isNewPurchase
          ? parseCurrencyCf(s.purchasePrice) - parseCurrencyCf(s.depositAmount)
          : parseCurrencyCf(s.currentLoanBalance);
        const rate = parseFloat(s.interestRate) / 100 / 12;
        const n = parseFloat(s.loanTerm) * 12;
        const offset = parseCurrencyCf(s.offsetBalance);
        const effectivePrincipal = Math.max(0, principal - (s.hasOffset ? offset : 0));
        let monthlyRepayment = 0;
        if (rate > 0 && n > 0) {
          monthlyRepayment = effectivePrincipal * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
        }
        const monthlyInterest = effectivePrincipal * (parseFloat(s.interestRate) / 100 / 12);
        const monthlyPrincipal = monthlyRepayment - monthlyInterest;

        return (
          <div className="cf-wiz-fields">
            {/* Live repayment banner */}
            <div className="cf-wiz-loan-banner">
              <div className="cf-wiz-loan-banner-main">
                <span className="cf-wiz-loan-banner-amount">{formatCurrencyCf(monthlyRepayment)}</span>
                <span className="cf-wiz-loan-banner-label">/ month</span>
              </div>
              <div className="cf-wiz-loan-banner-breakdown">
                <span className="cf-wiz-loan-banner-sub">{formatCurrencyCf(monthlyInterest)} interest</span>
                <span className="cf-wiz-loan-banner-dot">·</span>
                <span className="cf-wiz-loan-banner-sub">{formatCurrencyCf(monthlyPrincipal)} principal</span>
              </div>
            </div>

            {/* Rate & term */}
            <div className="cf-wiz-input-row">
              <div className="cf-wiz-input-field">
                <label className="cf-wiz-input-label">Interest rate</label>
                <div className="cf-wiz-input-wrap">
                  <input type="text" className="cf-wiz-input cf-wiz-input-suffix" value={s.interestRate} onChange={(e) => s.setInterestRate(e.target.value)} />
                  <span className="cf-wiz-input-unit">%</span>
                </div>
              </div>
              <div className="cf-wiz-input-field">
                <label className="cf-wiz-input-label">Loan term</label>
                <div className="cf-wiz-input-wrap">
                  <input type="text" className="cf-wiz-input cf-wiz-input-suffix" value={s.loanTerm} onChange={(e) => s.setLoanTerm(e.target.value)} />
                  <span className="cf-wiz-input-unit">yrs</span>
                </div>
              </div>
            </div>

            {/* Offset & extras */}
            <div className="cf-wiz-section-divider" />
            <div className="cf-wiz-checkbox-row">
              <label className="cf-wiz-checkbox">
                <input type="checkbox" checked={s.hasOffset} onChange={(e) => s.setHasOffset(e.target.checked)} />
                <span className="cf-wiz-checkbox-box" />
                Offset account
              </label>
            </div>
            {s.hasOffset && (
              <div className="cf-wiz-input-field">
                <label className="cf-wiz-input-label">Offset balance</label>
                <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.offsetBalance).toLocaleString()}`} onChange={(e) => s.setOffsetBalance(e.target.value)} />
              </div>
            )}
            <div className="cf-wiz-input-field">
              <label className="cf-wiz-input-label">Extra repayments / month</label>
              <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.extraRepayments).toLocaleString()}`} onChange={(e) => s.setExtraRepayments(e.target.value)} />
            </div>
          </div>
        );
      })()}

      {step === "costs" && (
        <div className="cf-wiz-fields">
          <div className="cf-wiz-input-row">
            <div className="cf-wiz-input-field">
              <label className="cf-wiz-input-label">Council rates (p.a.)</label>
              <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.councilRates).toLocaleString()}`} onChange={(e) => s.setCouncilRates(e.target.value)} />
            </div>
            <div className="cf-wiz-input-field">
              <label className="cf-wiz-input-label">Water rates (p.a.)</label>
              <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.waterRates).toLocaleString()}`} onChange={(e) => s.setWaterRates(e.target.value)} />
            </div>
          </div>
          <div className="cf-wiz-input-row">
            <div className="cf-wiz-input-field">
              <label className="cf-wiz-input-label">Insurance (p.a.)</label>
              <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.insurance).toLocaleString()}`} onChange={(e) => s.setInsurance(e.target.value)} />
            </div>
            <div className="cf-wiz-input-field">
              <label className="cf-wiz-input-label">Maintenance (%)</label>
              <input type="text" className="cf-wiz-input" value={s.maintenance} onChange={(e) => s.setMaintenance(e.target.value)} />
            </div>
          </div>
          <div className="cf-wiz-checkbox-row">
            <label className="cf-wiz-checkbox">
              <input type="checkbox" checked={s.hasStrata} onChange={(e) => s.setHasStrata(e.target.checked)} />
              <span className="cf-wiz-checkbox-box" />
              Strata / Body corp
            </label>
          </div>
          {s.hasStrata && (
            <div className="cf-wiz-input-field">
              <label className="cf-wiz-input-label">Strata fees (quarterly)</label>
              <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.strataFees).toLocaleString()}`} onChange={(e) => s.setStrataFees(e.target.value)} />
            </div>
          )}
        </div>
      )}

      {step === "rental" && (
        <div className="cf-wiz-fields">
          <div className="cf-wiz-input-field">
            <label className="cf-wiz-input-label">Weekly rent</label>
            <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.weeklyRent).toLocaleString()}`} onChange={(e) => s.setWeeklyRent(e.target.value)} />
          </div>
          <div className="cf-wiz-input-field">
            <label className="cf-wiz-input-label">Vacancy rate (%)</label>
            <input type="text" className="cf-wiz-input" value={s.vacancyRate} onChange={(e) => s.setVacancyRate(e.target.value)} />
          </div>
          <div className="cf-wiz-checkbox-row">
            <label className="cf-wiz-checkbox">
              <input type="checkbox" checked={s.usePropertyManager} onChange={(e) => s.setUsePropertyManager(e.target.checked)} />
              <span className="cf-wiz-checkbox-box" />
              Property manager
            </label>
          </div>
          {s.usePropertyManager && (
            <div className="cf-wiz-input-field">
              <label className="cf-wiz-input-label">Management fee (%)</label>
              <input type="text" className="cf-wiz-input" value={s.managementFee} onChange={(e) => s.setManagementFee(e.target.value)} />
            </div>
          )}
        </div>
      )}

      {step === "tax" && (
        <div className="cf-wiz-fields">
          <div className="cf-wiz-input-field">
            <label className="cf-wiz-input-label">Taxable income (p.a.)</label>
            <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.taxableIncome).toLocaleString()}`} onChange={(e) => s.setTaxableIncome(e.target.value)} />
          </div>
          <div className="cf-wiz-input-field">
            <label className="cf-wiz-input-label">Depreciation (p.a.)</label>
            <input type="text" className="cf-wiz-input" value={`$${parseCurrencyCf(s.depreciation).toLocaleString()}`} onChange={(e) => s.setDepreciation(e.target.value)} />
          </div>
          <div className="cf-wiz-input-field">
            <label className="cf-wiz-input-label">Capital growth assumption (%)</label>
            <input type="text" className="cf-wiz-input" value={s.capitalGrowth} onChange={(e) => s.setCapitalGrowth(e.target.value)} />
          </div>
        </div>
      )}
    </>
  );

  const footerContent = (
    <div className="cf-wiz-footer">
      {canGoBack && (
        <button className="cf-wiz-back" onClick={onStepBack}>
          {isModal ? <X size={16} /> : null}
          {isModal ? "Cancel" : "Back"}
        </button>
      )}
      <button className="cf-wiz-continue" onClick={handleContinue} disabled={step === "setup" && (!s.propertyUse || !s.purchaseMode)}>
        {isModal ? "Save" : (step === "tax" || (!s.isInvestment && step === "costs") ? "Calculate" : "Continue")}
        <ArrowRight size={16} />
      </button>
    </div>
  );

  return (
    <div className="cf-wiz-container">
      <div className="cf-wiz-wrap">
        {/* Breadcrumb progress indicator */}
        <div className="cf-wiz-breadcrumb">
          <span className="cf-wiz-breadcrumb-step">Step {currentStepIndex + 1} of {stepOrder.length}</span>
          <span className="cf-wiz-breadcrumb-divider">·</span>
          <span className="cf-wiz-breadcrumb-title">{meta.title}</span>
        </div>

        {/* Card */}
        <div className={`cf-wiz-card ${step === "setup" ? "cf-wiz-card--centered" : ""}`}>
          <div className="cf-wiz-content">{fieldsContent}</div>
          {footerContent}
        </div>
      </div>
    </div>
  );
}
