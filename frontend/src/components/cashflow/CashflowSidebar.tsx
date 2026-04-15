"use client";

import { useState } from "react";
import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyCf, formatCurrencyCf } from "@/lib/cashflow-calculations";
import {
  Home,
  DollarSign,
  Percent,
  Receipt,
  Building2,
  Calculator,
  Check,
  ChevronDown,
  ChevronRight
} from "lucide-react";

import type { StepId } from "@/lib/cashflow-types";

const WIZARD_STEPS: { id: StepId; label: string; icon: typeof Home }[] = [
  { id: "setup", label: "Property Setup", icon: Home },
  { id: "property", label: "Property Details", icon: Building2 },
  { id: "loan", label: "Loan Terms", icon: Percent },
  { id: "costs", label: "Running Costs", icon: Receipt },
  { id: "rental", label: "Rental Income", icon: DollarSign },
  { id: "tax", label: "Tax Details", icon: Calculator },
];

function getWizardSteps(isInvestment: boolean) {
  if (isInvestment) return WIZARD_STEPS;
  return WIZARD_STEPS.filter(s => s.id !== "rental" && s.id !== "tax");
}

function getNaturalStepIndex(s: CashflowState): number {
  if (!s.propertyUse || !s.purchaseMode) return 0;
  if (!s.propertyComplete) return 1;
  if (!s.loanComplete) return 2;
  if (!s.costsComplete) return 3;
  if (s.isInvestment && !s.rentalComplete) return 4;
  if (s.isInvestment && !s.taxComplete) return 5;
  return -1;
}

type StepLine =
  | { primary: true; text: string }
  | { primary?: false; value: string; descriptor: string };

function getStepLines(stepId: StepId, s: CashflowState): StepLine[] | null {
  switch (stepId) {
    case "setup": {
      if (!s.propertyUse || !s.purchaseMode) return null;
      return [
        { primary: true, text: s.propertyUse === "investment" ? "Investment Property" : "Owner-Occupier" },
        { value: s.purchaseMode === "new" ? "New" : "Existing", descriptor: "Purchase" },
      ];
    }
    case "property": {
      if (!s.propertyComplete) return null;
      if (s.isNewPurchase) {
        const price = parseCurrencyCf(s.purchasePrice);
        const deposit = parseCurrencyCf(s.depositAmount);
        const loanAmt = price - deposit;
        const lvr = price > 0 ? Math.round((loanAmt / price) * 100) : 0;
        return [
          { primary: true, text: `${formatCurrencyCf(price)} Purchase Price` },
          { value: formatCurrencyCf(loanAmt), descriptor: "Loan Balance" },
          { value: `${lvr}%`, descriptor: "LVR" },
        ];
      } else {
        const value = parseCurrencyCf(s.currentValue);
        const loan = parseCurrencyCf(s.currentLoanBalance);
        const equity = value - loan;
        const lvr = value > 0 ? Math.round((loan / value) * 100) : 0;
        return [
          { primary: true, text: `${formatCurrencyCf(value)} Current Value` },
          { value: formatCurrencyCf(equity), descriptor: "Equity" },
          { value: `${lvr}%`, descriptor: "LVR" },
        ];
      }
    }
    case "loan": {
      if (!s.loanComplete) return null;
      const loanAmt = s.isNewPurchase
        ? parseCurrencyCf(s.purchasePrice) - parseCurrencyCf(s.depositAmount)
        : parseCurrencyCf(s.currentLoanBalance);
      const rate = parseFloat(s.interestRate) / 100 / 12;
      const n = parseInt(s.loanTerm) * 12;
      const monthly = rate > 0 ? Math.round((loanAmt * rate) / (1 - Math.pow(1 + rate, -n))) : 0;
      return [
        { primary: true, text: `${s.interestRate}% Interest Rate` },
        { value: `${s.loanTerm} Year`, descriptor: "Loan Term" },
        { value: formatCurrencyCf(monthly), descriptor: "/ mo Repayment" },
      ];
    }
    case "costs": {
      if (!s.costsComplete) return null;
      const council = parseCurrencyCf(s.councilRates);
      const water = parseCurrencyCf(s.waterRates);
      const insurance = parseCurrencyCf(s.insurance);
      const strata = s.hasStrata ? parseCurrencyCf(s.strataFees) * 4 : 0;
      const total = council + water + insurance + strata;
      const lines: StepLine[] = [
        { primary: true, text: `${formatCurrencyCf(total)} Annual Costs` },
        { value: formatCurrencyCf(council), descriptor: "Council" },
        { value: formatCurrencyCf(insurance), descriptor: "Insurance" },
      ];
      if (s.hasStrata) lines.push({ value: formatCurrencyCf(strata), descriptor: "Strata / yr" });
      return lines;
    }
    case "rental": {
      if (!s.rentalComplete) return null;
      const weekly = parseCurrencyCf(s.weeklyRent);
      const annual = weekly * 52;
      const mgmt = parseFloat(s.managementFee) || 0;
      const netAnnual = annual * (1 - mgmt / 100);
      return [
        { primary: true, text: `${formatCurrencyCf(weekly)} / wk Rent` },
        { value: formatCurrencyCf(Math.round(netAnnual)), descriptor: "Net Annual" },
        { value: `${mgmt}%`, descriptor: "Management" },
      ];
    }
    case "tax": {
      if (!s.taxComplete) return null;
      const income = parseCurrencyCf(s.taxableIncome);
      const rate =
        income > 180000 ? "45%" :
        income > 120000 ? "37%" :
        income > 45000  ? "32.5%" : "19%";
      return [
        { primary: true, text: `${formatCurrencyCf(income)} Taxable Income` },
        { value: rate, descriptor: "Tax Bracket" },
      ];
    }
    default:
      return null;
  }
}

