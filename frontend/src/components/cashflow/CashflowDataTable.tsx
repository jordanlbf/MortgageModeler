"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import type { ViewMode, YearData } from "@/lib/cashflow-types";

import SummaryTable from "./table/SummaryTable";
import TaxTable from "./table/TaxTable";
import PropertyTable from "./table/PropertyTable";
import EquityTable from "./table/EquityTable";
import DeductionsTable from "./table/DeductionsTable";

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
    const isSelected = year === selectedYear;
    const isHovered = year === hoveredYear && !isSelected;
    const milestone = getMilestoneForYear(year);
    const isExpanded = expandedMilestones.has(milestone);
    const groupYears = getGroupYears(year);
    const hasGroupYears = groupYears.length > 0;

    const showChevron = isMilestoneRow && hasGroupYears;

    return (
      <span className="whitespace-nowrap inline-flex items-center gap-2.5">
        {showChevron ? (
          <span className="inline-flex items-center justify-center mr-1.5 text-white/[0.3] transition-all duration-150 group-hover/row:text-white/[0.55] group-hover/row:translate-x-[1px]">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        ) : (
          <span className="inline-flex items-center justify-center mr-1.5 w-3" aria-hidden="true" />
        )}
        <span className={`inline-flex items-center text-[13px] ${isMilestoneRow ? "font-medium" : "font-normal"} text-accent transition-all duration-150 ease-in-out whitespace-nowrap ${isSelected ? "opacity-100" : isHovered ? "opacity-80" : ""}`} style={{ color: isMilestoneRow ? "var(--color-accent)" : "rgba(255, 255, 255, 0.85)" }}>
          Year {year}
        </span>
      </span>
    );
  };

  // Row class helper for selected/hovered states
  const getRowClass = (year: number, isMilestoneRow = false) => {
    const isSelected = year === selectedYear;
    const isHovered = year === hoveredYear && !isSelected;
    const isExpandable = isMilestoneRow;
    const isChildRow = !isMilestoneRow && !isMilestoneYear(year);
    return `group/row h-[52px] transition-[background] duration-100 ease-in-out cursor-pointer hover:bg-[var(--color-surface-hover)] ${isSelected ? "row-selected bg-accent/[0.045] hover:bg-accent/[0.045]" : ""} ${isHovered ? "bg-accent/[0.015]" : ""} ${isExpandable ? "cursor-pointer" : ""} ${isMilestoneRow ? "[&_td]:relative [&_td]:after:content-[''] [&_td]:after:absolute [&_td]:after:left-0 [&_td]:after:right-0 [&_td]:after:bottom-[-1px] [&_td]:after:h-[6px] [&_td]:after:bg-gradient-to-b [&_td]:after:from-black/[0.10] [&_td]:after:to-transparent [&_td]:after:pointer-events-none" : ""} ${isChildRow ? "bg-black/[0.02]" : ""}`;
  };

  // Shared props for all sub-tables
  const shared = {
    yearData,
    isInvestment,
    showOffset,
    propertyValue,
    depColor,
    isGroupExpanded,
    toggleGroup,
    isRowVisible,
    isMilestoneYear,
    formatYearCell,
    getRowClass,
    getRowHandlers,
  };

  return (
    <div className="relative w-full">
      {showExpandButton && (
        <button
          className="absolute top-1.5 left-2 z-[2] flex items-center justify-center w-[22px] h-[22px] border-none rounded bg-transparent text-white/[0.22] cursor-pointer transition-[color,background] duration-150 hover:bg-accent/[0.08] hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
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
      {viewMode === "summary" && summaryPanel && (
        <SummaryTable {...shared} panel={summaryPanel} />
      )}
      {viewMode === "tax" && taxPanel && (
        <TaxTable {...shared} panel={taxPanel} />
      )}
      {viewMode === "property" && (
        <PropertyTable {...shared} panel={propertyPanel} />
      )}
      {viewMode === "equity" && equityPanel && (
        <EquityTable {...shared} panel={equityPanel} />
      )}
      {viewMode === "deductions" && deductionsPanel && (
        <DeductionsTable {...shared} panel={deductionsPanel} />
      )}
    </div>
    </div>
  );
}
