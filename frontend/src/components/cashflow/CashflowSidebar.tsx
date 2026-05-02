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
    case "income": {
      if (!s.incomeComplete) return null;
      const income = parseCurrencyInput(s.taxableIncome);
      const rate =
        income > 190000 ? "45%" :
        income > 135000 ? "37%" :
        income > 45000  ? "30%" : "16%";
      return [
        { primary: true, text: `${formatDollarsSigned(income)} Taxable Income` },
        { value: rate, descriptor: "Tax Bracket" },
        { value: `${s.capitalGrowth}%`, descriptor: "Capital Growth" },
      ];
    }
    case "depreciation": {
      if (!s.depreciationComplete) return null;
      const mode = s.depreciationMode === "estimate" ? "Estimated" : "Detailed";
      return [
        { primary: true, text: `${mode} Depreciation` },
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
    <div className="flex flex-col min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <span
          className={[
            "text-[13px] leading-snug transition-colors duration-150",
            isCurrent
              ? "font-semibold text-fg-primary"
              : isComplete
                ? "font-medium text-fg-secondary"
                : "font-medium text-fg-tertiary group-hover:text-fg-secondary",
          ].join(" ")}
        >
          {primary ? primary.text : step.title}
        </span>
        {isComplete && hasDetails && (
          <span
            className="flex items-center justify-center w-5 h-5 bg-white/[0.04] rounded text-fg-tertiary cursor-pointer transition-all duration-150 shrink-0 hover:bg-white/[0.08] hover:text-fg-primary"
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
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}
      </div>
      {hasDetails && (
        <div
          className={[
            "flex flex-wrap gap-x-3 gap-y-1 mt-1.5 overflow-hidden transition-all duration-200",
            !isExpanded && isComplete ? "max-h-0 opacity-0 !mt-0" : "max-h-[100px] opacity-100",
          ].join(" ")}
        >
          {secondary.map((line, i) => (
            <span key={i} className="flex items-baseline gap-1">
              <span className="text-brand font-semibold text-[11px]">{line.value}</span>
              <span className="text-fg-muted text-[10px]">{line.descriptor}</span>
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
      progress={{
        percent: progressPercent,
        completedCount,
        totalCount: cashflowSteps.length,
      }}
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
