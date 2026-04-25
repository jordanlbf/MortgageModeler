"use client";

import { useCallback, useMemo, useState } from "react";
import type { useCashflowState } from "@/hooks/useCashflowState";
import { useWizardSteps } from "@/components/ui/wizard";
import CashflowSidebar from "./CashflowSidebar";
import CashflowDashboard from "./CashflowDashboard";
import CashflowWizardStep from "./CashflowWizardStep";
import type { StepId } from "@/lib/cashflow-types";
import { getCashflowSteps } from "./cashflow-steps";

type ActiveTab = "wizard" | "dashboard";

interface CashflowViewProps {
  s: ReturnType<typeof useCashflowState>;
}

export default function CashflowCalculator({ s }: CashflowViewProps) {
  const [inlineStep, setInlineStep] = useState<StepId | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("wizard");
  const [editStep, setEditStep] = useState<StepId>("setup");
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const handleSelectYear = useCallback((year: number) => {
    s.setSelectedYear(year);
  }, [s]);

  const cashflowSteps = useMemo(() => getCashflowSteps(s.isInvestment), [s.isInvestment]);
  const wizard = useWizardSteps(cashflowSteps, s);

  const currentWizardStep = inlineStep ?? wizard.naturalStep;
  const showWizard = !s.allComplete || activeTab === "wizard";

  const goToStep = useCallback((step: StepId) => {
    if (s.allComplete) {
      setEditStep(step);
      setActiveTab("wizard");
    }
  }, [s.allComplete]);

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

  const handleEditStepComplete = useCallback(() => {
    switch (editStep) {
      case "property": s.setPropertyComplete(true); break;
      case "loan": s.setLoanComplete(true); break;
      case "costs": s.setCostsComplete(true); break;
      case "rental": s.setRentalComplete(true); break;
      case "tax": s.setTaxComplete(true); break;
    }
    setActiveTab("dashboard");
  }, [editStep, s]);

  const handleWizardStepBack = useCallback(() => {
    if (!currentWizardStep) return;
    const currentIdx = wizard.indexOf(currentWizardStep);
    const previous = cashflowSteps[currentIdx - 1];
    if (previous) {
      setInlineStep(previous.id);
    }
  }, [currentWizardStep, wizard, cashflowSteps]);

  const sidebarStep = s.allComplete
    ? (activeTab === "wizard" ? editStep : undefined)
    : (currentWizardStep ?? undefined);

  // Auto-switch to dashboard when wizard first completes
  const [wasComplete, setWasComplete] = useState(false);
  if (s.allComplete && !wasComplete) {
    setWasComplete(true);
    setActiveTab("dashboard");
  }

  return (
    <>
      {/* ── Wizard view: sidebar + wizard centered together ── */}
      {showWizard && (
        <div className="flex justify-center items-start bg-surface-app text-fg-primary">
          <div className="flex w-full max-w-[960px]">
            <CashflowSidebar s={s} currentStep={sidebarStep} onStepClick={goToStep} />

            <div className="flex-1 min-w-0 px-14 py-2 pb-8 flex items-start">
              {!s.allComplete && currentWizardStep && (
                <CashflowWizardStep
                  s={s}
                  currentStep={currentWizardStep}
                  onStepComplete={handleWizardStepComplete}
                  onStepBack={handleWizardStepBack}
                  canGoBack={wizard.indexOf(currentWizardStep) > 0}
                />
              )}
              {s.allComplete && (
                <CashflowWizardStep
                  s={s}
                  currentStep={editStep}
                  onStepComplete={handleEditStepComplete}
                  onStepBack={() => setActiveTab("dashboard")}
                  canGoBack={true}
                />
              )}
            </div>
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

      {/* ── Dashboard view ── */}
      {s.allComplete && s.yearData.length > 0 && activeTab === "dashboard" && (
        <CashflowDashboard
          s={s}
          hoveredYear={hoveredYear}
          onHoverYear={setHoveredYear}
          onSelectYear={handleSelectYear}
        />
      )}
    </>
  );
}
