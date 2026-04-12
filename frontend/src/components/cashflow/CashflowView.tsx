"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Home, TrendingUp, Receipt } from "lucide-react";
import Header from "@/components/layout/Header";
import { useCashflowState } from "@/hooks/useCashflowState";
import type { ViewMode } from "@/lib/cashflow-types";
import CashflowSidebar from "./CashflowSidebar";
import CashflowChart from "./CashflowChart";
import CashflowKpiStrip from "./CashflowKpiStrip";
import CashflowDataTable from "./CashflowDataTable";
import CashflowWizardStep from "./CashflowWizardStep";
import "./cashflow.css";

type StepId = "setup" | "property" | "loan" | "costs" | "rental" | "tax";
type ActiveTab = "wizard" | "dashboard";

const STEP_ORDER_INVESTMENT: StepId[] = ["setup", "property", "loan", "costs", "rental", "tax"];
const STEP_ORDER_BASE: StepId[] = ["setup", "property", "loan", "costs"];

function getNaturalStep(s: ReturnType<typeof useCashflowState>): StepId | null {
  if (!s.propertyUse || !s.purchaseMode) return "setup";
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
      case "setup": break;
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

  const chartModeLabel = s.effectiveViewMode === "summary" ? "Cashflow"
    : s.effectiveViewMode === "property" ? "Property"
    : s.effectiveViewMode === "equity" ? "Equity"
    : s.isInvestment ? "Deductions" : "Expenses";

  const sidebarStep = s.allComplete
    ? (activeTab === "wizard" ? editStep : undefined)
    : (currentWizardStep ?? undefined);

  return (
    <>
      <Header />

      {/* ── Tab bar — always visible ── */}
      <div className="cf-view-tabs">
        <button
          className={`cf-view-tab ${activeTab === "wizard" || !s.allComplete ? "active" : ""}`}
          onClick={() => setActiveTab("wizard")}
        >
          Setup
        </button>
        <button
          className={`cf-view-tab ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => s.allComplete && setActiveTab("dashboard")}
          disabled={!s.allComplete}
        >
          Dashboard
        </button>
      </div>

      {/* ── Wizard view: sidebar + wizard centered together ── */}
      {showWizard && (
        <div className="cf-wizard-view">
          <div className="cf-wizard-view-inner">
            <CashflowSidebar s={s} currentStep={sidebarStep} onStepClick={goToStep} />

            <div className="cf-wizard-view-main">
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

      {/* ── Dashboard view: Fey card-encapsulated ── */}
      {s.allComplete && s.yearData.length > 0 && activeTab === "dashboard" && (
        <main className="cf-dashboard-view">
          {/* Aggregates card — header, KPIs, chart */}
          <div className="cf-outer-card">

            {/* Card header: title left, mode tabs right */}
            <div className="cf-card-header">
              <div className="cf-card-header-left">
                <div className="cf-dashboard-title">{chartModeLabel}</div>
                <div className="cf-dashboard-subtitle">
                  {s.isInvestment ? "Investment property" : "Owner-occupied"} · 30-year projection · Year <span className="cf-chart-inline-year">{s.selectedYear}</span>
                </div>
              </div>
              <div className="cf-mode-bar">
                {(["summary", "property", "equity", "deductions"] as ViewMode[]).map(m => {
                  const icon = m === "summary" ? <LayoutGrid size={14} /> : m === "property" ? <Home size={14} /> : m === "equity" ? <TrendingUp size={14} /> : <Receipt size={14} />;
                  const label = m === "summary" ? "Summary" : m === "property" ? "Property" : m === "equity" ? "Equity" : (s.isInvestment ? "Deductions" : "Expenses");
                  return (
                    <button
                      key={m}
                      className={`cf-mode-btn ${s.effectiveViewMode === m ? "active" : ""}`}
                      onClick={() => { s.setViewMode(m); s.setSelectedYear(1); }}
                    >
                      {icon}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KPI strip — border-divided cells */}
            <CashflowKpiStrip
              viewMode={s.effectiveViewMode}
              yearData={s.yearData}
              selectedYearData={s.selectedYearData}
              selectedYear={s.selectedYear}
              isInvestment={s.isInvestment}
              marginalRate={s.marginalRate}
            />

            {/* Chart zone — bottom of aggregates card */}
            <div className="cf-chart-zone">
              <CashflowChart
                chartData={s.chartData}
                yearData={s.yearData}
                viewMode={s.effectiveViewMode}
                selectedYear={s.selectedYear}
                isInvestment={s.isInvestment}
                onSelectYear={s.setSelectedYear}
              />
            </div>

          </div>

          {/* Table card(s) */}
          {s.effectiveViewMode === "property" && s.isInvestment ? (
            <div className="cf-property-cards">
              <div className="cf-outer-card cf-property-card">
                <div className="cf-table-zone">
                  <CashflowDataTable
                    yearData={s.yearData}
                    viewMode={s.effectiveViewMode}
                    selectedYear={s.selectedYear}
                    isInvestment={s.isInvestment}
                    hasOffset={s.hasOffset}
                    propertyValue={s.propertyValue}
                    propertyPanel="gearing"
                    onSelectYear={s.setSelectedYear}
                  />
                </div>
              </div>
              <div className="cf-outer-card cf-property-card">
                <div className="cf-table-zone">
                  <CashflowDataTable
                    yearData={s.yearData}
                    viewMode={s.effectiveViewMode}
                    selectedYear={s.selectedYear}
                    isInvestment={s.isInvestment}
                    hasOffset={s.hasOffset}
                    propertyValue={s.propertyValue}
                    propertyPanel="cashflow"
                    onSelectYear={s.setSelectedYear}
                  />
                </div>
              </div>
            </div>
          ) : s.effectiveViewMode === "equity" ? (
            <div className="cf-property-cards">
              <div className="cf-outer-card cf-property-card">
                <div className="cf-table-zone">
                  <CashflowDataTable
                    yearData={s.yearData}
                    viewMode={s.effectiveViewMode}
                    selectedYear={s.selectedYear}
                    isInvestment={s.isInvestment}
                    hasOffset={s.hasOffset}
                    propertyValue={s.propertyValue}
                    equityPanel="property"
                    onSelectYear={s.setSelectedYear}
                  />
                </div>
              </div>
              <div className="cf-outer-card cf-property-card">
                <div className="cf-table-zone">
                  <CashflowDataTable
                    yearData={s.yearData}
                    viewMode={s.effectiveViewMode}
                    selectedYear={s.selectedYear}
                    isInvestment={s.isInvestment}
                    hasOffset={s.hasOffset}
                    propertyValue={s.propertyValue}
                    equityPanel="position"
                    onSelectYear={s.setSelectedYear}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="cf-outer-card">
              <div className="cf-table-zone">
                <CashflowDataTable
                  yearData={s.yearData}
                  viewMode={s.effectiveViewMode}
                  selectedYear={s.selectedYear}
                  isInvestment={s.isInvestment}
                  hasOffset={s.hasOffset}
                  propertyValue={s.propertyValue}
                  onSelectYear={s.setSelectedYear}
                />
              </div>
            </div>
          )}
        </main>
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