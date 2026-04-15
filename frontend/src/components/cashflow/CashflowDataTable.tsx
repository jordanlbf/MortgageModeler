"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { formatCurrencyCf, getMarginalTaxRate } from "@/lib/cashflow-calculations";

/** Safe division — returns 0 when divisor is 0 or result is non-finite. */
const safeDiv = (a: number, b: number) => {
  const r = b !== 0 ? a / b : 0;
  return Number.isFinite(r) ? r : 0;
};

/** Safe YoY % change: ((current / previous) - 1) * 100, returns 0 when previous is 0. */
const yoyPct = (current: number, previous: number) => previous === 0 ? 0 : (safeDiv(current, previous) - 1) * 100;

/** Safe growth % from base: ((current / base) - 1) * 100, returns 0 when base is 0. */
const growthPct = (current: number, base: number) => base === 0 ? 0 : (safeDiv(current, base) - 1) * 100;

/** Pick YoY badge class: neutral for zero, otherwise positive/negative. */
const yoyClass = (value: number, positiveWhen: "positive" | "negative" = "positive") =>
  value === 0 ? "cft-yoy-neutral"
    : positiveWhen === "positive"
      ? (value > 0 ? "cft-yoy-positive" : "cft-yoy-negative")
      : (value < 0 ? "cft-yoy-positive" : "cft-yoy-negative");

/** Format a YoY badge string. */
const fmtYoY = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

interface Props {
  yearData: YearData[];
  viewMode: ViewMode;
  selectedYear: number;
  hoveredYear: number | null;
  isInvestment: boolean;
  hasOffset: boolean;
  propertyValue: number;
  propertyPanel?: "gearing" | "cashflow" | "unified";
  equityPanel?: "property" | "position" | "unified";
  taxPanel?: "deductions" | "tax" | "unified";
  summaryPanel?: "income" | "outgoings" | "cashflow" | "unified";
  deductionsPanel?: "holding" | "depreciation" | "totals" | "unified";
  depColor?: string;
  showExpandButton?: boolean;
  expandedMilestones?: Set<number>;
  onExpandedChange?: (expanded: Set<number>) => void;
  onSelectYear: (year: number) => void;
  onHoverYear: (year: number | null) => void;
}

