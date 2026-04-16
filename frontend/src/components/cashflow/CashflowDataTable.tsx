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
  value === 0 ? "bg-white/10 text-faint"
    : positiveWhen === "positive"
      ? (value > 0 ? "bg-accent/10 text-positive" : "bg-red-400/10 text-negative")
      : (value < 0 ? "bg-accent/10 text-positive" : "bg-red-400/10 text-negative");

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
      <span className="whitespace-nowrap inline-flex items-center gap-2.5">
        {showChevron && (
          <span className="inline-flex items-center justify-center mr-1.5 text-white/25 transition-[transform,color] duration-150">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}
        <span className={`inline-flex items-center text-[13px] font-semibold text-accent transition-all duration-150 ease-in-out whitespace-nowrap ${isSelected ? "opacity-100" : isHovered ? "opacity-80" : ""}`} style={{ color: isMilestoneRow ? "var(--color-accent)" : "rgba(255, 255, 255, 0.75)" }}>
          Year {year}
        </span>
      </span>
    );
  };

  // Determine value styling tier: result (teal), outflow (muted red), or neutral
  const getValueClass = (value: number, isResult = false, isOutflow = false, isTaxSaved = false) => {
    if (isResult) return value < 0 ? "text-negative font-bold" : "text-accent font-bold";
    if (isTaxSaved && value > 0) return "text-accent font-bold";
    if (isOutflow) return "text-red-400/65";
    return "text-[#f0fdfa]";
  };

  // LVR conditional styling
  const getLvrClass = (lvr: number) => {
    if (lvr > 80) return "text-red-400";
    if (lvr > 60) return "text-amber-400";
    return "text-emerald-400";
  };

  // Row class helper for selected/hovered states
  const isSecondPanel = propertyPanel === "cashflow" || equityPanel === "position";

  const getRowClass = (year: number, isMilestoneRow = false) => {
    const isSelected = year === selectedYear;
    const isHovered = year === hoveredYear && !isSelected;
    const isExpandable = isMilestoneRow;
    const isChildRow = !isMilestoneRow && !isMilestoneYear(year);
    return `h-[52px] transition-[background] duration-100 ease-in-out cursor-pointer hover:bg-white/[0.018] ${isSelected ? "bg-accent/[0.045] hover:bg-accent/[0.045]" : ""} ${isHovered ? "bg-accent/[0.015]" : ""} ${isExpandable ? "cursor-pointer" : ""} ${isMilestoneRow ? "[&_td]:relative [&_td]:after:content-[''] [&_td]:after:absolute [&_td]:after:left-0 [&_td]:after:right-0 [&_td]:after:bottom-[-1px] [&_td]:after:h-2 [&_td]:after:bg-gradient-to-b [&_td]:after:from-black/[0.12] [&_td]:after:to-transparent [&_td]:after:pointer-events-none" : ""} ${isChildRow ? "bg-black/[0.02]" : ""}`;
  };

  return (
    <div className="relative w-full">
      {showExpandButton && (
        <button
          className="absolute top-1.5 left-2 z-[2] flex items-center justify-center w-[22px] h-[22px] border-none rounded bg-transparent text-white/[0.22] cursor-pointer transition-[color,background] duration-150 hover:bg-accent/[0.08] hover:text-accent"
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
    <div className="bg-transparent border-none rounded-none">
      {/* SUMMARY — Income panel (collapsible columns) */}
      {viewMode === "summary" && summaryPanel === "income" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("income") ? (isInvestment ? 5 : 3) : 1}
                onClick={() => toggleGroup("income")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("income") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>income</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {isGroupExpanded("income") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Salary (grows with capital growth rate)">salary</th>}
              {isGroupExpanded("income") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Salary Growth">gain %</th>}
              {isGroupExpanded("income") && isInvestment && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income (grows with capital growth rate)">rent</th>}
              {isGroupExpanded("income") && isInvestment && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Rent Growth">gain %</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Salary + Rent">total income</th>
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
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("income") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.salary))}</td>}
                  {isGroupExpanded("income") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(salaryGain) > 0 ? "var(--color-positive)" : "var(--color-faint)" }}>{salaryGain}%</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(rentGain) > 0 ? "var(--color-positive)" : "var(--color-faint)" }}>{rentGain}%</td>}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-white/[0.35] cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("outgoings") ? 4 : 1}
                onClick={() => toggleGroup("outgoings")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("outgoings") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>outgoings</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              {isGroupExpanded("outgoings") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>}
              {isGroupExpanded("outgoings") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Interest + Principal">repayments</th>}
              {isGroupExpanded("outgoings") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Income Tax (incl. Medicare Levy)">tax</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Holding + Repayments + Tax">total costs</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const totalCosts = y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("outgoings") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.ongoingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-y.ongoingCosts))}</td>}
                  {isGroupExpanded("outgoings") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.loanRepayment, false, true)}`}>{formatCurrencyCf(Math.round(-y.loanRepayment))}</td>}
                  {isGroupExpanded("outgoings") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.incomeTaxCalc, false, true)}`}>{formatCurrencyCf(Math.round(-y.incomeTaxCalc))}</td>}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-negative)" }}>
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65" colSpan={3}>cashflow</th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Salary + Rent">total income</th>
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Holding + Repayments + Tax">total costs</th>
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Total Income − Total Costs">cashflow</th>
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
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2]">{formatCurrencyCf(Math.round(totalIncome))}</td>
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${getValueClass(-totalCosts, false, true)}`}>{formatCurrencyCf(Math.round(-totalCosts))}</td>
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm ${annualCashflow >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("income") ? (isInvestment ? 5 : 3) : 1}
                onClick={() => toggleGroup("income")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("income") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>income</span>
                </span>
              </th>
              <th className="h-7 box-border px-3 text-center align-bottom w-px !p-0 bg-white/[0.1]" />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-white/[0.35] cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("outgoings") ? 4 : 1}
                onClick={() => toggleGroup("outgoings")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("outgoings") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>outgoings</span>
                </span>
              </th>
              <th className="h-7 box-border px-3 text-center align-bottom w-px !p-0 bg-white/[0.1]" />
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65">cashflow</th>
            </tr>
            {(isGroupExpanded("income") || isGroupExpanded("outgoings")) && (
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Income detail columns */}
              {isGroupExpanded("income") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Salary">salary</th>}
              {isGroupExpanded("income") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Salary Growth">gain %</th>}
              {isGroupExpanded("income") && isInvestment && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("income") && isInvestment && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Rent Growth">gain %</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Salary + Rent">total</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Outgoings detail columns */}
              {isGroupExpanded("outgoings") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>}
              {isGroupExpanded("outgoings") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Interest + Principal">repay</th>}
              {isGroupExpanded("outgoings") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Income Tax (incl. Medicare Levy)">tax</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Holding + Repayments + Tax">total</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Cashflow result */}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Total Income − Total Costs">net</th>
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
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Income detail cells */}
                  {isGroupExpanded("income") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.salary))}</td>}
                  {isGroupExpanded("income") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(salaryGain) > 0 ? "var(--color-positive)" : "var(--color-faint)" }}>{salaryGain}%</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(rentGain) > 0 ? "var(--color-positive)" : "var(--color-faint)" }}>{rentGain}%</td>}
                  {/* Income total - larger when collapsed, with YoY indicator */}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "px-4" : ""}`}>
                    <span className="font-semibold" style={{ color: "var(--color-foreground)" }}>{formatCurrencyCf(Math.round(totalIncome))}</span>
                    {isCollapsed && (
                      <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(incomeYoY)}`}>{fmtYoY(incomeYoY)}</span>
                    )}
                  </td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Outgoings detail cells */}
                  {isGroupExpanded("outgoings") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.ongoingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-y.ongoingCosts))}</td>}
                  {isGroupExpanded("outgoings") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.loanRepayment, false, true)}`}>{formatCurrencyCf(Math.round(-y.loanRepayment))}</td>}
                  {isGroupExpanded("outgoings") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.incomeTaxCalc, false, true)}`}>{formatCurrencyCf(Math.round(-y.incomeTaxCalc))}</td>}
                  {/* Outgoings total - larger when collapsed, with YoY indicator */}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "px-4" : ""}`}>
                    <span className="font-semibold" style={{ color: "var(--color-negative)" }}>{formatCurrencyCf(Math.round(-totalCosts))}</span>
                    {isCollapsed && (
                      <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(costsYoY, "negative")}`}>{fmtYoY(costsYoY)}</span>
                    )}
                  </td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Cashflow result */}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "pr-5 text-base font-bold tracking-tight" : "pr-5 text-sm"} ${annualCashflow >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>
                    <span className="font-semibold">{annualCashflow >= 0 ? "+" : ""}{formatCurrencyCf(Math.round(annualCashflow))}</span>
                    {isCollapsed && (() => {
                      const prevCashflow = i > 0 ? (prevIncome - prevCosts) : annualCashflow;
                      const cashflowYoY = yoyPct(annualCashflow, prevCashflow);
                      return (
                        <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(cashflowYoY)}`}>{fmtYoY(cashflowYoY)}</span>
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-amber-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("deductions") ? 4 : 1}
                onClick={() => toggleGroup("deductions")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("deductions") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>deductions</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {isGroupExpanded("deductions") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>}
              {isGroupExpanded("deductions") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Loan Interest Paid">interest</th>}
              {isGroupExpanded("deductions") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Div 43 + Div 40 Depreciation">depr.</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Total Deductible Expenses">total ded.</th>
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
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("deductions") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.ongoingCosts))}</td>}
                  {isGroupExpanded("deductions") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.interestPortion))}</td>}
                  {isGroupExpanded("deductions") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(depreciation))}</td>}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("tax") ? 6 : 1}
                onClick={() => toggleGroup("tax")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("tax") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>tax</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              {isGroupExpanded("tax") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Salary + Rental Income">total income</th>}
              {isGroupExpanded("tax") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Total Deductible Expenses">deductions</th>}
              {isGroupExpanded("tax") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Tax Saved From Property Deductions">benefit</th>}
              {isGroupExpanded("tax") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Income After Deductions">taxable inc.</th>}
              {isGroupExpanded("tax") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Marginal Tax Rate Band">bracket</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Income Tax (incl. Medicare Levy)">total tax</th>
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
                  {isGroupExpanded("tax") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(totalIncome))}</td>}
                  {isGroupExpanded("tax") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-totalDeductions, false, true)}`}>{formatCurrencyCf(Math.round(-totalDeductions))}</td>}
                  {isGroupExpanded("tax") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: "var(--color-positive)" }}>
                    {y.taxSaved > 0 ? `(+${formatCurrencyCf(Math.round(y.taxSaved))})` : "—"}
                  </td>}
                  {isGroupExpanded("tax") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(taxableIncome))}</td>}
                  {isGroupExpanded("tax") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{(bracket * 100).toFixed(bracket % 0.01 === 0 ? 0 : 1)}%</td>}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-negative)" }}>
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-amber-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("deductions") ? 4 : 1}
                onClick={() => toggleGroup("deductions")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("deductions") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>deductions</span>
                </span>
              </th>
              <th className="h-7 box-border px-3 text-center align-bottom w-px !p-0 bg-white/[0.1]" />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("tax") ? 6 : 1}
                onClick={() => toggleGroup("tax")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("tax") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>tax</span>
                </span>
              </th>
            </tr>
            {(isGroupExpanded("deductions") || isGroupExpanded("tax")) && (
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Deductions detail columns */}
              {isGroupExpanded("deductions") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Ongoing Holding Costs">holding</th>}
              {isGroupExpanded("deductions") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Loan Interest Paid">interest</th>}
              {isGroupExpanded("deductions") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Div 43 + Div 40">depr.</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Total Deductible Expenses">total ded.</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Tax detail columns */}
              {isGroupExpanded("tax") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Salary + Rent">income</th>}
              {isGroupExpanded("tax") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Total Deductions">ded.</th>}
              {isGroupExpanded("tax") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Tax Benefit From Deductions">benefit</th>}
              {isGroupExpanded("tax") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Income After Deductions">taxable</th>}
              {isGroupExpanded("tax") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Marginal Tax Rate">bracket</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Income Tax (incl. Medicare Levy)">total tax</th>
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
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Deductions detail cells */}
                  {isGroupExpanded("deductions") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.ongoingCosts))}</td>}
                  {isGroupExpanded("deductions") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.interestPortion))}</td>}
                  {isGroupExpanded("deductions") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(depreciation))}</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "px-4" : ""}`} style={{ fontWeight: 600, color: "var(--color-foreground)" }}>
                    <span className="font-semibold">{formatCurrencyCf(Math.round(totalDeductions))}</span>
                    {isCollapsed && (() => {
                      const prevDed = i > 0 ? (() => { const py = yearData[i-1]; return py.ongoingCosts + py.interestPortion + py.depDiv43 + py.depDiv40; })() : totalDeductions;
                      const dedYoY = yoyPct(totalDeductions, prevDed);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(dedYoY, "negative")}`}>{fmtYoY(dedYoY)}</span>;
                    })()}
                  </td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Tax detail cells */}
                  {isGroupExpanded("tax") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(totalIncome))}</td>}
                  {isGroupExpanded("tax") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-totalDeductions, false, true)}`}>{formatCurrencyCf(Math.round(-totalDeductions))}</td>}
                  {isGroupExpanded("tax") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: "var(--color-positive)" }}>
                    {y.taxSaved > 0 ? `+${formatCurrencyCf(Math.round(y.taxSaved))}` : "—"}
                  </td>}
                  {isGroupExpanded("tax") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(taxableIncome))}</td>}
                  {isGroupExpanded("tax") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{(bracket * 100).toFixed(bracket % 0.01 === 0 ? 0 : 1)}%</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "pr-5 text-base font-bold tracking-tight" : "pr-5 text-sm"}`} style={{ fontWeight: 700, color: "var(--color-negative)" }}>
                    <span className="font-semibold">{formatCurrencyCf(Math.round(-y.incomeTaxCalc))}</span>
                    {isCollapsed && (() => {
                      const prevTax = i > 0 ? yearData[i-1].incomeTaxCalc : y.incomeTaxCalc;
                      const taxYoY = yoyPct(y.incomeTaxCalc, prevTax);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(taxYoY, "negative")}`}>{fmtYoY(taxYoY)}</span>;
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-amber-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("gearing") ? 4 : 1}
                onClick={() => toggleGroup("gearing")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("gearing") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>gearing</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {isGroupExpanded("gearing") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("gearing") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Interest + Ongoing Costs">holding</th>}
              {isGroupExpanded("gearing") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Div 43 + Div 40 Depreciation">depreciation</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Rent − Holding − Depreciation (negative = negatively geared)">net gearing</th>
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
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("gearing") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("gearing") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-holdingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-holdingCosts))}</td>}
                  {isGroupExpanded("gearing") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-depreciation, false, true)}`}>{formatCurrencyCf(Math.round(-depreciation))}</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm ${netGearing >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>{formatCurrencyCf(Math.round(netGearing))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — Cashflow panel (collapsible columns) */}
      {viewMode === "property" && isInvestment && propertyPanel === "cashflow" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("propertyCashflow") ? 4 : 1}
                onClick={() => toggleGroup("propertyCashflow")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("propertyCashflow") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>cashflow</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              {isGroupExpanded("propertyCashflow") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("propertyCashflow") && <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Holding + Repayments">total costs</th>}
              {isGroupExpanded("propertyCashflow") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Tax Benefit From Property Deductions">tax saved</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Rent − Total Costs + Tax Saved">cashflow</th>
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
                  {isGroupExpanded("propertyCashflow") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("propertyCashflow") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-totalCosts, false, true)}`}>{formatCurrencyCf(Math.round(-totalCosts))}</td>}
                  {isGroupExpanded("propertyCashflow") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: "var(--color-positive)" }}>{y.taxSaved > 0 ? "+" : ""}{formatCurrencyCf(Math.round(y.taxSaved))}</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm ${y.propertyCashflow >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-amber-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("gearing") ? 4 : 1}
                onClick={() => toggleGroup("gearing")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("gearing") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>gearing</span>
                </span>
              </th>
              <th className="h-7 box-border px-3 text-center align-bottom w-px !p-0 bg-white/[0.1]" />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("propertyCashflow") ? 4 : 1}
                onClick={() => toggleGroup("propertyCashflow")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("propertyCashflow") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>cashflow</span>
                </span>
              </th>
            </tr>
            {(isGroupExpanded("gearing") || isGroupExpanded("propertyCashflow")) && (
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Gearing detail columns */}
              {isGroupExpanded("gearing") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("gearing") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Interest + Ongoing Costs">holding</th>}
              {isGroupExpanded("gearing") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Div 43 + Div 40 Depreciation">depr.</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Rent − Holding − Depreciation">net gearing</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Cashflow detail columns */}
              {isGroupExpanded("propertyCashflow") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("propertyCashflow") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Holding + Repayments">costs</th>}
              {isGroupExpanded("propertyCashflow") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Tax Benefit">tax saved</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Rent − Costs + Tax Saved">cashflow</th>
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
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Gearing detail cells */}
                  {isGroupExpanded("gearing") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("gearing") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-holdingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-holdingCosts))}</td>}
                  {isGroupExpanded("gearing") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-depreciation, false, true)}`}>{formatCurrencyCf(Math.round(-depreciation))}</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "px-4" : ""} ${netGearing >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>
                    <span className="font-semibold">{netGearing >= 0 ? "+" : ""}{formatCurrencyCf(Math.round(netGearing))}</span>
                    {isCollapsed && (() => {
                      const prevGearing = i > 0 ? (() => { const py = yearData[i-1]; return py.rentalIncome - (py.interestPortion + py.ongoingCosts) - (py.depDiv43 + py.depDiv40); })() : netGearing;
                      const gearYoY = yoyPct(netGearing, prevGearing);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(gearYoY)}`}>{fmtYoY(gearYoY)}</span>;
                    })()}
                  </td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Cashflow detail cells */}
                  {isGroupExpanded("propertyCashflow") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("propertyCashflow") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-totalCosts, false, true)}`}>{formatCurrencyCf(Math.round(-totalCosts))}</td>}
                  {isGroupExpanded("propertyCashflow") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: "var(--color-positive)" }}>{y.taxSaved > 0 ? "+" : ""}{formatCurrencyCf(Math.round(y.taxSaved))}</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "pr-5 text-base font-bold tracking-tight" : "pr-5 text-sm"} ${y.propertyCashflow >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>
                    <span className="font-semibold">{y.propertyCashflow >= 0 ? "+" : ""}{formatCurrencyCf(Math.round(y.propertyCashflow))}</span>
                    {isCollapsed && (() => {
                      const prevCf = i > 0 ? yearData[i-1].propertyCashflow : y.propertyCashflow;
                      const cfYoY = yoyPct(y.propertyCashflow, prevCf);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(cfYoY)}`}>{fmtYoY(cfYoY)}</span>;
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-white/[0.35]" colSpan={2}>costs</th>
              <th className="w-0 max-w-0 p-0 bg-transparent relative border-l border-white/[0.1]" />
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-white/[0.35]" colSpan={2}>loan</th>
              <th className="w-0 max-w-0 p-0 bg-transparent relative border-l border-white/[0.1]" />
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65" />
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Interest Portion of Loan Repayment">interest</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Principal Portion of Loan Repayment">principal</th>
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Interest + Principal">repayments</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Annual Property Cashflow">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${getValueClass(-y.ongoingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-y.ongoingCosts))}</td>
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${getValueClass(-y.interestPortion, false, true)}`}>{formatCurrencyCf(Math.round(-y.interestPortion))}</td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${getValueClass(-y.principalPortion, false, true)}`}>{formatCurrencyCf(Math.round(-y.principalPortion))}</td>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#f0fdfa]">{formatCurrencyCf(Math.round(-(y.interestPortion + y.principalPortion)))}</td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm ${getValueClass(y.propertyCashflow, true)}`}>
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("property") ? 7 : 1}
                onClick={() => toggleGroup("property")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("property") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>property value</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Cumulative Capital Growth From Purchase">total growth</th>}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Total Growth as % of Purchase Price">gain %</th>}
              {isGroupExpanded("property") && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Capital Growth">yoy growth</th>}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Growth %">yoy %</th>}
              {isGroupExpanded("property") && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Current Property Value">value</th>
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
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">+{formatCurrencyCf(Math.round(totalGrowth))}</td>}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(totalGrowthPct) === 0 ? "var(--color-faint)" : parseFloat(totalGrowthPct) > 0 ? "var(--color-positive)" : "var(--color-negative)" }}>{totalGrowthPct}%</td>}
                  {isGroupExpanded("property") && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">+{formatCurrencyCf(Math.round(yoyGrowth))}</td>}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(yoyGrowthPct) === 0 ? "var(--color-faint)" : parseFloat(yoyGrowthPct) > 0 ? "var(--color-positive)" : "var(--color-negative)" }}>{yoyGrowthPct}%</td>}
                  {isGroupExpanded("property") && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-foreground)" }}>{formatCurrencyCf(Math.round(y.propertyValue))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* EQUITY — Position panel (collapsible columns) */}
      {viewMode === "equity" && equityPanel === "position" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-blue-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("position") ? (showOffset ? 7 : 4) : 1}
                onClick={() => toggleGroup("position")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("position") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>net equity</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              {isGroupExpanded("position") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Current Property Value">prop value</th>}
              {isGroupExpanded("position") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Outstanding Loan Balance">loan balance</th>}
              {isGroupExpanded("position") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Loan-to-Value Ratio">lvr</th>}
              {isGroupExpanded("position") && showOffset && <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Property Value − Loan Balance">prop equity</th>}
              {isGroupExpanded("position") && showOffset && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
              {isGroupExpanded("position") && showOffset && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Offset Account Balance">offset</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip={showOffset ? "Property Equity + Offset Balance" : "Property Value − Loan Balance"}>net equity</th>
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
                  {isGroupExpanded("position") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.propertyValue))}</td>}
                  {isGroupExpanded("position") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.loanBalance, false, true)}`}>{formatCurrencyCf(Math.round(-y.loanBalance))}</td>}
                  {isGroupExpanded("position") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getLvrClass(lvr)}`}>{lvr.toFixed(1)}%</td>}
                  {isGroupExpanded("position") && showOffset && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ fontWeight: 700, color: "var(--color-foreground)" }}>{formatCurrencyCf(Math.round(propertyEquity))}</td>}
                  {isGroupExpanded("position") && showOffset && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
                  {isGroupExpanded("position") && showOffset && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.offsetBalanceAtYear))}</td>}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("property") ? 7 : 1}
                onClick={() => toggleGroup("property")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("property") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>property value</span>
                </span>
              </th>
              <th className="h-7 box-border px-3 text-center align-bottom w-px !p-0 bg-white/[0.1]" />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-blue-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("position") ? (showOffset ? 6 : 3) : 1}
                onClick={() => toggleGroup("position")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("position") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>net equity</span>
                </span>
              </th>
            </tr>
            {(isGroupExpanded("property") || isGroupExpanded("position")) && (
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Property detail columns */}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Cumulative Growth $">total $</th>}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Cumulative Growth %">total %</th>}
              {isGroupExpanded("property") && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Growth $">yoy $</th>}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Growth %">yoy %</th>}
              {isGroupExpanded("property") && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Current Property Value">value</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Position detail columns */}
              {isGroupExpanded("position") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Outstanding Loan Balance">loan</th>}
              {isGroupExpanded("position") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Loan-to-Value Ratio">lvr</th>}
              {isGroupExpanded("position") && showOffset && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Property Equity">prop eq.</th>}
              {isGroupExpanded("position") && showOffset && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
              {isGroupExpanded("position") && showOffset && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Offset Balance">offset</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip={showOffset ? "Property Equity + Offset" : "Property − Loan"}>net equity</th>
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
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Property detail cells */}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">+{formatCurrencyCf(Math.round(totalGrowth))}</td>}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(totalGrowthPct) === 0 ? "var(--color-faint)" : parseFloat(totalGrowthPct) > 0 ? "var(--color-positive)" : "var(--color-negative)" }}>{totalGrowthPct}%</td>}
                  {isGroupExpanded("property") && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">+{formatCurrencyCf(Math.round(yoyGrowth))}</td>}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(yoyGrowthPct) === 0 ? "var(--color-faint)" : parseFloat(yoyGrowthPct) > 0 ? "var(--color-positive)" : "var(--color-negative)" }}>{yoyGrowthPct}%</td>}
                  {isGroupExpanded("property") && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "px-4" : ""}`} style={{ fontWeight: 600, color: "var(--color-foreground)" }}>
                    <span className="font-semibold">{formatCurrencyCf(Math.round(y.propertyValue))}</span>
                    {isCollapsed && (
                      <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(parseFloat(yoyGrowthPct))}`}>{fmtYoY(parseFloat(yoyGrowthPct))}</span>
                    )}
                  </td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Position detail cells */}
                  {isGroupExpanded("position") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.loanBalance, false, true)}`}>{formatCurrencyCf(Math.round(-y.loanBalance))}</td>}
                  {isGroupExpanded("position") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getLvrClass(lvr)}`}>{lvr.toFixed(1)}%</td>}
                  {isGroupExpanded("position") && showOffset && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ fontWeight: 600, color: "var(--color-foreground)" }}>{formatCurrencyCf(Math.round(propertyEquity))}</td>}
                  {isGroupExpanded("position") && showOffset && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
                  {isGroupExpanded("position") && showOffset && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.offsetBalanceAtYear))}</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "pr-5 text-base font-bold tracking-tight" : "pr-5 text-sm"}`} style={{ fontWeight: 700, color: "var(--color-positive)" }}>
                    <span className="font-semibold">{formatCurrencyCf(Math.round(y.netEquity))}</span>
                    {isCollapsed && (() => {
                      const prevEquity = i > 0 ? yearData[i-1].netEquity : y.netEquity;
                      const eqYoY = yoyPct(y.netEquity, prevEquity);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(eqYoY)}`}>{fmtYoY(eqYoY)}</span>;
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-amber-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("holding") ? (isInvestment ? 5 : 4) : 1}
                onClick={() => toggleGroup("holding")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("holding") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>holding costs</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {isGroupExpanded("holding") && isInvestment && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Loan Interest Paid">interest</th>}
              {isGroupExpanded("holding") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Council + Water Rates">rates</th>}
              {isGroupExpanded("holding") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Building & Landlord Insurance">insurance</th>}
              {isGroupExpanded("holding") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Maintenance & Repairs">maint.</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Holding Costs Subtotal">subtotal</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingTotal = isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("holding") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-red-400/65 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.interestPortion))}</td>}
                  {isGroupExpanded("holding") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-red-400/65 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.councilRates + y.waterRates))}</td>}
                  {isGroupExpanded("holding") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-red-400/65 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.insurance))}</td>}
                  {isGroupExpanded("holding") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-red-400/65 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.maintenance + y.strataFees))}</td>}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-negative)" }}>
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-violet-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("depreciation") ? 3 : 1}
                onClick={() => toggleGroup("depreciation")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("depreciation") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>depreciation</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              {isGroupExpanded("depreciation") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Division 43 — Capital Works Deduction">div 43</th>}
              {isGroupExpanded("depreciation") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Division 40 — Plant & Equipment Depreciation">div 40</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Depreciation Subtotal">subtotal</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const depTotal = y.depDiv43 + y.depDiv40;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("depreciation") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: depColor, opacity: 0.7 }}>{formatCurrencyCf(Math.round(y.depDiv43))}</td>}
                  {isGroupExpanded("depreciation") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: depColor, opacity: 0.7 }}>{formatCurrencyCf(Math.round(y.depDiv40))}</td>}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: depColor }}>
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("totals") ? (isInvestment ? 3 : 2) : 1}
                onClick={() => toggleGroup("totals")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("totals") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>{isInvestment ? "deductions" : "expenses"}</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              {isGroupExpanded("totals") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Interest + Ongoing Costs">holding</th>}
              {isGroupExpanded("totals") && isInvestment && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Div 43 + Div 40">depr.</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip={isInvestment ? "Total Deductions" : "Total Expenses"}>{isInvestment ? "total ded." : "total exp."}</th>
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
                  {isGroupExpanded("totals") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: "var(--color-negative)" }}>{formatCurrencyCf(Math.round(holdingTotal))}</td>}
                  {isGroupExpanded("totals") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: depColor }}>{formatCurrencyCf(Math.round(depTotal))}</td>}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: isInvestment ? "#a78bfa" : "var(--color-negative)" }}>
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
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-amber-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("holding") ? (isInvestment ? 5 : 4) : 1}
                onClick={() => toggleGroup("holding")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("holding") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>holding costs</span>
                </span>
              </th>
              <th className="h-7 box-border px-3 text-center align-bottom w-px !p-0 bg-white/[0.1]" />
              {isInvestment && (
                <th
                  className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-violet-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                  colSpan={isGroupExpanded("depreciation") ? 3 : 1}
                  onClick={() => toggleGroup("depreciation")}
                >
                  <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                    {isGroupExpanded("depreciation") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span>depreciation</span>
                  </span>
                </th>
              )}
              {isInvestment && <th className="h-7 box-border px-3 text-center align-bottom w-px !p-0 bg-white/[0.1]" />}
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65">{isInvestment ? "deductions" : "expenses"}</th>
            </tr>
            {(isGroupExpanded("holding") || isGroupExpanded("depreciation")) && (
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Holding detail columns */}
              {isGroupExpanded("holding") && isInvestment && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Loan Interest Paid">interest</th>}
              {isGroupExpanded("holding") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Council + Water Rates">rates</th>}
              {isGroupExpanded("holding") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Building & Landlord Insurance">insurance</th>}
              {isGroupExpanded("holding") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Maintenance & Repairs">maint.</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Holding Costs Subtotal">subtotal</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Depreciation detail columns (investment only) */}
              {isInvestment && isGroupExpanded("depreciation") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Division 43 — Capital Works">div 43</th>}
              {isInvestment && isGroupExpanded("depreciation") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Division 40 — Plant & Equipment">div 40</th>}
              {isInvestment && <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Depreciation Subtotal">subtotal</th>}
              {isInvestment && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />}
              {/* Total */}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip={isInvestment ? "Total Deductions" : "Total Expenses"}>{isInvestment ? "total ded." : "total exp."}</th>
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
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Holding detail cells */}
                  {isGroupExpanded("holding") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-red-400/65 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.interestPortion))}</td>}
                  {isGroupExpanded("holding") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-red-400/65 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.councilRates + y.waterRates))}</td>}
                  {isGroupExpanded("holding") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-red-400/65 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.insurance))}</td>}
                  {isGroupExpanded("holding") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-red-400/65 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatCurrencyCf(Math.round(y.maintenance))}</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "px-4" : ""}`} style={{ fontWeight: 600, color: "var(--color-negative)" }}>
                    <span className="font-semibold">{formatCurrencyCf(Math.round(holdingTotal))}</span>
                    {isCollapsed && (() => {
                      const prevHolding = i > 0 ? (isInvestment ? yearData[i-1].interestPortion + yearData[i-1].ongoingCosts : yearData[i-1].ongoingCosts) : holdingTotal;
                      const holdYoY = yoyPct(holdingTotal, prevHolding);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(holdYoY, "negative")}`}>{fmtYoY(holdYoY)}</span>;
                    })()}
                  </td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Depreciation detail cells (investment only) */}
                  {isInvestment && isGroupExpanded("depreciation") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: depColor, opacity: 0.7 }}>{formatCurrencyCf(Math.round(y.depDiv43))}</td>}
                  {isInvestment && isGroupExpanded("depreciation") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: depColor, opacity: 0.7 }}>{formatCurrencyCf(Math.round(y.depDiv40))}</td>}
                  {isInvestment && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "px-4" : ""}`} style={{ fontWeight: 600, color: depColor }}>
                    <span className="font-semibold">{formatCurrencyCf(Math.round(depTotal))}</span>
                    {isCollapsed && (() => {
                      const prevDep = i > 0 ? yearData[i-1].depDiv43 + yearData[i-1].depDiv40 : depTotal;
                      const depYoY = yoyPct(depTotal, prevDep);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(depYoY, "negative")}`}>{fmtYoY(depYoY)}</span>;
                    })()}
                  </td>}
                  {isInvestment && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />}
                  {/* Total */}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "pr-5 text-base font-bold tracking-tight" : "pr-5 text-sm"}`} style={{ fontWeight: 700, color: isInvestment ? "#a78bfa" : "var(--color-negative)" }}>
                    <span className="font-semibold">{formatCurrencyCf(Math.round(grandTotal))}</span>
                    {isCollapsed && (() => {
                      const prevGrand = i > 0 ? (() => { const py = yearData[i-1]; const ph = isInvestment ? py.interestPortion + py.ongoingCosts : py.ongoingCosts; const pd = py.depDiv43 + py.depDiv40; return isInvestment ? ph + pd : ph; })() : grandTotal;
                      const grandYoY = yoyPct(grandTotal, prevGrand);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(grandYoY, "negative")}`}>{fmtYoY(grandYoY)}</span>;
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
