"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import {
  WizardSidebar,
  useWizardSteps,
  type WizardSidebarStep,
} from "@/components/ui/wizard";
import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";
import type { StepId } from "@/lib/cashflow-types";
import { getCashflowSteps } from "./cashflow-steps";

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

interface StepBodyProps {
  step: WizardSidebarStep<StepId>;
  lines: StepLine[] | null;
  isComplete: boolean;
  isCurrent: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

function StepBody({
  step,
  lines,
  isComplete,
  isCurrent,
  isExpanded,
  onToggle,
}: StepBodyProps) {
  const primary = lines?.find((l) => l.primary) as { primary: true; text: string } | undefined;
  const secondary = (lines?.filter((l) => !l.primary) as { value: string; descriptor: string }[]) ?? [];
  const hasDetails = secondary.length > 0;

  return (
    <div className="flex flex-col gap-1 min-w-0 flex-1 pt-[3px]">
      <div className="flex items-center justify-between gap-2">
        <span
          className={[
            "text-[13px] leading-[1.4] transition-colors duration-150 ease-in-out",
            isCurrent
              ? "font-semibold text-fg-primary"
              : isComplete
                ? "font-medium text-fg-primary"
                : "font-medium text-fg-tertiary",
          ].join(" ")}
        >
          {primary ? primary.text : step.title}
        </span>
        {isComplete && hasDetails && (
          <span
            className="flex items-center justify-center w-5 h-5 border-none bg-[rgba(255,255,255,0.04)] rounded text-fg-tertiary cursor-pointer transition-all duration-150 ease-in-out shrink-0 hover:bg-[rgba(255,255,255,0.08)] hover:text-fg-primary"
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
        <div
          className={[
            "flex flex-col gap-1 mt-1.5 overflow-hidden transition-all duration-300 ease-in-out",
            !isExpanded && isComplete ? "max-h-0 opacity-0 !mt-0" : "max-h-[200px]",
          ].join(" ")}
        >
          {secondary.map((line, i) => (
            <span key={i} className="flex items-baseline gap-1.5 text-[11px] leading-[1.4]">
              <span className="text-brand font-semibold text-[11px]">{line.value}</span>
              <span className="text-fg-tertiary text-[11px]">{line.descriptor}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CashflowSidebar({ s, currentStep, onStepClick }: Props) {
  const cashflowSteps = useMemo(() => getCashflowSteps(s.isInvestment), [s.isInvestment]);
  const wizard = useWizardSteps(cashflowSteps, s);

  const sidebarSteps: WizardSidebarStep<StepId>[] = useMemo(
    () =>
      cashflowSteps.map((st) => ({
        id: st.id,
        title: st.sidebarTitle,
        icon: st.sidebarIcon,
      })),
    [cashflowSteps],
  );

  const currentStepId =
    (currentStep as StepId | undefined) ?? wizard.naturalStep ?? null;

  const [expandedSteps, setExpandedSteps] = useState<Set<StepId>>(new Set());
  const toggleStep = (stepId: StepId) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const completedCount = wizard.allComplete
    ? cashflowSteps.length
    : Math.max(0, cashflowSteps.findIndex((st) => st.id === wizard.naturalStep));
  const progressPercent = Math.round((completedCount / cashflowSteps.length) * 100);

  return (
    <WizardSidebar
      steps={sidebarSteps}
      currentStepId={currentStepId}
      isComplete={(id) => wizard.isComplete(id)}
      selectable={(id) => wizard.allComplete || wizard.isComplete(id)}
      onSelect={(id) => onStepClick?.(id)}
      header={
        <>
          <div className="flex items-center justify-between px-6 h-4 mb-3 leading-none">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-fg-secondary">
              Setup Progress
            </span>
            <span className="text-xs font-semibold text-brand tabular-nums">
              {progressPercent}%
            </span>
          </div>
          <div className="h-[3px] bg-[rgba(255,255,255,0.06)] rounded-sm mx-6 mb-5 overflow-hidden">
            <div
              className="h-full bg-brand rounded-sm transition-[width] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </>
      }
      footer={
        <span className="text-[11px] text-fg-tertiary px-6 mt-5">
          {completedCount} of {cashflowSteps.length} steps complete
        </span>
      }
      renderStepBody={({ step, isCurrent, isComplete }) => {
        const lines = getStepLines(step.id, s);
        const isExpanded = expandedSteps.has(step.id) || isCurrent;
        return (
          <StepBody
            step={step}
            lines={lines}
            isComplete={isComplete}
            isCurrent={isCurrent}
            isExpanded={isExpanded}
            onToggle={() => toggleStep(step.id)}
          />
        );
      }}
    />
  );
}