export default function CashflowDataTable({
  yearData, viewMode, selectedYear, hoveredYear, isInvestment,
  hasOffset, propertyValue, propertyPanel, equityPanel, taxPanel, summaryPanel, deductionsPanel, depColor = "#a78bfa", showExpandButton = true,
  expandedMilestones: externalExpanded, onExpandedChange,
  onSelectYear, onHoverYear,
}: Props) {
  const baseYear = new Date().getFullYear();
  const showOffset = hasOffset && yearData.some(y => y.offsetBalanceAtYear > 0);

  // Expansion state - use external if provided, otherwise local
  const [localExpanded, setLocalExpanded] = useState<Set<number>>(new Set());
  const expandedMilestones = externalExpanded ?? localExpanded;
  const setExpandedMilestones = onExpandedChange ?? setLocalExpanded;

  // Column group expansion state (for collapsible column groups)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };
  const isGroupExpanded = (group: string) => expandedGroups.has(group);

  // Milestone years: 1, 6, 11, 16, 21, 26
  const isMilestoneYear = (year: number) => year === 1 || (year - 1) % 5 === 0;
  const getMilestoneForYear = (year: number) => {
    if (year === 1) return 1;
    return Math.floor((year - 1) / 5) * 5 + 1;
  };

  // Toggle expansion (manual)
  const toggleMilestone = (milestone: number) => {
    const next = new Set(expandedMilestones);
    if (next.has(milestone)) next.delete(milestone);
    else next.add(milestone);
    setExpandedMilestones(next);
  };

  // Determine if a row should be visible - default to collapsed
  const isRowVisible = (year: number) => {
    if (isMilestoneYear(year)) return true;

    const milestone = getMilestoneForYear(year);

    // Only show if expanded
    if (expandedMilestones.has(milestone)) return true;

    return false;
  };

  // Get years that belong to a milestone group (years 2-5 after the milestone)
  const getGroupYears = (milestone: number) => {
    const endYear = milestone + 4;
    return yearData.filter(y => y.year > milestone && y.year <= endYear);
  };

  // Generate row handlers - no hover, only click
  const getRowHandlers = (year: number, isMilestone: boolean) => ({
    onClick: () => {
      if (isMilestone) {
        toggleMilestone(year);
      }
      onSelectYear(year);
    },
    onMouseEnter: () => onHoverYear(year),
    onMouseLeave: () => onHoverYear(null),
  });

  // Format year cell — circle badge + calendar year + expansion indicator
  const formatYearCell = (year: number, index: number, isMilestoneRow = false) => {
    const cal = baseYear + index;
    const isSelected = year === selectedYear;
    const isHovered = year === hoveredYear && !isSelected;
    const milestone = getMilestoneForYear(year);
    const isExpanded = expandedMilestones.has(milestone);
    const groupYears = getGroupYears(year);
    const hasGroupYears = groupYears.length > 0;

    const showChevron = isMilestoneRow && hasGroupYears;

    return (
      <span className="cft-year-cell cft-year-badge-wrap">
        {showChevron && (
          <span className="cft-expand-chevron">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}
        <span className={`cft-year-badge ${isSelected ? "cft-year-badge-selected" : isHovered ? "cft-year-badge-hovered" : ""}`} style={{ color: isMilestoneRow ? "var(--cf-accent)" : "rgba(255, 255, 255, 0.75)" }}>
          Year {year}
        </span>
      </span>
    );
  };

  // Determine value styling tier: result (teal), outflow (muted red), or neutral
  const getValueClass = (value: number, isResult = false, isOutflow = false, isTaxSaved = false) => {
    if (isResult) return value < 0 ? "cft-val-negative" : "cft-val-result";
    if (isTaxSaved && value > 0) return "cft-val-result";
    if (isOutflow) return "cft-val-outflow";
    return "cft-val-neutral";
  };

  // LVR conditional styling
  const getLvrClass = (lvr: number) => {
    if (lvr > 80) return "cft-lvr-danger";
    if (lvr > 60) return "cft-lvr-moderate";
    return "cft-lvr-healthy";
  };

  // Row class helper for selected/hovered states
  const isSecondPanel = propertyPanel === "cashflow" || equityPanel === "position";

  const getRowClass = (year: number, isMilestoneRow = false) => {
    const isSelected = year === selectedYear;
    const isHovered = year === hoveredYear && !isSelected;
    const isExpandable = isMilestoneRow;
    const isChildRow = !isMilestoneRow && !isMilestoneYear(year);
    return `cft-row cft-sep-shadow ${isSelected ? "cft-row-active" : ""} ${isHovered ? "cft-row-hover" : ""} ${isExpandable ? "cft-row-expandable" : ""} ${isMilestoneRow ? "cft-row-milestone" : ""} ${isChildRow ? "cft-row-child" : ""}`;
  };

  return (
    <div className="cft-outer">
      {showExpandButton && (
        <button
          className="cft-expand-all-btn"
          onClick={() => {
            if (expandedMilestones.size > 0) {
              setExpandedMilestones(new Set());
            } else {
              setExpandedMilestones(new Set([1, 6, 11, 16, 21, 26]));
            }
          }}
          title={expandedMilestones.size > 0 ? "Collapse all" : "Expand all"}
        >
          {expandedMilestones.size > 0 ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
      )}
    <div className="cft-wrap">
      {/* SUMMARY — Income panel (collapsible columns) */}
      {viewMode === "summary" && summaryPanel === "income" && (
        <table className="cft-table cft-table-narrow cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th
                className="cft-group-cell cft-group-label cft-group-income cft-group-clickable"
                colSpan={isGroupExpanded("income") ? (isInvestment ? 5 : 3) : 1}
                onClick={() => toggleGroup("income")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("income") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>income</span>
                </span>
              </th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              {isGroupExpanded("income") && <th className="cft-th cft-tip cft-detail-col" data-tip="Annual Salary (grows with capital growth rate)">salary</th>}
              {isGroupExpanded("income") && <th className="cft-th cft-tip cft-detail-col" data-tip="Year-on-Year Salary Growth">gain %</th>}
              {isGroupExpanded("income") && isInvestment && <th className="cft-th cft-tip cft-detail-col" data-tip="Annual Rental Income (grows with capital growth rate)">rent</th>}
              {isGroupExpanded("income") && isInvestment && <th className="cft-th cft-tip cft-detail-col" data-tip="Year-on-Year Rent Growth">gain %</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip="Salary + Rent">total income</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const prevSalary = i > 0 ? yearData[i - 1].salary : y.salary;
              const prevRent = i > 0 ? yearData[i - 1].rentalIncome : y.rentalIncome;
              const salaryGain = yoyPct(y.salary, prevSalary).toFixed(1);
              const rentGain = yoyPct(y.rentalIncome, prevRent).toFixed(1);
              const totalIncome = y.salary + (isInvestment ? y.rentalIncome : 0);
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  {isGroupExpanded("income") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.salary))}</td>}
                  {isGroupExpanded("income") && <td className="cft-td cft-detail-cell" style={{ color: parseFloat(salaryGain) > 0 ? "var(--cf-positive)" : "var(--cf-text-dim)" }}>{salaryGain}%</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="cft-td cft-detail-cell" style={{ color: parseFloat(rentGain) > 0 ? "var(--cf-positive)" : "var(--cf-text-dim)" }}>{rentGain}%</td>}
                  <td className="cft-td cft-td-result" style={{ fontWeight: 700, color: "var(--cf-text)" }}>
                    {formatCurrencyCf(Math.round(totalIncome))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* SUMMARY — Outgoings panel (collapsible columns) */}
      {viewMode === "summary" && summaryPanel === "outgoings" && (
        <table className="cft-table cft-table-narrow cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th
                className="cft-group-cell cft-group-label cft-group-costs cft-group-clickable"
                colSpan={isGroupExpanded("outgoings") ? 4 : 1}
                onClick={() => toggleGroup("outgoings")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("outgoings") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>outgoings</span>
                </span>
              </th>
            </tr>
            <tr className="cft-header-row">
              {isGroupExpanded("outgoings") && <th className="cft-th cft-tip cft-detail-col" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>}
              {isGroupExpanded("outgoings") && <th className="cft-th cft-tip cft-detail-col" data-tip="Interest + Principal">repayments</th>}
              {isGroupExpanded("outgoings") && <th className="cft-th cft-tip cft-detail-col" data-tip="Income Tax (incl. Medicare Levy)">tax</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip="Holding + Repayments + Tax">total costs</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const totalCosts = y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("outgoings") && <td className={`cft-td cft-detail-cell ${getValueClass(-y.ongoingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-y.ongoingCosts))}</td>}
                  {isGroupExpanded("outgoings") && <td className={`cft-td cft-detail-cell ${getValueClass(-y.loanRepayment, false, true)}`}>{formatCurrencyCf(Math.round(-y.loanRepayment))}</td>}
                  {isGroupExpanded("outgoings") && <td className={`cft-td cft-detail-cell ${getValueClass(-y.incomeTaxCalc, false, true)}`}>{formatCurrencyCf(Math.round(-y.incomeTaxCalc))}</td>}
                  <td className="cft-td cft-td-result" style={{ fontWeight: 700, color: "var(--cf-negative)" }}>
                    {formatCurrencyCf(Math.round(-totalCosts))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* SUMMARY — Cashflow panel */}
      {viewMode === "summary" && summaryPanel === "cashflow" && (
        <table className="cft-table cft-table-narrow">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell cft-group-label cft-group-net" colSpan={3}>cashflow</th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-tip" data-tip="Salary + Rent">total income</th>
              <th className="cft-th cft-tip" data-tip="Holding + Repayments + Tax">total costs</th>
              <th className="cft-th cft-th-result cft-tip" data-tip="Total Income − Total Costs">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const totalIncome = y.salary + (isInvestment ? y.rentalIncome : 0);
              const totalCosts = y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc;
              const annualCashflow = totalIncome - totalCosts;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(totalIncome))}</td>
                  <td className={`cft-td ${getValueClass(-totalCosts, false, true)}`}>{formatCurrencyCf(Math.round(-totalCosts))}</td>
                  <td className={`cft-td cft-td-result ${annualCashflow >= 0 ? "cft-val-positive" : "cft-val-negative"}`}>
                    {formatCurrencyCf(Math.round(annualCashflow))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* SUMMARY — Unified table (all columns in one table with collapsible groups) */}
      {viewMode === "summary" && summaryPanel === "unified" && (
        <table className="cft-table cft-table-wide cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th
                className="cft-group-cell cft-group-label cft-group-income cft-group-clickable"
                colSpan={isGroupExpanded("income") ? (isInvestment ? 5 : 3) : 1}
                onClick={() => toggleGroup("income")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("income") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>income</span>
                </span>
              </th>
              <th className="cft-group-cell cft-group-divider" />
              <th
                className="cft-group-cell cft-group-label cft-group-costs cft-group-clickable"
                colSpan={isGroupExpanded("outgoings") ? 4 : 1}
                onClick={() => toggleGroup("outgoings")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("outgoings") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>outgoings</span>
                </span>
              </th>
              <th className="cft-group-cell cft-group-divider" />
              <th className="cft-group-cell cft-group-label cft-group-net">cashflow</th>
            </tr>
            {(isGroupExpanded("income") || isGroupExpanded("outgoings")) && (
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              {/* Income detail columns */}
              {isGroupExpanded("income") && <th className="cft-th cft-tip cft-detail-col" data-tip="Annual Salary">salary</th>}
              {isGroupExpanded("income") && <th className="cft-th cft-tip cft-detail-col" data-tip="Year-on-Year Salary Growth">gain %</th>}
              {isGroupExpanded("income") && isInvestment && <th className="cft-th cft-tip cft-detail-col" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("income") && isInvestment && <th className="cft-th cft-tip cft-detail-col" data-tip="Year-on-Year Rent Growth">gain %</th>}
              <th className="cft-th cft-th-agg cft-tip" data-tip="Salary + Rent">total</th>
              <th className="cft-th-divider" />
              {/* Outgoings detail columns */}
              {isGroupExpanded("outgoings") && <th className="cft-th cft-tip cft-detail-col" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>}
              {isGroupExpanded("outgoings") && <th className="cft-th cft-tip cft-detail-col" data-tip="Interest + Principal">repay</th>}
              {isGroupExpanded("outgoings") && <th className="cft-th cft-tip cft-detail-col" data-tip="Income Tax (incl. Medicare Levy)">tax</th>}
              <th className="cft-th cft-th-agg cft-tip" data-tip="Holding + Repayments + Tax">total</th>
              <th className="cft-th-divider" />
              {/* Cashflow result */}
              <th className="cft-th cft-th-result cft-tip" data-tip="Total Income − Total Costs">net</th>
            </tr>
            )}
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const prevSalary = i > 0 ? yearData[i - 1].salary : y.salary;
              const prevRent = i > 0 ? yearData[i - 1].rentalIncome : y.rentalIncome;
              const salaryGain = yoyPct(y.salary, prevSalary).toFixed(1);
              const rentGain = yoyPct(y.rentalIncome, prevRent).toFixed(1);
              const totalIncome = y.salary + (isInvestment ? y.rentalIncome : 0);
              const totalCosts = y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc;
              const annualCashflow = totalIncome - totalCosts;

              // Calculate YoY changes for collapsed view
              const prevIncome = i > 0 ? yearData[i - 1].salary + (isInvestment ? yearData[i - 1].rentalIncome : 0) : totalIncome;
              const prevCosts = i > 0 ? yearData[i - 1].ongoingCosts + yearData[i - 1].loanRepayment + yearData[i - 1].incomeTaxCalc : totalCosts;
              const incomeYoY = yoyPct(totalIncome, prevIncome);
              const costsYoY = yoyPct(totalCosts, prevCosts);

              const isCollapsed = !isGroupExpanded("income") && !isGroupExpanded("outgoings");

              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "cft-row-summary-collapsed" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  {/* Income detail cells */}
                  {isGroupExpanded("income") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.salary))}</td>}
                  {isGroupExpanded("income") && <td className="cft-td cft-detail-cell" style={{ color: parseFloat(salaryGain) > 0 ? "var(--cf-positive)" : "var(--cf-text-dim)" }}>{salaryGain}%</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="cft-td cft-detail-cell" style={{ color: parseFloat(rentGain) > 0 ? "var(--cf-positive)" : "var(--cf-text-dim)" }}>{rentGain}%</td>}
                  {/* Income total - larger when collapsed, with YoY indicator */}
                  <td className={`cft-td ${isCollapsed ? "cft-td-summary-lg" : "cft-td-agg"}`}>
                    <span className="cft-summary-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(totalIncome))}</span>
                    {isCollapsed && (
                      <span className={`cft-yoy-badge ${yoyClass(incomeYoY)}`}>{fmtYoY(incomeYoY)}</span>
                    )}
                  </td>
                  <td className="cft-td-divider" />
                  {/* Outgoings detail cells */}
                  {isGroupExpanded("outgoings") && <td className={`cft-td cft-detail-cell ${getValueClass(-y.ongoingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-y.ongoingCosts))}</td>}
                  {isGroupExpanded("outgoings") && <td className={`cft-td cft-detail-cell ${getValueClass(-y.loanRepayment, false, true)}`}>{formatCurrencyCf(Math.round(-y.loanRepayment))}</td>}
                  {isGroupExpanded("outgoings") && <td className={`cft-td cft-detail-cell ${getValueClass(-y.incomeTaxCalc, false, true)}`}>{formatCurrencyCf(Math.round(-y.incomeTaxCalc))}</td>}
                  {/* Outgoings total - larger when collapsed, with YoY indicator */}
                  <td className={`cft-td ${isCollapsed ? "cft-td-summary-lg" : "cft-td-agg"}`}>
                    <span className="cft-summary-value" style={{ color: "var(--cf-negative)" }}>{formatCurrencyCf(Math.round(-totalCosts))}</span>
                    {isCollapsed && (
                      <span className={`cft-yoy-badge ${yoyClass(costsYoY, "negative")}`}>{fmtYoY(costsYoY)}</span>
                    )}
                  </td>
                  <td className="cft-td-divider" />
                  {/* Cashflow result */}
                  <td className={`cft-td ${isCollapsed ? "cft-td-result-lg" : "cft-td-result"} ${annualCashflow >= 0 ? "cft-val-positive" : "cft-val-negative"}`}>
                    <span className="cft-summary-value">{annualCashflow >= 0 ? "+" : ""}{formatCurrencyCf(Math.round(annualCashflow))}</span>
                    {isCollapsed && (() => {
                      const prevCashflow = i > 0 ? (prevIncome - prevCosts) : annualCashflow;
                      const cashflowYoY = yoyPct(annualCashflow, prevCashflow);
                      return (
                        <span className={`cft-yoy-badge ${yoyClass(cashflowYoY)}`}>{fmtYoY(cashflowYoY)}</span>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* TAX — Deductions panel (collapsible columns) */}
      {viewMode === "tax" && taxPanel === "deductions" && (
        <table className="cft-table cft-table-narrow cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th
                className="cft-group-cell cft-group-label cft-group-tax cft-group-clickable"
                colSpan={isGroupExpanded("deductions") ? 4 : 1}
                onClick={() => toggleGroup("deductions")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("deductions") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>deductions</span>
                </span>
              </th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              {isGroupExpanded("deductions") && <th className="cft-th cft-tip cft-detail-col" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>}
              {isGroupExpanded("deductions") && <th className="cft-th cft-tip cft-detail-col" data-tip="Loan Interest Paid">interest</th>}
              {isGroupExpanded("deductions") && <th className="cft-th cft-tip cft-detail-col" data-tip="Div 43 + Div 40 Depreciation">depr.</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip="Total Deductible Expenses">total ded.</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const depreciation = y.depDiv43 + y.depDiv40;
              const totalDeductions = y.ongoingCosts + y.interestPortion + depreciation;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  {isGroupExpanded("deductions") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.ongoingCosts))}</td>}
                  {isGroupExpanded("deductions") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.interestPortion))}</td>}
                  {isGroupExpanded("deductions") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(depreciation))}</td>}
                  <td className="cft-td cft-td-result" style={{ fontWeight: 700, color: "var(--cf-text)" }}>
                    {formatCurrencyCf(Math.round(totalDeductions))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* TAX — Tax panel (collapsible columns) */}
      {viewMode === "tax" && taxPanel === "tax" && (
        <table className="cft-table cft-table-narrow cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th
                className="cft-group-cell cft-group-label cft-group-net cft-group-clickable"
                colSpan={isGroupExpanded("tax") ? 6 : 1}
                onClick={() => toggleGroup("tax")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("tax") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>tax</span>
                </span>
              </th>
            </tr>
            <tr className="cft-header-row">
              {isGroupExpanded("tax") && <th className="cft-th cft-tip cft-detail-col" data-tip="Salary + Rental Income">total income</th>}
              {isGroupExpanded("tax") && <th className="cft-th cft-tip cft-detail-col" data-tip="Total Deductible Expenses">deductions</th>}
              {isGroupExpanded("tax") && <th className="cft-th cft-tip cft-detail-col" data-tip="Tax Saved From Property Deductions">benefit</th>}
              {isGroupExpanded("tax") && <th className="cft-th cft-tip cft-detail-col" data-tip="Income After Deductions">taxable inc.</th>}
              {isGroupExpanded("tax") && <th className="cft-th cft-tip cft-detail-col" data-tip="Marginal Tax Rate Band">bracket</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip="Income Tax (incl. Medicare Levy)">total tax</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const totalIncome = y.salary + y.rentalIncome;
              const depreciation = y.depDiv43 + y.depDiv40;
              const totalDeductions = y.ongoingCosts + y.interestPortion + depreciation;
              const taxableIncome = y.grossIncome - y.totalDeductionsForTax;
              const bracket = getMarginalTaxRate(taxableIncome);
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("tax") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(totalIncome))}</td>}
                  {isGroupExpanded("tax") && <td className={`cft-td cft-detail-cell ${getValueClass(-totalDeductions, false, true)}`}>{formatCurrencyCf(Math.round(-totalDeductions))}</td>}
                  {isGroupExpanded("tax") && <td className="cft-td cft-detail-cell" style={{ color: "var(--cf-positive)" }}>
                    {y.taxSaved > 0 ? `(+${formatCurrencyCf(Math.round(y.taxSaved))})` : "—"}
                  </td>}
                  {isGroupExpanded("tax") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(taxableIncome))}</td>}
                  {isGroupExpanded("tax") && <td className="cft-td cft-val-dim cft-detail-cell">{(bracket * 100).toFixed(bracket % 0.01 === 0 ? 0 : 1)}%</td>}
                  <td className="cft-td cft-td-result" style={{ fontWeight: 700, color: "var(--cf-negative)" }}>
                    {formatCurrencyCf(Math.round(-y.incomeTaxCalc))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* TAX — Unified (Deductions + Tax in one table) */}
      {viewMode === "tax" && taxPanel === "unified" && (
        <table className="cft-table cft-table-wide cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th
                className="cft-group-cell cft-group-label cft-group-tax cft-group-clickable"
                colSpan={isGroupExpanded("deductions") ? 4 : 1}
                onClick={() => toggleGroup("deductions")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("deductions") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>deductions</span>
                </span>
              </th>
              <th className="cft-group-cell cft-group-divider" />
              <th
                className="cft-group-cell cft-group-label cft-group-net cft-group-clickable"
                colSpan={isGroupExpanded("tax") ? 6 : 1}
                onClick={() => toggleGroup("tax")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("tax") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>tax</span>
                </span>
              </th>
            </tr>
            {(isGroupExpanded("deductions") || isGroupExpanded("tax")) && (
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              {/* Deductions detail columns */}
              {isGroupExpanded("deductions") && <th className="cft-th cft-tip cft-detail-col" data-tip="Ongoing Holding Costs">holding</th>}
              {isGroupExpanded("deductions") && <th className="cft-th cft-tip cft-detail-col" data-tip="Loan Interest Paid">interest</th>}
              {isGroupExpanded("deductions") && <th className="cft-th cft-tip cft-detail-col" data-tip="Div 43 + Div 40">depr.</th>}
              <th className="cft-th cft-th-agg cft-tip" data-tip="Total Deductible Expenses">total ded.</th>
              <th className="cft-th-divider" />
              {/* Tax detail columns */}
              {isGroupExpanded("tax") && <th className="cft-th cft-tip cft-detail-col" data-tip="Salary + Rent">income</th>}
              {isGroupExpanded("tax") && <th className="cft-th cft-tip cft-detail-col" data-tip="Total Deductions">ded.</th>}
              {isGroupExpanded("tax") && <th className="cft-th cft-tip cft-detail-col" data-tip="Tax Benefit From Deductions">benefit</th>}
              {isGroupExpanded("tax") && <th className="cft-th cft-tip cft-detail-col" data-tip="Income After Deductions">taxable</th>}
              {isGroupExpanded("tax") && <th className="cft-th cft-tip cft-detail-col" data-tip="Marginal Tax Rate">bracket</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip="Income Tax (incl. Medicare Levy)">total tax</th>
            </tr>
            )}
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const depreciation = y.depDiv43 + y.depDiv40;
              const totalDeductions = y.ongoingCosts + y.interestPortion + depreciation;
              const totalIncome = y.salary + y.rentalIncome;
              const taxableIncome = y.grossIncome - y.totalDeductionsForTax;
              const bracket = getMarginalTaxRate(taxableIncome);
              const isCollapsed = !isGroupExpanded("deductions") && !isGroupExpanded("tax");
              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "cft-row-summary-collapsed" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  {/* Deductions detail cells */}
                  {isGroupExpanded("deductions") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.ongoingCosts))}</td>}
                  {isGroupExpanded("deductions") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.interestPortion))}</td>}
                  {isGroupExpanded("deductions") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(depreciation))}</td>}
                  <td className={`cft-td ${isCollapsed ? "cft-td-summary-lg" : "cft-td-agg"}`} style={{ fontWeight: 600, color: "var(--cf-text)" }}>
                    <span className="cft-summary-value">{formatCurrencyCf(Math.round(totalDeductions))}</span>
                    {isCollapsed && (() => {
                      const prevDed = i > 0 ? (() => { const py = yearData[i-1]; return py.ongoingCosts + py.interestPortion + py.depDiv43 + py.depDiv40; })() : totalDeductions;
                      const dedYoY = yoyPct(totalDeductions, prevDed);
                      return <span className={`cft-yoy-badge ${yoyClass(dedYoY, "negative")}`}>{fmtYoY(dedYoY)}</span>;
                    })()}
                  </td>
                  <td className="cft-td-divider" />
                  {/* Tax detail cells */}
                  {isGroupExpanded("tax") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(totalIncome))}</td>}
                  {isGroupExpanded("tax") && <td className={`cft-td cft-detail-cell ${getValueClass(-totalDeductions, false, true)}`}>{formatCurrencyCf(Math.round(-totalDeductions))}</td>}
                  {isGroupExpanded("tax") && <td className="cft-td cft-detail-cell" style={{ color: "var(--cf-positive)" }}>
                    {y.taxSaved > 0 ? `+${formatCurrencyCf(Math.round(y.taxSaved))}` : "—"}
                  </td>}
                  {isGroupExpanded("tax") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(taxableIncome))}</td>}
                  {isGroupExpanded("tax") && <td className="cft-td cft-val-dim cft-detail-cell">{(bracket * 100).toFixed(bracket % 0.01 === 0 ? 0 : 1)}%</td>}
                  <td className={`cft-td ${isCollapsed ? "cft-td-result-lg" : "cft-td-result"}`} style={{ fontWeight: 700, color: "var(--cf-negative)" }}>
                    <span className="cft-summary-value">{formatCurrencyCf(Math.round(-y.incomeTaxCalc))}</span>
                    {isCollapsed && (() => {
                      const prevTax = i > 0 ? yearData[i-1].incomeTaxCalc : y.incomeTaxCalc;
                      const taxYoY = yoyPct(y.incomeTaxCalc, prevTax);
                      return <span className={`cft-yoy-badge ${yoyClass(taxYoY, "negative")}`}>{fmtYoY(taxYoY)}</span>;
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — Gearing panel (collapsible columns) */}
      {viewMode === "property" && isInvestment && propertyPanel === "gearing" && (
        <table className="cft-table cft-table-narrow cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th
                className="cft-group-cell cft-group-label cft-group-tax cft-group-clickable"
                colSpan={isGroupExpanded("gearing") ? 4 : 1}
                onClick={() => toggleGroup("gearing")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("gearing") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>gearing</span>
                </span>
              </th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              {isGroupExpanded("gearing") && <th className="cft-th cft-tip cft-detail-col" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("gearing") && <th className="cft-th cft-tip cft-detail-col" data-tip="Interest + Ongoing Costs">holding</th>}
              {isGroupExpanded("gearing") && <th className="cft-th cft-tip cft-detail-col" data-tip="Div 43 + Div 40 Depreciation">depreciation</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip="Rent − Holding − Depreciation (negative = negatively geared)">net gearing</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingCosts = y.interestPortion + y.ongoingCosts;
              const depreciation = y.depDiv43 + y.depDiv40;
              const netGearing = y.rentalIncome - holdingCosts - depreciation;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  {isGroupExpanded("gearing") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("gearing") && <td className={`cft-td cft-detail-cell ${getValueClass(-holdingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-holdingCosts))}</td>}
                  {isGroupExpanded("gearing") && <td className={`cft-td cft-detail-cell ${getValueClass(-depreciation, false, true)}`}>{formatCurrencyCf(Math.round(-depreciation))}</td>}
                  <td className={`cft-td cft-td-result ${netGearing >= 0 ? "cft-val-positive" : "cft-val-negative"}`}>{formatCurrencyCf(Math.round(netGearing))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — Cashflow panel (collapsible columns) */}
      {viewMode === "property" && isInvestment && propertyPanel === "cashflow" && (
        <table className="cft-table cft-table-narrow cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th
                className="cft-group-cell cft-group-label cft-group-net cft-group-clickable"
                colSpan={isGroupExpanded("propertyCashflow") ? 4 : 1}
                onClick={() => toggleGroup("propertyCashflow")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("propertyCashflow") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>cashflow</span>
                </span>
              </th>
            </tr>
            <tr className="cft-header-row">
              {isGroupExpanded("propertyCashflow") && <th className="cft-th cft-tip cft-detail-col" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("propertyCashflow") && <th className="cft-th cft-th-agg cft-tip cft-detail-col" data-tip="Holding + Repayments">total costs</th>}
              {isGroupExpanded("propertyCashflow") && <th className="cft-th cft-tip cft-detail-col" data-tip="Tax Benefit From Property Deductions">tax saved</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip="Rent − Total Costs + Tax Saved">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingCosts = y.interestPortion + y.ongoingCosts;
              const totalCosts = holdingCosts + y.principalPortion;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("propertyCashflow") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("propertyCashflow") && <td className={`cft-td cft-detail-cell ${getValueClass(-totalCosts, false, true)}`}>{formatCurrencyCf(Math.round(-totalCosts))}</td>}
                  {isGroupExpanded("propertyCashflow") && <td className="cft-td cft-detail-cell" style={{ color: "var(--cf-positive)" }}>{y.taxSaved > 0 ? "+" : ""}{formatCurrencyCf(Math.round(y.taxSaved))}</td>}
                  <td className={`cft-td cft-td-result ${y.propertyCashflow >= 0 ? "cft-val-positive" : "cft-val-negative"}`}>
                    {formatCurrencyCf(Math.round(y.propertyCashflow))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — Unified (Gearing + Cashflow in one table) */}
      {viewMode === "property" && isInvestment && propertyPanel === "unified" && (
        <table className="cft-table cft-table-wide cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th
                className="cft-group-cell cft-group-label cft-group-tax cft-group-clickable"
                colSpan={isGroupExpanded("gearing") ? 4 : 1}
                onClick={() => toggleGroup("gearing")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("gearing") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>gearing</span>
                </span>
              </th>
              <th className="cft-group-cell cft-group-divider" />
              <th
                className="cft-group-cell cft-group-label cft-group-net cft-group-clickable"
                colSpan={isGroupExpanded("propertyCashflow") ? 4 : 1}
                onClick={() => toggleGroup("propertyCashflow")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("propertyCashflow") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>cashflow</span>
                </span>
              </th>
            </tr>
            {(isGroupExpanded("gearing") || isGroupExpanded("propertyCashflow")) && (
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              {/* Gearing detail columns */}
              {isGroupExpanded("gearing") && <th className="cft-th cft-tip cft-detail-col" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("gearing") && <th className="cft-th cft-tip cft-detail-col" data-tip="Interest + Ongoing Costs">holding</th>}
              {isGroupExpanded("gearing") && <th className="cft-th cft-tip cft-detail-col" data-tip="Div 43 + Div 40 Depreciation">depr.</th>}
              <th className="cft-th cft-th-agg cft-tip" data-tip="Rent − Holding − Depreciation">net gearing</th>
              <th className="cft-th-divider" />
              {/* Cashflow detail columns */}
              {isGroupExpanded("propertyCashflow") && <th className="cft-th cft-tip cft-detail-col" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("propertyCashflow") && <th className="cft-th cft-tip cft-detail-col" data-tip="Holding + Repayments">costs</th>}
              {isGroupExpanded("propertyCashflow") && <th className="cft-th cft-tip cft-detail-col" data-tip="Tax Benefit">tax saved</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip="Rent − Costs + Tax Saved">cashflow</th>
            </tr>
            )}
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingCosts = y.interestPortion + y.ongoingCosts;
              const depreciation = y.depDiv43 + y.depDiv40;
              const netGearing = y.rentalIncome - holdingCosts - depreciation;
              const totalCosts = holdingCosts + y.principalPortion;
              const isCollapsed = !isGroupExpanded("gearing") && !isGroupExpanded("propertyCashflow");
              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "cft-row-summary-collapsed" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  {/* Gearing detail cells */}
                  {isGroupExpanded("gearing") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("gearing") && <td className={`cft-td cft-detail-cell ${getValueClass(-holdingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-holdingCosts))}</td>}
                  {isGroupExpanded("gearing") && <td className={`cft-td cft-detail-cell ${getValueClass(-depreciation, false, true)}`}>{formatCurrencyCf(Math.round(-depreciation))}</td>}
                  <td className={`cft-td ${isCollapsed ? "cft-td-summary-lg" : "cft-td-agg"} ${netGearing >= 0 ? "cft-val-positive" : "cft-val-negative"}`}>
                    <span className="cft-summary-value">{netGearing >= 0 ? "+" : ""}{formatCurrencyCf(Math.round(netGearing))}</span>
                    {isCollapsed && (() => {
                      const prevGearing = i > 0 ? (() => { const py = yearData[i-1]; return py.rentalIncome - (py.interestPortion + py.ongoingCosts) - (py.depDiv43 + py.depDiv40); })() : netGearing;
                      const gearYoY = yoyPct(netGearing, prevGearing);
                      return <span className={`cft-yoy-badge ${yoyClass(gearYoY)}`}>{fmtYoY(gearYoY)}</span>;
                    })()}
                  </td>
                  <td className="cft-td-divider" />
                  {/* Cashflow detail cells */}
                  {isGroupExpanded("propertyCashflow") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("propertyCashflow") && <td className={`cft-td cft-detail-cell ${getValueClass(-totalCosts, false, true)}`}>{formatCurrencyCf(Math.round(-totalCosts))}</td>}
                  {isGroupExpanded("propertyCashflow") && <td className="cft-td cft-detail-cell" style={{ color: "var(--cf-positive)" }}>{y.taxSaved > 0 ? "+" : ""}{formatCurrencyCf(Math.round(y.taxSaved))}</td>}
                  <td className={`cft-td ${isCollapsed ? "cft-td-result-lg" : "cft-td-result"} ${y.propertyCashflow >= 0 ? "cft-val-positive" : "cft-val-negative"}`}>
                    <span className="cft-summary-value">{y.propertyCashflow >= 0 ? "+" : ""}{formatCurrencyCf(Math.round(y.propertyCashflow))}</span>
                    {isCollapsed && (() => {
                      const prevCf = i > 0 ? yearData[i-1].propertyCashflow : y.propertyCashflow;
                      const cfYoY = yoyPct(y.propertyCashflow, prevCf);
                      return <span className={`cft-yoy-badge ${yoyClass(cfYoY)}`}>{fmtYoY(cfYoY)}</span>;
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — PPOR */}
      {viewMode === "property" && !isInvestment && (
        <table className="cft-table cft-table-mid">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th className="cft-group-cell cft-group-label cft-group-costs" colSpan={2}>costs</th>
              <th className="cft-group-divider" />
              <th className="cft-group-cell cft-group-label cft-group-costs" colSpan={2}>loan</th>
              <th className="cft-group-divider" />
              <th className="cft-group-cell cft-group-label cft-group-net" />
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              <th className="cft-th cft-tip" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>
              <th className="cft-th cft-tip" data-tip="Interest Portion of Loan Repayment">interest</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-tip" data-tip="Principal Portion of Loan Repayment">principal</th>
              <th className="cft-th cft-th-agg cft-tip" data-tip="Interest + Principal">repayments</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-th-result cft-tip" data-tip="Annual Property Cashflow">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  <td className={`cft-td ${getValueClass(-y.ongoingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-y.ongoingCosts))}</td>
                  <td className={`cft-td ${getValueClass(-y.interestPortion, false, true)}`}>{formatCurrencyCf(Math.round(-y.interestPortion))}</td>
                  <td className="cft-td-divider" />
                  <td className={`cft-td ${getValueClass(-y.principalPortion, false, true)}`}>{formatCurrencyCf(Math.round(-y.principalPortion))}</td>
                  <td className="cft-td cft-val-neutral">{formatCurrencyCf(Math.round(-(y.interestPortion + y.principalPortion)))}</td>
                  <td className="cft-td-divider" />
                  <td className={`cft-td cft-td-result ${getValueClass(y.propertyCashflow, true)}`}>
                    {formatCurrencyCf(Math.round(y.propertyCashflow))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* EQUITY — Property panel (collapsible columns) */}
      {viewMode === "equity" && equityPanel === "property" && (
        <table className="cft-table cft-table-mid cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th
                className="cft-group-cell cft-group-label cft-group-income cft-group-clickable"
                colSpan={isGroupExpanded("property") ? 7 : 1}
                onClick={() => toggleGroup("property")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("property") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>property</span>
                </span>
              </th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              {isGroupExpanded("property") && <th className="cft-th cft-tip cft-detail-col" data-tip="Cumulative Capital Growth From Purchase">total growth</th>}
              {isGroupExpanded("property") && <th className="cft-th cft-tip cft-detail-col" data-tip="Total Growth as % of Purchase Price">gain %</th>}
              {isGroupExpanded("property") && <th className="cft-th-divider cft-detail-col" />}
              {isGroupExpanded("property") && <th className="cft-th cft-tip cft-detail-col" data-tip="Year-on-Year Capital Growth">yoy growth</th>}
              {isGroupExpanded("property") && <th className="cft-th cft-tip cft-detail-col" data-tip="Year-on-Year Growth %">yoy %</th>}
              {isGroupExpanded("property") && <th className="cft-th-divider cft-detail-col" />}
              <th className="cft-th cft-th-result cft-tip" data-tip="Current Property Value">value</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const prevValue = i > 0 ? yearData[i - 1].propertyValue : propertyValue;
              const totalGrowth = y.propertyValue - propertyValue;
              const totalGrowthPct = growthPct(y.propertyValue, propertyValue).toFixed(1);
              const yoyGrowth = y.propertyValue - prevValue;
              const yoyGrowthPct = i > 0
                ? growthPct(y.propertyValue, prevValue).toFixed(1)
                : totalGrowthPct;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  {isGroupExpanded("property") && <td className="cft-td cft-val-dim cft-detail-cell">+{formatCurrencyCf(Math.round(totalGrowth))}</td>}
                  {isGroupExpanded("property") && <td className="cft-td cft-detail-cell" style={{ color: parseFloat(totalGrowthPct) === 0 ? "var(--cf-text-dim)" : parseFloat(totalGrowthPct) > 0 ? "var(--cf-positive)" : "var(--cf-negative)" }}>{totalGrowthPct}%</td>}
                  {isGroupExpanded("property") && <td className="cft-td-divider cft-detail-cell" />}
                  {isGroupExpanded("property") && <td className="cft-td cft-val-dim cft-detail-cell">+{formatCurrencyCf(Math.round(yoyGrowth))}</td>}
                  {isGroupExpanded("property") && <td className="cft-td cft-detail-cell" style={{ color: parseFloat(yoyGrowthPct) === 0 ? "var(--cf-text-dim)" : parseFloat(yoyGrowthPct) > 0 ? "var(--cf-positive)" : "var(--cf-negative)" }}>{yoyGrowthPct}%</td>}
                  {isGroupExpanded("property") && <td className="cft-td-divider cft-detail-cell" />}
                  <td className="cft-td cft-td-result" style={{ fontWeight: 700, color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(y.propertyValue))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* EQUITY — Position panel (collapsible columns) */}
      {viewMode === "equity" && equityPanel === "position" && (
        <table className="cft-table cft-table-mid cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th
                className="cft-group-cell cft-group-label cft-group-position cft-group-clickable"
                colSpan={isGroupExpanded("position") ? (showOffset ? 7 : 4) : 1}
                onClick={() => toggleGroup("position")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("position") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>position</span>
                </span>
              </th>
            </tr>
            <tr className="cft-header-row">
              {isGroupExpanded("position") && <th className="cft-th cft-tip cft-detail-col" data-tip="Current Property Value">prop value</th>}
              {isGroupExpanded("position") && <th className="cft-th cft-tip cft-detail-col" data-tip="Outstanding Loan Balance">loan balance</th>}
              {isGroupExpanded("position") && <th className="cft-th cft-tip cft-detail-col" data-tip="Loan-to-Value Ratio">lvr</th>}
              {isGroupExpanded("position") && showOffset && <th className="cft-th cft-th-agg cft-tip cft-detail-col" data-tip="Property Value − Loan Balance">prop equity</th>}
              {isGroupExpanded("position") && showOffset && <th className="cft-th-divider cft-detail-col" />}
              {isGroupExpanded("position") && showOffset && <th className="cft-th cft-tip cft-detail-col" data-tip="Offset Account Balance">offset</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip={showOffset ? "Property Equity + Offset Balance" : "Property Value − Loan Balance"}>net equity</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const lvr = safeDiv(y.loanBalance, y.propertyValue) * 100;
              const propertyEquity = y.propertyValue - y.loanBalance;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("position") && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.propertyValue))}</td>}
                  {isGroupExpanded("position") && <td className={`cft-td cft-detail-cell ${getValueClass(-y.loanBalance, false, true)}`}>{formatCurrencyCf(Math.round(-y.loanBalance))}</td>}
                  {isGroupExpanded("position") && <td className={`cft-td cft-detail-cell ${getLvrClass(lvr)}`}>{lvr.toFixed(1)}%</td>}
                  {isGroupExpanded("position") && showOffset && <td className="cft-td cft-detail-cell" style={{ fontWeight: 700, color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(propertyEquity))}</td>}
                  {isGroupExpanded("position") && showOffset && <td className="cft-td-divider cft-detail-cell" />}
                  {isGroupExpanded("position") && showOffset && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.offsetBalanceAtYear))}</td>}
                  <td className="cft-td cft-td-result" style={{ fontWeight: 700, color: "var(--cf-text)" }}>
                    {formatCurrencyCf(Math.round(y.netEquity))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* EQUITY — Unified (Property + Position in one table) */}
      {viewMode === "equity" && equityPanel === "unified" && (
        <table className="cft-table cft-table-wide cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th
                className="cft-group-cell cft-group-label cft-group-income cft-group-clickable"
                colSpan={isGroupExpanded("property") ? 7 : 1}
                onClick={() => toggleGroup("property")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("property") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>property</span>
                </span>
              </th>
              <th className="cft-group-cell cft-group-divider" />
              <th
                className="cft-group-cell cft-group-label cft-group-position cft-group-clickable"
                colSpan={isGroupExpanded("position") ? (showOffset ? 6 : 3) : 1}
                onClick={() => toggleGroup("position")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("position") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>position</span>
                </span>
              </th>
            </tr>
            {(isGroupExpanded("property") || isGroupExpanded("position")) && (
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              {/* Property detail columns */}
              {isGroupExpanded("property") && <th className="cft-th cft-tip cft-detail-col" data-tip="Cumulative Growth $">total $</th>}
              {isGroupExpanded("property") && <th className="cft-th cft-tip cft-detail-col" data-tip="Cumulative Growth %">total %</th>}
              {isGroupExpanded("property") && <th className="cft-th-divider cft-detail-col" />}
              {isGroupExpanded("property") && <th className="cft-th cft-tip cft-detail-col" data-tip="Year-on-Year Growth $">yoy $</th>}
              {isGroupExpanded("property") && <th className="cft-th cft-tip cft-detail-col" data-tip="Year-on-Year Growth %">yoy %</th>}
              {isGroupExpanded("property") && <th className="cft-th-divider cft-detail-col" />}
              <th className="cft-th cft-th-agg cft-tip" data-tip="Current Property Value">value</th>
              <th className="cft-th-divider" />
              {/* Position detail columns */}
              {isGroupExpanded("position") && <th className="cft-th cft-tip cft-detail-col" data-tip="Outstanding Loan Balance">loan</th>}
              {isGroupExpanded("position") && <th className="cft-th cft-tip cft-detail-col" data-tip="Loan-to-Value Ratio">lvr</th>}
              {isGroupExpanded("position") && showOffset && <th className="cft-th cft-tip cft-detail-col" data-tip="Property Equity">prop eq.</th>}
              {isGroupExpanded("position") && showOffset && <th className="cft-th-divider cft-detail-col" />}
              {isGroupExpanded("position") && showOffset && <th className="cft-th cft-tip cft-detail-col" data-tip="Offset Balance">offset</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip={showOffset ? "Property Equity + Offset" : "Property − Loan"}>net equity</th>
            </tr>
            )}
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const prevValue = i > 0 ? yearData[i - 1].propertyValue : propertyValue;
              const totalGrowth = y.propertyValue - propertyValue;
              const totalGrowthPct = growthPct(y.propertyValue, propertyValue).toFixed(1);
              const yoyGrowth = y.propertyValue - prevValue;
              const yoyGrowthPct = i > 0 ? growthPct(y.propertyValue, prevValue).toFixed(1) : totalGrowthPct;
              const lvr = safeDiv(y.loanBalance, y.propertyValue) * 100;
              const propertyEquity = y.propertyValue - y.loanBalance;
              const isCollapsed = !isGroupExpanded("property") && !isGroupExpanded("position");
              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "cft-row-summary-collapsed" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  {/* Property detail cells */}
                  {isGroupExpanded("property") && <td className="cft-td cft-val-dim cft-detail-cell">+{formatCurrencyCf(Math.round(totalGrowth))}</td>}
                  {isGroupExpanded("property") && <td className="cft-td cft-detail-cell" style={{ color: parseFloat(totalGrowthPct) === 0 ? "var(--cf-text-dim)" : parseFloat(totalGrowthPct) > 0 ? "var(--cf-positive)" : "var(--cf-negative)" }}>{totalGrowthPct}%</td>}
                  {isGroupExpanded("property") && <td className="cft-td-divider cft-detail-cell" />}
                  {isGroupExpanded("property") && <td className="cft-td cft-val-dim cft-detail-cell">+{formatCurrencyCf(Math.round(yoyGrowth))}</td>}
                  {isGroupExpanded("property") && <td className="cft-td cft-detail-cell" style={{ color: parseFloat(yoyGrowthPct) === 0 ? "var(--cf-text-dim)" : parseFloat(yoyGrowthPct) > 0 ? "var(--cf-positive)" : "var(--cf-negative)" }}>{yoyGrowthPct}%</td>}
                  {isGroupExpanded("property") && <td className="cft-td-divider cft-detail-cell" />}
                  <td className={`cft-td ${isCollapsed ? "cft-td-summary-lg" : "cft-td-agg"}`} style={{ fontWeight: 600, color: "var(--cf-text)" }}>
                    <span className="cft-summary-value">{formatCurrencyCf(Math.round(y.propertyValue))}</span>
                    {isCollapsed && (
                      <span className={`cft-yoy-badge ${yoyClass(parseFloat(yoyGrowthPct))}`}>{fmtYoY(parseFloat(yoyGrowthPct))}</span>
                    )}
                  </td>
                  <td className="cft-td-divider" />
                  {/* Position detail cells */}
                  {isGroupExpanded("position") && <td className={`cft-td cft-detail-cell ${getValueClass(-y.loanBalance, false, true)}`}>{formatCurrencyCf(Math.round(-y.loanBalance))}</td>}
                  {isGroupExpanded("position") && <td className={`cft-td cft-detail-cell ${getLvrClass(lvr)}`}>{lvr.toFixed(1)}%</td>}
                  {isGroupExpanded("position") && showOffset && <td className="cft-td cft-detail-cell" style={{ fontWeight: 600, color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(propertyEquity))}</td>}
                  {isGroupExpanded("position") && showOffset && <td className="cft-td-divider cft-detail-cell" />}
                  {isGroupExpanded("position") && showOffset && <td className="cft-td cft-val-dim cft-detail-cell">{formatCurrencyCf(Math.round(y.offsetBalanceAtYear))}</td>}
                  <td className={`cft-td ${isCollapsed ? "cft-td-result-lg" : "cft-td-result"}`} style={{ fontWeight: 700, color: "var(--cf-positive)" }}>
                    <span className="cft-summary-value">{formatCurrencyCf(Math.round(y.netEquity))}</span>
                    {isCollapsed && (() => {
                      const prevEquity = i > 0 ? yearData[i-1].netEquity : y.netEquity;
                      const eqYoY = yoyPct(y.netEquity, prevEquity);
                      return <span className={`cft-yoy-badge ${yoyClass(eqYoY)}`}>{fmtYoY(eqYoY)}</span>;
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* DEDUCTIONS — Holding costs panel (collapsible columns) */}
      {viewMode === "deductions" && deductionsPanel === "holding" && (
        <table className="cft-table cft-table-narrow cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th
                className="cft-group-cell cft-group-label cft-group-tax cft-group-clickable"
                colSpan={isGroupExpanded("holding") ? (isInvestment ? 5 : 4) : 1}
                onClick={() => toggleGroup("holding")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("holding") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>holding costs</span>
                </span>
              </th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              {isGroupExpanded("holding") && isInvestment && <th className="cft-th cft-tip cft-detail-col" data-tip="Loan Interest Paid">interest</th>}
              {isGroupExpanded("holding") && <th className="cft-th cft-tip cft-detail-col" data-tip="Council + Water Rates">rates</th>}
              {isGroupExpanded("holding") && <th className="cft-th cft-tip cft-detail-col" data-tip="Building & Landlord Insurance">insurance</th>}
              {isGroupExpanded("holding") && <th className="cft-th cft-tip cft-detail-col" data-tip="Maintenance & Repairs">maint.</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip="Holding Costs Subtotal">subtotal</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingTotal = isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  {isGroupExpanded("holding") && isInvestment && <td className="cft-td cft-val-outflow cft-detail-cell">{formatCurrencyCf(Math.round(y.interestPortion))}</td>}
                  {isGroupExpanded("holding") && <td className="cft-td cft-val-outflow cft-detail-cell">{formatCurrencyCf(Math.round(y.councilRates + y.waterRates))}</td>}
                  {isGroupExpanded("holding") && <td className="cft-td cft-val-outflow cft-detail-cell">{formatCurrencyCf(Math.round(y.insurance))}</td>}
                  {isGroupExpanded("holding") && <td className="cft-td cft-val-outflow cft-detail-cell">{formatCurrencyCf(Math.round(y.maintenance + y.strataFees))}</td>}
                  <td className="cft-td cft-td-result" style={{ fontWeight: 700, color: "var(--cf-negative)" }}>
                    {formatCurrencyCf(Math.round(holdingTotal))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* DEDUCTIONS — Depreciation panel (collapsible columns) */}
      {viewMode === "deductions" && deductionsPanel === "depreciation" && (
        <table className="cft-table cft-table-narrow cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th
                className="cft-group-cell cft-group-label cft-group-depreciation cft-group-clickable"
                colSpan={isGroupExpanded("depreciation") ? 3 : 1}
                onClick={() => toggleGroup("depreciation")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("depreciation") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>depreciation</span>
                </span>
              </th>
            </tr>
            <tr className="cft-header-row">
              {isGroupExpanded("depreciation") && <th className="cft-th cft-tip cft-detail-col" data-tip="Division 43 — Capital Works Deduction">div 43</th>}
              {isGroupExpanded("depreciation") && <th className="cft-th cft-tip cft-detail-col" data-tip="Division 40 — Plant & Equipment Depreciation">div 40</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip="Depreciation Subtotal">subtotal</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const depTotal = y.depDiv43 + y.depDiv40;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("depreciation") && <td className="cft-td cft-detail-cell" style={{ color: depColor, opacity: 0.7 }}>{formatCurrencyCf(Math.round(y.depDiv43))}</td>}
                  {isGroupExpanded("depreciation") && <td className="cft-td cft-detail-cell" style={{ color: depColor, opacity: 0.7 }}>{formatCurrencyCf(Math.round(y.depDiv40))}</td>}
                  <td className="cft-td cft-td-result" style={{ fontWeight: 700, color: depColor }}>
                    {formatCurrencyCf(Math.round(depTotal))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* DEDUCTIONS — Totals panel (collapsible columns) */}
      {viewMode === "deductions" && deductionsPanel === "totals" && (
        <table className="cft-table cft-table-narrow cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th
                className="cft-group-cell cft-group-label cft-group-net cft-group-clickable"
                colSpan={isGroupExpanded("totals") ? (isInvestment ? 3 : 2) : 1}
                onClick={() => toggleGroup("totals")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("totals") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>{isInvestment ? "deductions" : "expenses"}</span>
                </span>
              </th>
            </tr>
            <tr className="cft-header-row">
              {isGroupExpanded("totals") && <th className="cft-th cft-tip cft-detail-col" data-tip="Interest + Ongoing Costs">holding</th>}
              {isGroupExpanded("totals") && isInvestment && <th className="cft-th cft-tip cft-detail-col" data-tip="Div 43 + Div 40">depr.</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip={isInvestment ? "Total Deductions" : "Total Expenses"}>{isInvestment ? "total ded." : "total exp."}</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingTotal = isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts;
              const depTotal = y.depDiv43 + y.depDiv40;
              const grandTotal = isInvestment ? holdingTotal + depTotal : holdingTotal;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("totals") && <td className="cft-td cft-detail-cell" style={{ color: "var(--cf-negative)" }}>{formatCurrencyCf(Math.round(holdingTotal))}</td>}
                  {isGroupExpanded("totals") && isInvestment && <td className="cft-td cft-detail-cell" style={{ color: depColor }}>{formatCurrencyCf(Math.round(depTotal))}</td>}
                  <td className="cft-td cft-td-result" style={{ fontWeight: 700, color: isInvestment ? "#a78bfa" : "var(--cf-negative)" }}>
                    {formatCurrencyCf(Math.round(grandTotal))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* DEDUCTIONS — Unified (Holding + Depreciation + Totals in one table) */}
      {viewMode === "deductions" && deductionsPanel === "unified" && (
        <table className="cft-table cft-table-wide cft-collapsible-cols">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th
                className="cft-group-cell cft-group-label cft-group-tax cft-group-clickable"
                colSpan={isGroupExpanded("holding") ? (isInvestment ? 5 : 4) : 1}
                onClick={() => toggleGroup("holding")}
              >
                <span className="cft-group-header-chevron">
                  {isGroupExpanded("holding") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>holding costs</span>
                </span>
              </th>
              <th className="cft-group-cell cft-group-divider" />
              {isInvestment && (
                <th
                  className="cft-group-cell cft-group-label cft-group-depreciation cft-group-clickable"
                  colSpan={isGroupExpanded("depreciation") ? 3 : 1}
                  onClick={() => toggleGroup("depreciation")}
                >
                  <span className="cft-group-header-chevron">
                    {isGroupExpanded("depreciation") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span>depreciation</span>
                  </span>
                </th>
              )}
              {isInvestment && <th className="cft-group-cell cft-group-divider" />}
              <th className="cft-group-cell cft-group-label cft-group-net">{isInvestment ? "deductions" : "expenses"}</th>
            </tr>
            {(isGroupExpanded("holding") || isGroupExpanded("depreciation")) && (
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              {/* Holding detail columns */}
              {isGroupExpanded("holding") && isInvestment && <th className="cft-th cft-tip cft-detail-col" data-tip="Loan Interest Paid">interest</th>}
              {isGroupExpanded("holding") && <th className="cft-th cft-tip cft-detail-col" data-tip="Council + Water Rates">rates</th>}
              {isGroupExpanded("holding") && <th className="cft-th cft-tip cft-detail-col" data-tip="Building & Landlord Insurance">insurance</th>}
              {isGroupExpanded("holding") && <th className="cft-th cft-tip cft-detail-col" data-tip="Maintenance & Repairs">maint.</th>}
              <th className="cft-th cft-th-agg cft-tip" data-tip="Holding Costs Subtotal">subtotal</th>
              <th className="cft-th-divider" />
              {/* Depreciation detail columns (investment only) */}
              {isInvestment && isGroupExpanded("depreciation") && <th className="cft-th cft-tip cft-detail-col" data-tip="Division 43 — Capital Works">div 43</th>}
              {isInvestment && isGroupExpanded("depreciation") && <th className="cft-th cft-tip cft-detail-col" data-tip="Division 40 — Plant & Equipment">div 40</th>}
              {isInvestment && <th className="cft-th cft-th-agg cft-tip" data-tip="Depreciation Subtotal">subtotal</th>}
              {isInvestment && <th className="cft-th-divider" />}
              {/* Total */}
              <th className="cft-th cft-th-result cft-tip" data-tip={isInvestment ? "Total Deductions" : "Total Expenses"}>{isInvestment ? "total ded." : "total exp."}</th>
            </tr>
            )}
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingTotal = isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts;
              const depTotal = y.depDiv43 + y.depDiv40;
              const grandTotal = isInvestment ? holdingTotal + depTotal : holdingTotal;
              const isCollapsed = !isGroupExpanded("holding") && !isGroupExpanded("depreciation");
              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "cft-row-summary-collapsed" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  {/* Holding detail cells */}
                  {isGroupExpanded("holding") && isInvestment && <td className="cft-td cft-val-outflow cft-detail-cell">{formatCurrencyCf(Math.round(y.interestPortion))}</td>}
                  {isGroupExpanded("holding") && <td className="cft-td cft-val-outflow cft-detail-cell">{formatCurrencyCf(Math.round(y.councilRates + y.waterRates))}</td>}
                  {isGroupExpanded("holding") && <td className="cft-td cft-val-outflow cft-detail-cell">{formatCurrencyCf(Math.round(y.insurance))}</td>}
                  {isGroupExpanded("holding") && <td className="cft-td cft-val-outflow cft-detail-cell">{formatCurrencyCf(Math.round(y.maintenance))}</td>}
                  <td className={`cft-td ${isCollapsed ? "cft-td-summary-lg" : "cft-td-agg"}`} style={{ fontWeight: 600, color: "var(--cf-negative)" }}>
                    <span className="cft-summary-value">{formatCurrencyCf(Math.round(holdingTotal))}</span>
                    {isCollapsed && (() => {
                      const prevHolding = i > 0 ? (isInvestment ? yearData[i-1].interestPortion + yearData[i-1].ongoingCosts : yearData[i-1].ongoingCosts) : holdingTotal;
                      const holdYoY = yoyPct(holdingTotal, prevHolding);
                      return <span className={`cft-yoy-badge ${yoyClass(holdYoY, "negative")}`}>{fmtYoY(holdYoY)}</span>;
                    })()}
                  </td>
                  <td className="cft-td-divider" />
                  {/* Depreciation detail cells (investment only) */}
                  {isInvestment && isGroupExpanded("depreciation") && <td className="cft-td cft-detail-cell" style={{ color: depColor, opacity: 0.7 }}>{formatCurrencyCf(Math.round(y.depDiv43))}</td>}
                  {isInvestment && isGroupExpanded("depreciation") && <td className="cft-td cft-detail-cell" style={{ color: depColor, opacity: 0.7 }}>{formatCurrencyCf(Math.round(y.depDiv40))}</td>}
                  {isInvestment && <td className={`cft-td ${isCollapsed ? "cft-td-summary-lg" : "cft-td-agg"}`} style={{ fontWeight: 600, color: depColor }}>
                    <span className="cft-summary-value">{formatCurrencyCf(Math.round(depTotal))}</span>
                    {isCollapsed && (() => {
                      const prevDep = i > 0 ? yearData[i-1].depDiv43 + yearData[i-1].depDiv40 : depTotal;
                      const depYoY = yoyPct(depTotal, prevDep);
                      return <span className={`cft-yoy-badge ${yoyClass(depYoY, "negative")}`}>{fmtYoY(depYoY)}</span>;
                    })()}
                  </td>}
                  {isInvestment && <td className="cft-td-divider" />}
                  {/* Total */}
                  <td className={`cft-td ${isCollapsed ? "cft-td-result-lg" : "cft-td-result"}`} style={{ fontWeight: 700, color: isInvestment ? "#a78bfa" : "var(--cf-negative)" }}>
                    <span className="cft-summary-value">{formatCurrencyCf(Math.round(grandTotal))}</span>
                    {isCollapsed && (() => {
                      const prevGrand = i > 0 ? (() => { const py = yearData[i-1]; const ph = isInvestment ? py.interestPortion + py.ongoingCosts : py.ongoingCosts; const pd = py.depDiv43 + py.depDiv40; return isInvestment ? ph + pd : ph; })() : grandTotal;
                      const grandYoY = yoyPct(grandTotal, prevGrand);
                      return <span className={`cft-yoy-badge ${yoyClass(grandYoY, "negative")}`}>{fmtYoY(grandYoY)}</span>;
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
    </div>
  );
}
