"use client";

import { useMemo } from "react";
import { ArrowRight, X, Home, Building2, Landmark, Coins, Key, Calculator } from "lucide-react";
import type { CashflowState } from "@/hooks/useCashflowState";
import type { StepId } from "@/lib/cashflow-types";
import SetupStep from "./wizard/SetupStep";
import PropertyStep from "./wizard/PropertyStep";
import LoanStep from "./wizard/LoanStep";
import CostsStep from "./wizard/CostsStep";
import RentalStep from "./wizard/RentalStep";
import TaxStep from "./wizard/TaxStep";

interface Props {
  s: CashflowState;
  currentStep: string;
  onStepComplete: () => void;
  onStepBack: () => void;
  canGoBack: boolean;
  isModal?: boolean;
}

const STEP_META: Record<StepId, { title: string; subtitle: string; icon: React.ElementType }> = {
  setup:    { title: "Property Setup",   subtitle: "",  icon: Home       },
  property: { title: "Property",         subtitle: "",  icon: Building2  },
  loan:     { title: "Loan",             subtitle: "",  icon: Landmark   },
  costs:    { title: "Costs",            subtitle: "",  icon: Coins      },
  rental:   { title: "Rental Income",    subtitle: "",  icon: Key        },
  tax:      { title: "Tax",              subtitle: "",  icon: Calculator },
};

const STEP_COMPONENTS: Record<StepId, React.ComponentType<{ s: CashflowState }>> = {
  setup: SetupStep,
  property: PropertyStep,
  loan: LoanStep,
  costs: CostsStep,
  rental: RentalStep,
  tax: TaxStep,
};

function getStepOrder(isInvestment: boolean): StepId[] {
  const base: StepId[] = ["setup", "property", "loan", "costs"];
  if (isInvestment) return [...base, "rental", "tax"];
  return [...base, "tax"];
}

export default function CashflowWizardStep({ s, currentStep, onStepComplete, onStepBack, canGoBack, isModal }: Props) {
  const step = currentStep as StepId;
  const meta = STEP_META[step];
  const StepComponent = STEP_COMPONENTS[step];

  const stepOrder = useMemo(() => getStepOrder(s.isInvestment), [s.isInvestment]);
  const currentStepIndex = stepOrder.indexOf(step);

  if (!meta || !StepComponent) return null;

  const isLastStep = step === "tax";
  const ctaDisabled = step === "setup" && (!s.propertyUse || !s.purchaseMode);
  const ctaLabel = isModal ? "Save" : (isLastStep ? "Calculate" : "Continue");
  const stepTitle = step === "tax" && !s.isInvestment ? "Income" : meta.title;

  return (
    <div className="flex flex-col items-stretch justify-start min-h-[520px] w-full">
      <div className="flex flex-col gap-[35px] w-full max-w-[480px]">
        {/* Breadcrumb progress indicator */}
        <div className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase text-fg-secondary h-4 leading-none">
          <span className="font-semibold text-brand tabular-nums">Step {currentStepIndex + 1} of {stepOrder.length}</span>
          <span className="text-fg-tertiary">·</span>
          <span className="text-fg-secondary">{stepTitle}</span>
        </div>

        {/* Card */}
        <div className={step === "setup" ? "flex flex-col items-center" : ""}>
          <div className="pt-4 pb-3">
            <StepComponent s={s} />
          </div>
          <div className="pt-6 flex items-center gap-3.5">
            {canGoBack && (
              <button className="flex items-center gap-2 py-3.5 px-[22px] bg-transparent border border-default rounded-xl text-fg-tertiary font-[inherit] text-sm font-medium cursor-pointer transition-all duration-150 whitespace-nowrap shrink-0 hover:border-strong hover:text-fg-secondary" onClick={onStepBack}>
                {isModal ? <X size={16} /> : null}
                {isModal ? "Cancel" : "Back"}
              </button>
            )}
            <button
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-8 bg-brand border-none rounded-xl text-brand-contrast font-[inherit] text-sm font-semibold cursor-pointer transition-all duration-150 tracking-[0.01em] hover:enabled:brightness-[1.08] disabled:opacity-30 disabled:cursor-not-allowed ${step === "setup" ? "flex-none min-w-[200px]" : ""}`}
              onClick={onStepComplete}
              disabled={ctaDisabled}
            >
              {ctaLabel}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
