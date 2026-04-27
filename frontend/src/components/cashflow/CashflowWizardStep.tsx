"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

import { WizardShell, useWizardSteps } from "@/components/ui/wizard";
import type { CashflowState } from "@/hooks/useCashflowState";
import type { StepId } from "@/lib/cashflow-types";
import { getCashflowSteps } from "./cashflow-steps";
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

const STEP_COMPONENTS: Record<StepId, React.ComponentType<{ s: CashflowState }>> = {
  setup: SetupStep,
  property: PropertyStep,
  loan: LoanStep,
  costs: CostsStep,
  rental: RentalStep,
  tax: TaxStep,
};

export default function CashflowWizardStep({
  s,
  currentStep,
  onStepComplete,
  onStepBack,
  canGoBack,
  isModal,
}: Props) {
  const step = currentStep as StepId;
  const steps = useMemo(() => getCashflowSteps(s.isInvestment), [s.isInvestment]);
  const wizard = useWizardSteps(steps, s);
  const stepDescriptor = steps[wizard.indexOf(step)];
  const StepComponent = STEP_COMPONENTS[step];

  if (!stepDescriptor || !StepComponent) return null;

  const isLastStep = step === "tax";
  const ctaLabel = isModal ? "Save" : isLastStep ? "Calculate" : "Continue";

  return (
    <WizardShell
      stepTitle={stepDescriptor.title}
      stepIndex={wizard.indexOf(step) + 1}
      totalSteps={wizard.totalSteps}
      ctaLabel={ctaLabel}
      ctaDisabled={!wizard.isValid(step)}
      onContinue={onStepComplete}
      showBack={canGoBack}
      backLabel={isModal ? "Cancel" : "Back"}
      backIcon={isModal ? <X size={16} /> : undefined}
      onBack={onStepBack}
      bodyAlign={step === "setup" ? "center" : "start"}
    >
      <StepComponent s={s} />
    </WizardShell>
  );
}
