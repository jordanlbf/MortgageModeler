"use client";

import { useCallback } from "react";
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

// Determine which wizard step should be shown
function getWizardStep(s: ReturnType<typeof useCashflowState>): string | null {
  if (!s.propertyUse) return "propertyUse";
  if (!s.purchaseMode) return "purchaseMode";
  if (!s.propertyComplete) return "property";
  if (!s.loanComplete) return "loan";
  if (!s.costsComplete) return "costs";
  if (s.isInvestment && !s.rentalComplete) return "rental";
  if (s.isInvestment && !s.taxComplete) return "tax";
  return null; // All complete
}

export default function CashflowCalculator() {
  const s = useCashflowState();
  const currentWizardStep = getWizardStep(s);

  const handleWizardStepComplete = useCallback(() => {
    switch (currentWizardStep) {
      case "propertyUse":
        // propertyUse is already set by the option click
        break;
      case "purchaseMode":
        // purchaseMode is already set by the option click
        break;
      case "property":
        s.setPropertyComplete(true);
        break;
      case "loan":
        s.setLoanComplete(true);
        break;
      case "costs":
        s.setCostsComplete(true);
        break;
      case "rental":
        s.setRentalComplete(true);
        break;
      case "tax":
        s.setTaxComplete(true);
        break;
    }
  }, [currentWizardStep, s]);

  const chartModeLabel = s.effectiveViewMode === "summary" ? "Cashflow"
    : s.effectiveViewMode === "property" ? "Property"
    : s.effectiveViewMode === "equity" ? "Equity"
    : s.isInvestment ? "Deductions" : "Expenses";

  return (
    <>
      <Header />
      <div className="cf-layout">
        <CashflowSidebar s={s} />

        <main className="cf-main">
          {/* Wizard step (inline centered) */}
          {!s.allComplete && currentWizardStep && (
            <CashflowWizardStep
              s={s}
              currentStep={currentWizardStep}
              onStepComplete={handleWizardStepComplete}
            />
          )}

          {/* Complete - Show outputs */}
          {s.allComplete && s.yearData.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* MODE SELECTOR */}
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
                      {s.effectiveViewMode === m && <span className="cf-mode-dot" />}
                    </button>
                  );
                })}
              </div>

              {/* Chart title */}
              <div className="cf-chart-inline-title">
                {chartModeLabel} — Year <span className="cf-chart-inline-year">{s.selectedYear}</span>
              </div>

              {/* CHART + KPI ROW */}
              <div className="cf-chart-kpi-row cf-layout-wide">
                <CashflowKpiStrip
                  position="left"
                  viewMode={s.effectiveViewMode}
                  yearData={s.yearData}
                  selectedYearData={s.selectedYearData}
                  selectedYear={s.selectedYear}
                  isInvestment={s.isInvestment}
                  marginalRate={s.marginalRate}
                />

                <CashflowChart
                  chartData={s.chartData}
                  yearData={s.yearData}
                  viewMode={s.effectiveViewMode}
                  selectedYear={s.selectedYear}
                  hoveredYear={s.hoveredYear}
                  isInvestment={s.isInvestment}
                  onSelectYear={s.setSelectedYear}
                  onHoverYear={s.setHoveredYear}
                />

                <CashflowKpiStrip
                  position="right"
                  viewMode={s.effectiveViewMode}
                  yearData={s.yearData}
                  selectedYearData={s.selectedYearData}
                  selectedYear={s.selectedYear}
                  isInvestment={s.isInvestment}
                  marginalRate={s.marginalRate}
                />
              </div>

              {/* DATA TABLE */}
              <CashflowDataTable
                yearData={s.yearData}
                viewMode={s.effectiveViewMode}
                selectedYear={s.selectedYear}
                isInvestment={s.isInvestment}
                hasOffset={s.hasOffset}
                propertyValue={s.propertyValue}
                onSelectYear={s.setSelectedYear}
                tableVariant="spacious"
              />
            </div>
          )}
        </main>
      </div>
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
