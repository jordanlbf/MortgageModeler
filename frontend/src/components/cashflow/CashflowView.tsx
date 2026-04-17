"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { useCashflowState } from "@/hooks/useCashflowState";
import CashflowSidebar from "./CashflowSidebar";
import CashflowDashboard from "./CashflowDashboard";
import CashflowWizardStep from "./CashflowWizardStep";
import type { StepId } from "@/lib/cashflow-types";
type ActiveTab = "wizard" | "dashboard";

const STEP_ORDER_INVESTMENT: StepId[] = ["setup", "property", "loan", "costs", "rental", "tax"];
const STEP_ORDER_BASE: StepId[] = ["setup", "property", "loan", "costs"];

function getNaturalStep(s: ReturnType<typeof useCashflowState>): StepId | null {
  if (!s.propertyUse || !s.purchaseMode || !s.setupComplete) return "setup";
  if (!s.propertyComplete) return "property";
  if (!s.loanComplete) return "loan";
  if (!s.costsComplete) return "costs";
  if (s.isInvestment && !s.rentalComplete) return "rental";
  if (s.isInvestment && !s.taxComplete) return "tax";
  return null;
}

export default function CashflowCalculator() {
  const s = useCashflowState();
  const [inlineStep, setInlineStep] = useState<StepId | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("wizard");
  const [editStep, setEditStep] = useState<StepId>("setup");
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [tableExpanded, setTableExpanded] = useState<Set<number>>(new Set());
  const autoExpandedRef = useRef<Set<number>>(new Set());

  const isMilestoneYear = (year: number) => year === 1 || (year - 1) % 5 === 0;
  const getMilestoneForYear = (year: number) => year === 1 ? 1 : Math.floor((year - 1) / 5) * 5 + 1;

  const handleSelectYear = useCallback((year: number) => {
    s.setSelectedYear(year);

    const milestone = getMilestoneForYear(year);
    const isVisible = isMilestoneYear(year) || tableExpanded.has(milestone);

    // Collapse previously auto-expanded groups that no longer contain selection
    const toCollapse = [...autoExpandedRef.current].filter(m => m !== milestone);
    const next = new Set(tableExpanded);
    let changed = false;

    for (const m of toCollapse) {
      if (next.has(m)) { next.delete(m); changed = true; }
      autoExpandedRef.current.delete(m);
    }

    // Auto-expand if needed
    if (!isVisible) {
      next.add(milestone);
      autoExpandedRef.current.add(milestone);
      changed = true;
    }

    if (changed) setTableExpanded(next);
  }, [s, tableExpanded]);

  // Manual expand/collapse from table — clear auto-tracking for toggled milestones
  const handleManualExpand = useCallback((expanded: Set<number>) => {
    autoExpandedRef.current.clear();
    setTableExpanded(expanded);
  }, []);


  const stepOrder = s.isInvestment ? STEP_ORDER_INVESTMENT : STEP_ORDER_BASE;
  const naturalStep = getNaturalStep(s);
  const currentWizardStep = inlineStep ?? naturalStep;
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
    const currentIdx = stepOrder.indexOf(currentWizardStep as StepId);
    if (currentIdx > 0) {
      setInlineStep(stepOrder[currentIdx - 1]);
    }
  }, [currentWizardStep, stepOrder]);

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
      <Header />

      {/* ── Wizard view: sidebar + wizard centered together ── */}
      {showWizard && (
        <div className="flex justify-center items-start min-h-[calc(100vh-100px)] bg-background text-foreground px-8 py-10">
          <div className="flex w-full max-w-[960px]">
            <CashflowSidebar s={s} currentStep={sidebarStep} onStepClick={goToStep} />

            <div className="flex-1 min-w-0 px-14 py-2 pb-8 flex items-start">
              {!s.allComplete && currentWizardStep && (
                <CashflowWizardStep
                  s={s}
                  currentStep={currentWizardStep}
                  onStepComplete={handleWizardStepComplete}
                  onStepBack={handleWizardStepBack}
                  canGoBack={stepOrder.indexOf(currentWizardStep as StepId) > 0}
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
          tableExpanded={tableExpanded}
          onHoverYear={setHoveredYear}
          onSelectYear={handleSelectYear}
          onManualExpand={handleManualExpand}
        />
      )}

      <Link
        href="/"
        className="group flex items-center justify-center gap-2 py-4 text-[14px] font-medium tracking-wide text-muted/30 no-underline transition-colors duration-300 hover:text-accent/70"
      >
        <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">&larr;</span>
        Return to Dashboard
      </Link>
    </>
  );
}
