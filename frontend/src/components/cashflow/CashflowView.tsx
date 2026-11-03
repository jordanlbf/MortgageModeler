"use client";

import { useCallback, useMemo, useState } from "react";
import type { useCashflowState } from "@/hooks/useCashflowState";
import { ModalWizardShell, useWizardSteps } from "@/components/domain/wizard";
import CashflowSidebar from "./CashflowSidebar";
import CashflowDashboard from "./CashflowDashboard";
import CashflowWizardStep from "./CashflowWizardStep";
import type { DashboardView, StepId } from "@/lib/cashflow-types";
import { getCashflowSteps } from "./cashflow-steps";
import InlineAlert from "@/components/patterns/blocks/InlineAlert";
import SectionCard from "@/components/patterns/cards/SectionCard";

interface CashflowViewProps {
  s: ReturnType<typeof useCashflowState>;
  /** Step currently open in the edit modal, or null when closed. Owned by the page so it can render the Edit trigger in the page header. */
  editingStep: StepId | null;
  onEditingStepChange: (step: StepId | null) => void;
  /** Overview or Details; the toggle lives in the page bar. */
  dashboardView: DashboardView;
}

export default function CashflowCalculator({
  s,
  editingStep,
  onEditingStepChange,
  dashboardView,
}: CashflowViewProps) {
  const [inlineStep, setInlineStep] = useState<StepId | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const handleSelectYear = useCallback((year: number) => {
    s.setSelectedYear(year);
  }, [s]);

  const cashflowSteps = useMemo(() => getCashflowSteps(s.isInvestment, s.isLand), [s.isInvestment, s.isLand]);
  const wizard = useWizardSteps(cashflowSteps, s);

  const currentWizardStep = inlineStep ?? wizard.naturalStep;
  const isEditing = editingStep !== null;

  const handleWizardStepComplete = useCallback(() => {
    switch (currentWizardStep) {
      case "setup": s.setSetupComplete(true); break;
      case "loan": s.setLoanComplete(true); break;
      case "costs": s.setCostsComplete(true); break;
      case "rental": s.setRentalComplete(true); break;
      case "income": s.setIncomeComplete(true); break;
      case "depreciation": s.setDepreciationComplete(true); break;
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
        <SectionCard flush className="w-full flex-1 flex-row overflow-hidden">
          <CashflowSidebar
            s={s}
            showProgress={false}
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
        </SectionCard>
      )}

      {s.error && <InlineAlert>{s.error}</InlineAlert>}

      {/* Dashboard — post-completion */}
      {s.allComplete && s.yearData.length > 0 && (
        <CashflowDashboard
          s={s}
          view={dashboardView}
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
