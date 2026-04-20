"use client";

import { useState } from "react";
import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";
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
  const steps = isInvestment ? WIZARD_STEPS : WIZARD_STEPS.filter(s => s.id !== "rental");
  return steps.map(s =>
    s.id === "tax" && !isInvestment ? { ...s, label: "Income & Growth" } : s
  );
}

function getNaturalStepIndex(s: CashflowState): number {
  if (!s.propertyUse || !s.purchaseMode) return 0;
  if (!s.propertyComplete) return 1;
  if (!s.loanComplete) return 2;
  if (!s.costsComplete) return 3;
  if (s.isInvestment && !s.rentalComplete) return 4;
  if (!s.taxComplete) return s.isInvestment ? 5 : 4;
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
        const price = parseCurrencyInput(s.purchasePrice);
        const deposit = parseCurrencyInput(s.depositAmount);
        const loanAmt = price - deposit;
        const lvr = price > 0 ? Math.round((loanAmt / price) * 100) : 0;
        return [
          { primary: true, text: `${formatDollarsSigned(price)} Purchase Price` },
          { value: formatDollarsSigned(loanAmt), descriptor: "Loan Balance" },
          { value: `${lvr}%`, descriptor: "LVR" },
        ];
      } else {
        const value = parseCurrencyInput(s.currentValue);
        const loan = parseCurrencyInput(s.currentLoanBalance);
        const equity = value - loan;
        const lvr = value > 0 ? Math.round((loan / value) * 100) : 0;
        return [
          { primary: true, text: `${formatDollarsSigned(value)} Current Value` },
          { value: formatDollarsSigned(equity), descriptor: "Equity" },
          { value: `${lvr}%`, descriptor: "LVR" },
        ];
      }
    }
    case "loan": {
      if (!s.loanComplete) return null;
      const loanAmt = s.isNewPurchase
        ? parseCurrencyInput(s.purchasePrice) - parseCurrencyInput(s.depositAmount)
        : parseCurrencyInput(s.currentLoanBalance);
      const rate = parseFloat(s.interestRate) / 100 / 12;
      const n = parseInt(s.loanTerm) * 12;
      const monthly = rate > 0 ? Math.round((loanAmt * rate) / (1 - Math.pow(1 + rate, -n))) : 0;
      return [
        { primary: true, text: `${s.interestRate}% Interest Rate` },
        { value: `${s.loanTerm} Year`, descriptor: "Loan Term" },
        { value: formatDollarsSigned(monthly), descriptor: "/ mo Repayment" },
      ];
    }
    case "costs": {
      if (!s.costsComplete) return null;
      const council = parseCurrencyInput(s.councilRates);
      const water = parseCurrencyInput(s.waterRates);
      const insurance = parseCurrencyInput(s.insurance);
      const strata = s.hasStrata ? parseCurrencyInput(s.strataFees) * 4 : 0;
      const total = council + water + insurance + strata;
      const lines: StepLine[] = [
        { primary: true, text: `${formatDollarsSigned(total)} Annual Costs` },
        { value: formatDollarsSigned(council), descriptor: "Council" },
        { value: formatDollarsSigned(insurance), descriptor: "Insurance" },
      ];
      if (s.hasStrata) lines.push({ value: formatDollarsSigned(strata), descriptor: "Strata / yr" });
      return lines;
    }
    case "rental": {
      if (!s.rentalComplete) return null;
      const weekly = parseCurrencyInput(s.weeklyRent);
      const annual = weekly * 52;
      const mgmt = parseFloat(s.managementFee) || 0;
      const netAnnual = annual * (1 - mgmt / 100);
      return [
        { primary: true, text: `${formatDollarsSigned(weekly)} / wk Rent` },
        { value: formatDollarsSigned(Math.round(netAnnual)), descriptor: "Net Annual" },
        { value: `${mgmt}%`, descriptor: "Management" },
      ];
    }
    case "tax": {
      if (!s.taxComplete) return null;
      const income = parseCurrencyInput(s.taxableIncome);
      const rate =
        income > 190000 ? "45%" :
        income > 135000 ? "37%" :
        income > 45000  ? "30%" : "16%";
      const lines: StepLine[] = [
        { primary: true, text: `${formatDollarsSigned(income)} Taxable Income` },
      ];
      if (s.isInvestment) lines.push({ value: rate, descriptor: "Tax Bracket" });
      else lines.push({ value: `${s.capitalGrowth}%`, descriptor: "Capital Growth" });
      return lines;
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
  isComplete,
  isCurrent,
  Icon,
  isLast
}: {
  isComplete: boolean;
  isCurrent: boolean;
  Icon: typeof Home;
  isLast: boolean;
}) {
  return (
    <div className="flex flex-col items-center shrink-0">
      <div className={[
        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-250 ease-in-out",
        isComplete
          ? "border-[1.5px] border-accent bg-accent text-accent-contrast"
          : isCurrent
            ? "border-[1.5px] border-accent text-accent bg-[rgba(45,212,191,0.08)] shadow-[0_0_0_3px_rgba(45,212,191,0.12)]"
            : "border-[1.5px] border-border bg-background text-faint"
      ].join(" ")}>
        {isComplete ? (
          <Check size={14} strokeWidth={2.5} />
        ) : (
          <Icon size={14} strokeWidth={1.5} />
        )}
      </div>
      {!isLast && (
        <div className={[
          "w-0.5 h-6 mt-1.5 rounded-sm transition-colors duration-250 ease-in-out",
          isComplete ? "bg-accent" : "bg-border"
        ].join(" ")} />
      )}
    </div>
  );
}

