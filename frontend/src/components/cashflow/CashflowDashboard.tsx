"use client";

import { formatCurrencyCf } from "@/lib/cashflow-calculations";
import type { ViewMode } from "@/lib/cashflow-types";
import type { useCashflowState } from "@/hooks/useCashflowState";
import CashflowChart from "./CashflowChart";
import CashflowKpiStrip from "./CashflowKpiStrip";
import CashflowDataTable from "./CashflowDataTable";

interface Props {
  s: ReturnType<typeof useCashflowState>;
  hoveredYear: number | null;
  tableExpanded: Set<number>;
  onHoverYear: (year: number | null) => void;
  onSelectYear: (year: number) => void;
  onManualExpand: (expanded: Set<number>) => void;
}

/** Safe division — returns 0 when divisor is 0 or result is non-finite. */
const safeDiv = (a: number, b: number) => {
  const r = b !== 0 ? a / b : 0;
  return Number.isFinite(r) ? r : 0;
};

export default function CashflowDashboard({
  s, hoveredYear, tableExpanded, onHoverYear, onSelectYear, onManualExpand,
}: Props) {
  const displayYear = hoveredYear ?? s.selectedYear;
  const baseYear = new Date().getFullYear();
  const calendarYear = baseYear + displayYear - 1;
  const displayYearData = s.yearData.find(y => y.year === displayYear) ?? s.yearData[0];
  const y1 = displayYearData;
  const vm = s.effectiveViewMode;
  const depColor = "#fbbf24";

  // Hero value/label/color per view mode
  const summaryCashflow = y1.salary + (s.isInvestment ? y1.rentalIncome : 0) - y1.ongoingCosts - y1.loanRepayment - y1.incomeTaxCalc;
  const heroValue = vm === "equity"
    ? formatCurrencyCf(Math.round(y1.netEquity))
    : vm === "deductions"
    ? formatCurrencyCf(Math.round(y1.totalDeductions))
    : vm === "tax"
    ? formatCurrencyCf(Math.round(-y1.incomeTaxCalc))
    : vm === "property"
    ? formatCurrencyCf(Math.round(y1.propertyCashflow))
    : formatCurrencyCf(Math.round(summaryCashflow));
  const heroLabel = vm === "equity" ? "Net Equity" : vm === "deductions" ? "Total Deductions" : vm === "tax" ? "Total Tax" : vm === "property" ? "Property Cashflow" : "Net Cashflow";
  const heroColor = vm === "summary"
    ? (summaryCashflow >= 0 ? "var(--cf-positive)" : "var(--cf-negative)")
    : vm === "property"
    ? (y1.propertyCashflow >= 0 ? "var(--cf-positive)" : "var(--cf-negative)")
    : vm === "tax"
    ? "var(--cf-negative)"
    : vm === "deductions"
    ? "#a78bfa"
    : null;

  // Hero data per view mode
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
    tax: {
      value: formatCurrencyCf(Math.round(-y1.incomeTaxCalc)),
      label: "total tax",
      monthly: `${Math.round(s.marginalRate * 100)}% marginal rate`,
      color: "var(--cf-negative)",
    },
    equity: {
      value: formatCurrencyCf(Math.round(y1.netEquity)),
      label: "net equity",
      monthly: `${(safeDiv(y1.loanBalance, y1.propertyValue) * 100).toFixed(1)}% LVR`,
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

  // Compute the single panel prop for CashflowDataTable
  const panelProp: Record<string, string> = {};
  if (vm === "property" && s.isInvestment) panelProp.propertyPanel = "unified";
  else if (vm === "equity") panelProp.equityPanel = "unified";
  else if (vm === "tax" && s.isInvestment) panelProp.taxPanel = "unified";
  else if (vm === "summary") panelProp.summaryPanel = "unified";
  else if (vm === "deductions") panelProp.deductionsPanel = "unified";

  return (
    <main className="cf-dashboard-view">
      {/* ── Chart + Tabs ── */}
      <div className="cf-chart-row">
        <div className="cf-chart-main">
          <div className="cf-mode-tabs-row">
            {(["summary", "property", "tax", "equity", "deductions"] as ViewMode[]).map(m => {
              if (m === "tax" && !s.isInvestment) return null;
              const label = m === "summary" ? "Summary" : m === "property" ? "Property" : m === "tax" ? "Tax" : m === "equity" ? "Equity" : (s.isInvestment ? "Deductions" : "Expenses");
              return (
                <button
                  key={m}
                  className={`cf-mode-tab ${vm === m ? "active" : ""}`}
                  onClick={() => { s.setViewMode(m); s.setSelectedYear(1); }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <CashflowChart
            chartData={s.chartData}
            yearData={s.yearData}
            viewMode={vm}
            selectedYear={s.selectedYear}
            hoveredYear={hoveredYear}
            isInvestment={s.isInvestment}
            chartView="bars"
            onSelectYear={onSelectYear}
            onHoverYear={onHoverYear}
          />

          <div className="cf-year-label">
            <span className="cf-year-label-year">Year {displayYear}</span>
            <span className="cf-year-label-cal">{calendarYear}</span>
            <span className="cf-year-label-divider" />
            <span className="cf-year-label-value" style={heroColor ? { color: heroColor } : undefined}>{heroValue}</span>
            <span className="cf-year-label-metric">{heroLabel}</span>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
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
          depColor={depColor}
        />
      </div>

      {/* ── Table ── */}
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
            expandedMilestones={tableExpanded}
            onExpandedChange={onManualExpand}
            onSelectYear={onSelectYear}
            onHoverYear={onHoverYear}
            depColor={vm === "deductions" ? depColor : undefined}
            {...panelProp}
          />
        </div>
      </div>
    </main>
  );
}
