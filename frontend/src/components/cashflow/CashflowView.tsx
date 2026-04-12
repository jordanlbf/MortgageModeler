"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Home, TrendingUp, Receipt } from "lucide-react";
import Header from "@/components/layout/Header";
import { useCashflowState } from "@/hooks/useCashflowState";
import { formatCurrencyCf, parseCurrencyCf } from "@/lib/cashflow-calculations";
import type { ViewMode } from "@/lib/cashflow-types";
import CashflowSidebar from "./CashflowSidebar";
import CashflowChart, { chartViewOptions, type ChartView } from "./CashflowChart";
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
  const [sideTab, setSideTab] = useState<StepId>("property");
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [chartView, setChartView] = useState<ChartView>("bars");

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

  const sidebarStep = s.allComplete
    ? (activeTab === "wizard" ? editStep : undefined)
    : (currentWizardStep ?? undefined);

  // Auto-switch to dashboard when wizard completes
  useEffect(() => {
    if (s.allComplete && activeTab === "wizard" && !inlineStep) {
      setActiveTab("dashboard");
    }
  }, [s.allComplete, activeTab, inlineStep]);

  return (
    <>
      <Header />

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

      {/* ── Dashboard view: Fey-inspired layout ── */}
      {s.allComplete && s.yearData.length > 0 && activeTab === "dashboard" && (() => {
        const displayYear = hoveredYear ?? s.selectedYear;
        const baseYear = new Date().getFullYear();
        const calendarYear = baseYear + displayYear - 1;
        const displayYearData = s.yearData.find(y => y.year === displayYear) ?? s.yearData[0];
        const y1 = displayYearData;
        const sy = displayYearData;
        const vm = s.effectiveViewMode;

        // Hero data per view mode — Fey-style: value + label (muted) + secondary + color
        const heroMap: Record<ViewMode, { value: string; label: string; monthly: string; color: string }> = {
          summary: {
            value: formatCurrencyCf(Math.round(y1.netCashflow)),
            label: "net cashflow",
            monthly: `${formatCurrencyCf(Math.round(y1.netCashflow / 12))}/month`,
            color: y1.netCashflow >= 0 ? "var(--cf-accent)" : "var(--cf-negative)",
          },
          property: {
            value: formatCurrencyCf(Math.round(y1.propertyCashflow)),
            label: "property cashflow",
            monthly: `${formatCurrencyCf(Math.round(y1.propertyCashflow / 12))}/month`,
            color: y1.propertyCashflow >= 0 ? "var(--cf-accent)" : "var(--cf-negative)",
          },
          equity: {
            value: formatCurrencyCf(Math.round(y1.netEquity)),
            label: "net equity",
            monthly: `${((y1.loanBalance / y1.propertyValue) * 100).toFixed(1)}% LVR`,
            color: "var(--cf-accent)",
          },
          deductions: {
            value: formatCurrencyCf(Math.round(s.isInvestment ? y1.totalDeductions : y1.ongoingCosts)),
            label: s.isInvestment ? "total deductions" : "total expenses",
            monthly: `+${formatCurrencyCf(Math.round(y1.taxSaved))} tax saved`,
            color: "#a78bfa",
          },
        };
        const hero = heroMap[vm];

        return (
          <main className="cf-dashboard-view">

            {/* ── Hero + Chart + Tabs (left) with Side card (right) ── */}
            <div className="cf-chart-row cf-chart-row--vb">
              <div className="cf-chart-main">
                {/* Year overlay — positioned at top-right of chart-main, aligned with hero */}
                <div className="cf-year-overlay-positioned">
                  <span className="cf-year-overlay-yr" style={{ color: "var(--cf-accent)" }}>Year {displayYear}</span>
                  <span className="cf-year-overlay-cal">{calendarYear}</span>
                </div>

                {/* Chart view toggles */}
                <div className="cf-hero-area">
                  <div className="cf-mode-toggles">
                    {(vm === "equity" ? chartViewOptions : vm === "deductions" ? [chartViewOptions[0], chartViewOptions[2]] : [chartViewOptions[0]]).map((view) => {
                      const Icon = view.icon;
                      return (
                        <button
                          key={view.id}
                          onClick={() => setChartView(view.id)}
                          className={`cf-mode-toggle ${((vm === "equity" || vm === "deductions") ? chartView : "bars") === view.id ? "active" : ""}`}
                        >
                          <Icon size={14} />
                          {view.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chart */}
                <CashflowChart
                    chartData={s.chartData}
                    yearData={s.yearData}
                    viewMode={vm}
                    selectedYear={s.selectedYear}
                    hoveredYear={hoveredYear}
                    isInvestment={s.isInvestment}
                    chartView={(vm === "equity" || vm === "deductions") ? chartView : "bars"}
                    onSelectYear={s.setSelectedYear}
                    onHoverYear={setHoveredYear}
                />

                {/* View mode tabs with mode toggles (equity only) */}
                <div className="cf-mode-tabs-row">
                  {(["summary", "property", "equity", "deductions"] as ViewMode[]).map(m => {
                    const icon = m === "summary" ? <LayoutGrid size={14} /> : m === "property" ? <Home size={14} /> : m === "equity" ? <TrendingUp size={14} /> : <Receipt size={14} />;
                    const label = m === "summary" ? "Summary" : m === "property" ? "Property" : m === "equity" ? "Equity" : (s.isInvestment ? "Deductions" : "Expenses");
                    return (
                      <button
                        key={m}
                        className={`cf-mode-tab ${vm === m ? "active" : ""}`}
                        onClick={() => { s.setViewMode(m); s.setSelectedYear(1); }}
                      >
                        {icon}
                        {label}
                      </button>
                    );
                  })}

                </div>
              </div>

              {/* Side card — Inputs placeholder */}
              <div className="cf-outer-card cf-chart-side-card">
                <div className="cf-side-header">
                  <span className="cf-side-header-title">Inputs</span>
                </div>
                <div className="cf-side-content">
                  {sideTab === "property" && (() => {
                    if (s.isNewPurchase) {
                      const price = parseCurrencyCf(s.purchasePrice);
                      const deposit = parseCurrencyCf(s.depositAmount);
                      return (
                        <>
                          <div className="cf-side-field">
                            <span className="cf-side-label">Purchase Price</span>
                            <span className="cf-side-value" onClick={() => goToStep("property")}>{formatCurrencyCf(price)}</span>
                          </div>
                          <div className="cf-side-field">
                            <span className="cf-side-label">Deposit</span>
                            <span className="cf-side-value" onClick={() => goToStep("property")}>{formatCurrencyCf(deposit)}</span>
                          </div>
                          <div className="cf-side-field">
                            <span className="cf-side-label">Loan Amount</span>
                            <span className="cf-side-value-muted">{formatCurrencyCf(price - deposit)}</span>
                          </div>
                        </>
                      );
                    }
                    const val = parseCurrencyCf(s.currentValue);
                    const loan = parseCurrencyCf(s.currentLoanBalance);
                    return (
                      <>
                        <div className="cf-side-field">
                          <span className="cf-side-label">Current Value</span>
                          <span className="cf-side-value" onClick={() => goToStep("property")}>{formatCurrencyCf(val)}</span>
                        </div>
                        <div className="cf-side-field">
                          <span className="cf-side-label">Loan Balance</span>
                          <span className="cf-side-value" onClick={() => goToStep("property")}>{formatCurrencyCf(loan)}</span>
                        </div>
                        <div className="cf-side-field">
                          <span className="cf-side-label">Equity</span>
                          <span className="cf-side-value-muted">{formatCurrencyCf(val - loan)}</span>
                        </div>
                      </>
                    );
                  })()}
                  {sideTab === "loan" && (
                    <>
                      <div className="cf-side-field">
                        <span className="cf-side-label">Interest Rate</span>
                        <span className="cf-side-value" onClick={() => goToStep("loan")}>{s.interestRate}%</span>
                      </div>
                      <div className="cf-side-field">
                        <span className="cf-side-label">Loan Term</span>
                        <span className="cf-side-value" onClick={() => goToStep("loan")}>{s.loanTerm} years</span>
                      </div>
                      <div className="cf-side-field">
                        <span className="cf-side-label">Repayment Type</span>
                        <span className="cf-side-value-muted">P&I</span>
                      </div>
                    </>
                  )}
                  {sideTab === "costs" && (() => {
                    const council = parseCurrencyCf(s.councilRates);
                    const water = parseCurrencyCf(s.waterRates);
                    const ins = parseCurrencyCf(s.insurance);
                    const strata = s.hasStrata ? parseCurrencyCf(s.strataFees) * 4 : 0;
                    return (
                      <>
                        <div className="cf-side-field">
                          <span className="cf-side-label">Council Rates</span>
                          <span className="cf-side-value" onClick={() => goToStep("costs")}>{formatCurrencyCf(council)}/yr</span>
                        </div>
                        <div className="cf-side-field">
                          <span className="cf-side-label">Water Rates</span>
                          <span className="cf-side-value" onClick={() => goToStep("costs")}>{formatCurrencyCf(water)}/yr</span>
                        </div>
                        <div className="cf-side-field">
                          <span className="cf-side-label">Insurance</span>
                          <span className="cf-side-value" onClick={() => goToStep("costs")}>{formatCurrencyCf(ins)}/yr</span>
                        </div>
                        {s.hasStrata && (
                          <div className="cf-side-field">
                            <span className="cf-side-label">Strata</span>
                            <span className="cf-side-value" onClick={() => goToStep("costs")}>{formatCurrencyCf(strata)}/yr</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {sideTab === "rental" && s.isInvestment && (
                    <>
                      <div className="cf-side-field">
                        <span className="cf-side-label">Weekly Rent</span>
                        <span className="cf-side-value" onClick={() => goToStep("rental")}>{formatCurrencyCf(parseCurrencyCf(s.weeklyRent))}/wk</span>
                      </div>
                      <div className="cf-side-field">
                        <span className="cf-side-label">Management Fee</span>
                        <span className="cf-side-value" onClick={() => goToStep("rental")}>{s.managementFee}%</span>
                      </div>
                      <div className="cf-side-field">
                        <span className="cf-side-label">Annual Net</span>
                        <span className="cf-side-value-muted">{formatCurrencyCf(Math.round(parseCurrencyCf(s.weeklyRent) * 52 * (1 - (parseFloat(s.managementFee) || 0) / 100)))}</span>
                      </div>
                    </>
                  )}
                  {sideTab === "tax" && s.isInvestment && (
                    <>
                      <div className="cf-side-field">
                        <span className="cf-side-label">Taxable Income</span>
                        <span className="cf-side-value" onClick={() => goToStep("tax")}>{formatCurrencyCf(parseCurrencyCf(s.taxableIncome))}</span>
                      </div>
                      <div className="cf-side-field">
                        <span className="cf-side-label">Marginal Rate</span>
                        <span className="cf-side-value-muted">{Math.round(s.marginalRate * 100)}%</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="cf-side-tabs">
                  {(s.isInvestment
                    ? [
                        { id: "property" as StepId, label: "Property" },
                        { id: "loan" as StepId, label: "Loan" },
                        { id: "costs" as StepId, label: "Costs" },
                        { id: "rental" as StepId, label: "Rental" },
                        { id: "tax" as StepId, label: "Tax" },
                      ]
                    : [
                        { id: "property" as StepId, label: "Property" },
                        { id: "loan" as StepId, label: "Loan" },
                        { id: "costs" as StepId, label: "Costs" },
                      ]
                  ).map(t => (
                    <button
                      key={t.id}
                      className={`cf-side-tab ${sideTab === t.id ? "active" : ""}`}
                      onClick={() => setSideTab(t.id)}
                    >{t.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── KPI strip — Fey card ── */}
            <div className="cf-outer-card">
              <CashflowKpiStrip
                viewMode={vm}
                yearData={s.yearData}
                selectedYearData={displayYearData}
                selectedYear={displayYear}
                isInvestment={s.isInvestment}
                marginalRate={s.marginalRate}
                hasOffset={s.hasOffset}
                isHovered={hoveredYear !== null}
              />
            </div>

            {/* ── Table card(s) ── */}
            {vm === "property" && s.isInvestment ? (
              <div className="cf-property-cards">
                <div className="cf-outer-card cf-property-card">
                  <div className="cf-table-zone">
                    <CashflowDataTable
                      yearData={s.yearData}
                      viewMode={vm}
                      selectedYear={s.selectedYear}
                      hoveredYear={hoveredYear}
                      isInvestment={s.isInvestment}
                      hasOffset={s.hasOffset}
                      propertyValue={s.propertyValue}
                      propertyPanel="gearing"
                      onSelectYear={s.setSelectedYear}
                      onHoverYear={setHoveredYear}
                    />
                  </div>
                </div>
                <div className="cf-outer-card cf-property-card">
                  <div className="cf-table-zone">
                    <CashflowDataTable
                      yearData={s.yearData}
                      viewMode={vm}
                      selectedYear={s.selectedYear}
                      hoveredYear={hoveredYear}
                      isInvestment={s.isInvestment}
                      hasOffset={s.hasOffset}
                      propertyValue={s.propertyValue}
                      propertyPanel="cashflow"
                      onSelectYear={s.setSelectedYear}
                      onHoverYear={setHoveredYear}
                    />
                  </div>
                </div>
              </div>
            ) : vm === "equity" ? (
              <div className="cf-property-cards">
                <div className="cf-outer-card cf-property-card">
                  <div className="cf-table-zone">
                    <CashflowDataTable
                      yearData={s.yearData}
                      viewMode={vm}
                      selectedYear={s.selectedYear}
                      hoveredYear={hoveredYear}
                      isInvestment={s.isInvestment}
                      hasOffset={s.hasOffset}
                      propertyValue={s.propertyValue}
                      equityPanel="property"
                      onSelectYear={s.setSelectedYear}
                      onHoverYear={setHoveredYear}
                    />
                  </div>
                </div>
                <div className="cf-outer-card cf-property-card">
                  <div className="cf-table-zone">
                    <CashflowDataTable
                      yearData={s.yearData}
                      viewMode={vm}
                      selectedYear={s.selectedYear}
                      hoveredYear={hoveredYear}
                      isInvestment={s.isInvestment}
                      hasOffset={s.hasOffset}
                      propertyValue={s.propertyValue}
                      equityPanel="position"
                      onSelectYear={s.setSelectedYear}
                      onHoverYear={setHoveredYear}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="cf-outer-card">
                <div className="cf-table-zone">
                  <CashflowDataTable
                    yearData={s.yearData}
                    viewMode={vm}
                    selectedYear={s.selectedYear}
                    hoveredYear={hoveredYear}
                    isInvestment={s.isInvestment}
                    hasOffset={s.hasOffset}
                    propertyValue={s.propertyValue}
                    onSelectYear={s.setSelectedYear}
                    onHoverYear={setHoveredYear}
                  />
                </div>
              </div>
            )}
          </main>
        );
      })()}

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