function StepBody({
  step,
  lines,
  isComplete,
  isCurrent,
  isExpanded,
  onToggle
}: {
  step: { id: StepId; label: string; icon: typeof Home };
  lines: StepLine[] | null;
  isComplete: boolean;
  isCurrent: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const primary = lines?.find(l => l.primary) as { primary: true; text: string } | undefined;
  const secondary = lines?.filter(l => !l.primary) as { value: string; descriptor: string }[];
  const hasDetails = secondary?.length > 0;

  return (
    <div className="flex flex-col gap-1 min-w-0 flex-1 pt-[3px]">
      <div className="flex items-center justify-between gap-2">
        <span className={[
          "text-[13px] leading-[1.4] transition-colors duration-150 ease-in-out",
          isCurrent ? "font-semibold text-foreground" : isComplete ? "font-medium text-foreground" : "font-medium text-faint"
        ].join(" ")}>
          {primary ? primary.text : step.label}
        </span>
        {isComplete && hasDetails && (
          <span
            className="flex items-center justify-center w-5 h-5 border-none bg-[rgba(255,255,255,0.04)] rounded text-faint cursor-pointer transition-all duration-150 ease-in-out shrink-0 hover:bg-[rgba(255,255,255,0.08)] hover:text-foreground"
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
          "flex flex-col gap-1 mt-1.5 overflow-hidden transition-all duration-300 ease-in-out",
          !isExpanded && isComplete ? "max-h-0 opacity-0 !mt-0" : "max-h-[200px]"
        ].join(" ")}>
          {secondary.map((line, i) => (
            <span key={i} className="flex items-baseline gap-1.5 text-[11px] leading-[1.4]">
              <span className="text-accent font-semibold text-[11px]">{line.value}</span>
              <span className="text-faint text-[11px]">{line.descriptor}</span>
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
    <aside className="w-[300px] min-w-[300px] max-w-[300px] border-r border-border bg-background shrink-0">
      <div className="py-2 pb-8 flex flex-col">
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-6 h-4 mb-3 leading-none">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-subtle">Setup Progress</span>
            <span className="text-xs font-semibold text-accent tabular-nums">
              {progressPercent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-[3px] bg-[rgba(255,255,255,0.06)] rounded-sm mx-6 mb-5 overflow-hidden">
            <div
              className="h-full bg-accent rounded-sm transition-[width] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-col">
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
                    "flex items-start gap-3.5 py-3 px-6 relative bg-none border-none w-full text-left font-[inherit] transition-colors duration-150 ease-in-out",
                    isComplete ? "cursor-pointer hover:bg-[rgba(255,255,255,0.02)]" : "cursor-default",
                    isCurrent && "!bg-[rgba(45,212,191,0.04)]",
                    isUpcoming && "opacity-50",
                  ].filter(Boolean).join(" ")}
                  onClick={() => isComplete && onStepClick?.(step.id)}
                  disabled={!isComplete}
                >
                  <StepIndicator
                    isComplete={isComplete}
                    isCurrent={isCurrent}
                    Icon={step.icon}
                    isLast={index === steps.length - 1}
                  />
                  <StepBody
                    step={step}
                    lines={lines}
                    isComplete={isComplete}
                    isCurrent={isCurrent}
                    isExpanded={isExpanded}
                    onToggle={() => toggleStep(step.id)}
                  />
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-faint px-6 mt-5">
            {completedCount} of {steps.length} steps complete
          </span>
        </div>
      </div>
    </aside>
  );
}
