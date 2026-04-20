"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { DEPRECIATION_COLOR } from "@/lib/theme";
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

export default function CashflowDashboard({
  s, hoveredYear, tableExpanded, onHoverYear, onSelectYear, onManualExpand,
}: Props) {
  const displayYear = hoveredYear ?? s.selectedYear;
  const baseYear = new Date().getFullYear();
  const calendarYear = baseYear + displayYear - 1;
  const displayYearData = s.yearData.find(y => y.year === displayYear) ?? s.yearData[0];
  const y1 = displayYearData;
  const vm = s.effectiveViewMode;

  // Hero value/label/color per view mode
  const summaryCashflow = y1.salary + (s.isInvestment ? y1.rentalIncome : 0) - y1.ongoingCosts - y1.loanRepayment - y1.incomeTaxCalc;
  const signedCf = (v: number) => `${v >= 0 ? "+" : ""}${formatDollarsSigned(Math.round(v))}`;
  const heroValue = vm === "equity"
    ? formatDollarsSigned(Math.round(y1.netEquity))
    : vm === "deductions"
    ? formatDollarsSigned(Math.round(y1.totalDeductions))
    : vm === "tax"
    ? formatDollarsSigned(Math.round(-y1.incomeTaxCalc))
    : vm === "property"
    ? signedCf(y1.propertyCashflow)
    : signedCf(summaryCashflow);
  const heroLabel = vm === "equity" ? "Net Equity" : vm === "deductions" ? "Total Deductions" : vm === "tax" ? "Total Tax" : vm === "property" ? "Property Cashflow" : "Net Cashflow";
  const heroColor = vm === "summary"
    ? (summaryCashflow >= 0 ? "var(--color-data-positive)" : "var(--color-data-negative)")
    : vm === "property"
    ? (y1.propertyCashflow >= 0 ? "var(--color-data-positive)" : "var(--color-data-negative)")
    : vm === "tax"
    ? "var(--color-data-negative)"
    : vm === "deductions"
    ? DEPRECIATION_COLOR
    : null;

  // Compute the single panel prop for CashflowDataTable
  const panelProp: Record<string, string> = {};
  if (vm === "property" && s.isInvestment) panelProp.propertyPanel = "unified";
  else if (vm === "equity") panelProp.equityPanel = "unified";
  else if (vm === "tax" && s.isInvestment) panelProp.taxPanel = "unified";
  else if (vm === "summary") panelProp.summaryPanel = "unified";
  else if (vm === "deductions") panelProp.deductionsPanel = "unified";

  return (
    <main className="text-fg-primary max-w-[1400px] mx-auto px-4 py-6 flex flex-col gap-6">
      {/* ── Chart + Tabs ── */}
      <div className="flex items-stretch">
        <div className="relative flex-1 min-w-0 flex flex-col">
          <div className="flex gap-1.5 mt-5 mb-3 pr-6">
            {(["summary", "property", "tax", "equity", "deductions"] as ViewMode[]).map(m => {
              if (m === "tax" && !s.isInvestment) return null;
              const label = m === "summary" ? "Summary" : m === "property" ? "Property" : m === "tax" ? "Tax" : m === "equity" ? "Equity" : (s.isInvestment ? "Deductions" : "Expenses");
              return (
                <button
                  key={m}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[20px] border-none text-xs font-medium cursor-pointer transition-[background,color] duration-150 ${vm === m ? "bg-white/[0.08] text-fg-primary" : "bg-transparent text-[rgba(161,161,170,0.4)] hover:text-[rgba(161,161,170,0.6)]"}`}
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
            chartView="bars"
            onSelectYear={onSelectYear}
            onHoverYear={onHoverYear}
          />

          <div className="flex items-baseline justify-center gap-3 pt-[30px] pb-2.5">
            <span className="text-[23px] font-semibold text-brand tracking-[-0.02em] tabular-nums">Year {displayYear}</span>
            <span className="text-[22px] font-normal text-fg-tertiary">{calendarYear}</span>
            <span className="w-px h-[22px] bg-[rgba(113,113,122,0.25)]" />
            <span className="text-[23px] font-semibold tracking-[-0.02em] tabular-nums" style={heroColor ? { color: heroColor } : undefined}>{heroValue}</span>
            <span className="text-[22px] font-normal text-fg-tertiary">{heroLabel}</span>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="bg-surface-raised border border-default rounded-xl overflow-hidden">
        <CashflowKpiStrip
          viewMode={vm}
          yearData={s.yearData}
          selectedYearData={displayYearData}
          selectedYear={displayYear}
          isInvestment={s.isInvestment}
          marginalRate={s.marginalRate}
          hasOffset={s.hasOffset}
          isHovered={hoveredYear !== null}
          onHoverYear={onHoverYear}
          onSelectYear={onSelectYear}
        />
      </div>

      {/* ── Table ── */}
      <div className="border border-default rounded-xl overflow-hidden">
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
          {...panelProp}
        />
      </div>
    </main>
  );
}
