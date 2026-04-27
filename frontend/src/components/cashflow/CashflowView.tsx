"use client";

import { useCallback, useMemo, useState } from "react";
import type { useCashflowState } from "@/hooks/useCashflowState";
import { ModalWizardShell, useWizardSteps } from "@/components/ui/wizard";
import CashflowSidebar from "./CashflowSidebar";
import CashflowDashboard from "./CashflowDashboard";
import CashflowWizardStep from "./CashflowWizardStep";
import type { StepId } from "@/lib/cashflow-types";
import { getCashflowSteps } from "./cashflow-steps";

interface CashflowViewProps {
  s: ReturnType<typeof useCashflowState>;
  /** Step currently open in the edit modal, or null when closed. Owned by the page so it can render the Edit trigger in the page header. */
  editingStep: StepId | null;
  onEditingStepChange: (step: StepId | null) => void;
}

export default function CashflowCalculator({
  s,
  editingStep,
  onEditingStepChange,
}: CashflowViewProps) {
  const [inlineStep, setInlineStep] = useState<StepId | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const handleSelectYear = useCallback((year: number) => {
    s.setSelectedYear(year);
  }, [s]);

  const cashflowSteps = useMemo(() => getCashflowSteps(s.isInvestment), [s.isInvestment]);
  const wizard = useWizardSteps(cashflowSteps, s);

  const currentWizardStep = inlineStep ?? wizard.naturalStep;
  const isEditing = editingStep !== null;

  const handleWizardStepComplete = useCallback(() => {
    switch (currentWizardStep) {
      case "setup": s.setSetupComplete(true); break;
      case "property": s.setPropertyComplete(true); break;
      case "loan": s.setLoanComplete(true); break;
      case "costs": s.setCostsComplete(true); break;
      case "rental": s.setRentalComplete(true); break;
      case "tax": s.setTaxComplete(true); break;
    }
    setInlineStep(null);
  }, [currentWizardStep, s]);

  const handleWizardStepBack = useCallback(() => {
    if (!currentWizardStep) return;
    const currentIdx = wizard.indexOf(currentWizardStep);
    const previous = cashflowSteps[currentIdx - 1];
    if (previous) setInlineStep(previous.id);
  }, [currentWizardStep, wizard, cashflowSteps]);

  const handleEditNavigate = useCallback((step: StepId) => {
    onEditingStepChange(step);
  }, [onEditingStepChange]);

  const handleCloseEdit = useCallback(() => {
    onEditingStepChange(null);
  }, [onEditingStepChange]);

  return (
    <>
      {/* Inline wizard — pre-completion */}
      {!s.allComplete && currentWizardStep && (
        <div className="flex justify-center items-start py-8 px-6 bg-surface-app text-fg-primary">
          <div className="w-full max-w-[1100px] flex rounded-2xl overflow-hidden border border-white/[0.08] bg-surface-raised/80 backdrop-blur-xl shadow-float">
            <CashflowSidebar
              s={s}
              currentStep={currentWizardStep}
              onStepClick={(step) => setInlineStep(step)}
            />
            <CashflowWizardStep
              s={s}
              currentStep={currentWizardStep}
              onStepComplete={handleWizardStepComplete}
              onStepBack={handleWizardStepBack}
              canGoBack={wizard.indexOf(currentWizardStep) > 0}
            />
          </div>
        </div>
      )}

      {s.error && (
        <div className="max-w-[1400px] mx-auto px-4 pt-6">
          <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-[14px] text-red-400/80">
            {s.error}
          </div>
        </div>
      )}

      {/* Dashboard — post-completion */}
      {s.allComplete && s.yearData.length > 0 && (
        <CashflowDashboard
          s={s}
          hoveredYear={hoveredYear}
          onHoverYear={setHoveredYear}
          onSelectYear={handleSelectYear}
        />
      )}

      {/* Edit modal — post-completion */}
      <ModalWizardShell isOpen={isEditing} onClose={handleCloseEdit}>
        {editingStep && (
          <>
            <CashflowSidebar
              s={s}
              currentStep={editingStep}
              onStepClick={handleEditNavigate}
            />
            <CashflowWizardStep
              s={s}
              currentStep={editingStep}
              onStepComplete={handleCloseEdit}
              onStepBack={handleCloseEdit}
              canGoBack
              isModal
            />
          </>
        )}
      </ModalWizardShell>
    </>
  );
}