interface Props {
  s: CashflowState;
  currentStep?: string;
  onStepClick?: (step: StepId) => void;
}

function StepIndicator({
  index,
  isComplete,
  isCurrent,
  Icon,
  isLast
}: {
  index: number;
  isComplete: boolean;
  isCurrent: boolean;
  Icon: typeof Home;
  isLast: boolean;
}) {
  return (
    <div className="cf-step-indicator-wrap">
      <div className={[
        "cf-step-indicator",
        isComplete && "complete",
        isCurrent && "current"
      ].filter(Boolean).join(" ")}>
        {isComplete ? (
          <Check size={14} strokeWidth={2.5} />
        ) : (
          <Icon size={14} strokeWidth={1.5} />
        )}
      </div>
      {!isLast && (
        <div className={[
          "cf-step-connector",
          isComplete && "complete"
        ].filter(Boolean).join(" ")} />
      )}
    </div>
  );
}

function StepBody({
  step,
  lines,
  isComplete,
  isExpanded,
  onToggle
}: {
  step: { id: StepId; label: string; icon: typeof Home };
  lines: StepLine[] | null;
  isComplete: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const primary = lines?.find(l => l.primary) as { primary: true; text: string } | undefined;
  const secondary = lines?.filter(l => !l.primary) as { value: string; descriptor: string }[];
  const hasDetails = secondary?.length > 0;

  return (
    <div className="cf-sidebar-step-body">
      <div className="cf-sidebar-step-header">
        <span className="cf-sidebar-step-label">
          {primary ? primary.text : step.label}
        </span>
        {isComplete && hasDetails && (
          <span
            className="cf-step-toggle"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onToggle();
              }
            }}
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
      </div>
      {hasDetails && (
        <div className={[
          "cf-sidebar-step-lines",
          !isExpanded && isComplete && "collapsed"
        ].filter(Boolean).join(" ")}>
          {secondary.map((line, i) => (
            <span key={i} className="cf-sidebar-step-line">
              <span className="cf-sidebar-step-value">{line.value}</span>
              <span className="cf-sidebar-step-descriptor">{line.descriptor}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CashflowSidebar({ s, currentStep, onStepClick }: Props) {
  const steps = getWizardSteps(s.isInvestment);
  const naturalStepIndex = getNaturalStepIndex(s);
  const isAllComplete = naturalStepIndex === -1;

  const activeStepIndex = currentStep
    ? steps.findIndex(st => st.id === currentStep)
    : naturalStepIndex;

  // Track which steps are expanded (completed steps start collapsed)
  const [expandedSteps, setExpandedSteps] = useState<Set<StepId>>(new Set());

  const toggleStep = (stepId: StepId) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const completedCount = isAllComplete ? steps.length : naturalStepIndex;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <aside className="cf-sidebar">
      <div className="cf-sidebar-inner">
        <div className="cf-sidebar-nav">
          <div className="cf-sidebar-nav-header">
            <span className="cf-sidebar-nav-head">Setup Progress</span>
            <span className="cf-sidebar-progress-text">{progressPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="cf-sidebar-progress-bar">
            <div
              className="cf-sidebar-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="cf-sidebar-nav-steps">
            {steps.map((step, index) => {
              const isComplete = isAllComplete || index < naturalStepIndex;
              const isCurrent = !isAllComplete && index === activeStepIndex;
              const isUpcoming = !isComplete && !isCurrent;
              const lines = getStepLines(step.id, s);
              const isExpanded = expandedSteps.has(step.id) || isCurrent;

              return (
                <button
                  key={step.id}
                  className={[
                    "cf-sidebar-nav-item",
                    isCurrent && "active",
                    isComplete && "done",
                    isComplete && "clickable",
                    isUpcoming && "upcoming",
                  ].filter(Boolean).join(" ")}
                  onClick={() => isComplete && onStepClick?.(step.id)}
                  disabled={!isComplete}
                >
                  <StepIndicator
                    index={index}
                    isComplete={isComplete}
                    isCurrent={isCurrent}
                    Icon={step.icon}
                    isLast={index === steps.length - 1}
                  />
                  <StepBody
                    step={step}
                    lines={lines}
                    isComplete={isComplete}
                    isExpanded={isExpanded}
                    onToggle={() => toggleStep(step.id)}
                  />
                </button>
              );
            })}
          </div>

          <span className="cf-sidebar-counter">
            {completedCount} of {steps.length} steps complete
          </span>
        </div>
      </div>
    </aside>
  );
}
