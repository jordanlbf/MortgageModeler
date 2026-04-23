"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { DEPRECIATION_COLOR } from "@/lib/theme";

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
  depColor?: string;
  showExpandButton?: boolean;
  expandedMilestones?: Set<number>;
  onExpandedChange?: (expanded: Set<number>) => void;
  onSelectYear: (year: number) => void;
  onHoverYear: (year: number | null) => void;
}

export default function CashflowDataTable({
  yearData, viewMode, selectedYear, hoveredYear, isInvestment,
  hasOffset, propertyValue, depColor = DEPRECIATION_COLOR, showExpandButton = true,
  expandedMilestones: externalExpanded, onExpandedChange,
  onSelectYear, onHoverYear,
}: Props) {
  const showOffset = hasOffset && yearData.some(y => y.offsetBalanceAtYear > 0);

  const [localExpanded, setLocalExpanded] = useState<Set<number>>(new Set());
  const expandedMilestones = externalExpanded ?? localExpanded;
  const setExpandedMilestones = onExpandedChange ?? setLocalExpanded;

  const isMilestoneYear = (year: number) => year === 1 || (year - 1) % 5 === 0;
  const getMilestoneForYear = (year: number) => {
    if (year === 1) return 1;
    return Math.floor((year - 1) / 5) * 5 + 1;
  };

  const toggleMilestone = (milestone: number) => {
    const next = new Set(expandedMilestones);
    if (next.has(milestone)) next.delete(milestone);
    else next.add(milestone);
    setExpandedMilestones(next);
  };

  const isRowVisible = (year: number) => {
    if (isMilestoneYear(year)) return true;
    const milestone = getMilestoneForYear(year);
    return expandedMilestones.has(milestone);
  };

  const getGroupYears = (milestone: number) => {
    const endYear = milestone + 4;
    return yearData.filter(y => y.year > milestone && y.year <= endYear);
  };

  const getRowHandlers = (year: number, isMilestone: boolean) => ({
    onClick: () => {
      if (isMilestone) toggleMilestone(year);
      onSelectYear(year);
    },
    onMouseEnter: () => onHoverYear(year),
    onMouseLeave: () => onHoverYear(null),
  });

  const formatYearCell = (year: number, _index: number, isMilestoneRow = false) => {
    const milestone = getMilestoneForYear(year);
    const isExpanded = expandedMilestones.has(milestone);
    const groupYears = getGroupYears(year);
    const hasGroupYears = groupYears.length > 0;
    const showChevron = isMilestoneRow && hasGroupYears;
    const isSelected = year === selectedYear;

    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className={`w-0.5 h-4 rounded-r-sm shrink-0 ${isSelected ? "bg-brand" : "bg-transparent"}`} />
        {showChevron && (
          <span className="text-fg-muted inline-flex items-center">
            {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </span>
        )}
        <span className={isSelected ? "text-brand font-medium" : undefined}>
          Year {year}
        </span>
      </span>
    );
  };

  const getRowClass = (year: number, isMilestoneRow = false) => {
    const isSelected = year === selectedYear;
    const classes = ["h-8 transition-colors cursor-pointer hover:bg-white/[0.02]"];
    if (isMilestoneRow) classes.push("[&>td]:border-t", "[&>td]:border-default");
    if (isSelected) classes.push("bg-brand/[0.04]");
    return classes.join(" ");
  };

  // hoveredYear is still consumed by parent components for chart highlighting;
  // row-level hover is now pure CSS, no JS state needed.
  void hoveredYear;

  const shared = {
    yearData,
    isInvestment,
    showOffset,
    propertyValue,
    depColor,
    isRowVisible,
    isMilestoneYear,
    formatYearCell,
    getRowClass,
    getRowHandlers,
  };

  return (
    <div className="relative w-full bg-card border border-border-subtle rounded-xl overflow-hidden">
      {showExpandButton && (
        <button
          className="absolute top-2.5 left-2.5 z-[2] flex items-center justify-center w-[22px] h-[22px] border-none rounded bg-transparent text-fg-primary/[0.22] cursor-pointer transition-[color,background] duration-150 hover:bg-brand/[0.08] hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
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
      <div className="overflow-x-auto">
        {viewMode === "summary"    && <SummaryTable    {...shared} />}
        {viewMode === "tax"        && <TaxTable        {...shared} />}
        {viewMode === "property"   && <PropertyTable   {...shared} />}
        {viewMode === "equity"     && <EquityTable     {...shared} />}
        {viewMode === "deductions" && <DeductionsTable {...shared} />}
      </div>
    </div>
  );
}
