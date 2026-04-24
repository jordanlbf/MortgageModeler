"use client";

import { useMemo, useState } from "react";
import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { DEPRECIATION_COLOR } from "@/lib/theme";

import SummaryTable from "./table/SummaryTable";
import TaxTable from "./table/TaxTable";
import PropertyTable from "./table/PropertyTable";
import EquityTable from "./table/EquityTable";
import DeductionsTable from "./table/DeductionsTable";
import { ColumnDrawer, ColumnDrawerTrigger } from "@/components/ui/ColumnDrawer";
import { COLUMN_CONFIGS, defaultVisibility } from "./table/columns";

interface Props {
  yearData: YearData[];
  viewMode: ViewMode;
  selectedYear: number;
  hoveredYear: number | null;
  isInvestment: boolean;
  hasOffset: boolean;
  propertyValue: number;
  depColor?: string;
  onSelectYear: (year: number) => void;
  onHoverYear: (year: number | null) => void;
}

// Investment-only keys in the deductions view that should be hidden for PPOR.
const PPOR_HIDDEN_DEDUCTIONS = new Set(["interest", "div43", "div40", "totalDepr"]);

export default function CashflowDataTable({
  yearData, viewMode, selectedYear, hoveredYear, isInvestment,
  hasOffset, propertyValue, depColor = DEPRECIATION_COLOR,
  onSelectYear, onHoverYear,
}: Props) {
  const showOffset = hasOffset && yearData.some((y) => y.offsetBalanceAtYear > 0);

  // Per-view-mode column visibility — each tab remembers its own toggles
  const [visibleByMode, setVisibleByMode] = useState<Record<ViewMode, Record<string, boolean>>>(() => {
    const initial = {} as Record<ViewMode, Record<string, boolean>>;
    (Object.keys(COLUMN_CONFIGS) as ViewMode[]).forEach((m) => {
      initial[m] = defaultVisibility(COLUMN_CONFIGS[m]);
    });
    return initial;
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter out columns that don't apply to the current context (e.g. PPOR in deductions)
  const activeColumns = useMemo(() => {
    const raw = COLUMN_CONFIGS[viewMode];
    if (viewMode === "deductions" && !isInvestment) {
      return raw.filter((c) => !PPOR_HIDDEN_DEDUCTIONS.has(c.key));
    }
    return raw;
  }, [viewMode, isInvestment]);

  const visibleCols = visibleByMode[viewMode];
  const visibleCount = activeColumns.filter((c) => visibleCols[c.key] !== false).length;

  const toggleColumn = (key: string) => {
    setVisibleByMode((prev) => ({
      ...prev,
      [viewMode]: { ...prev[viewMode], [key]: !prev[viewMode][key] },
    }));
  };

  const resetColumns = () => {
    setVisibleByMode((prev) => ({
      ...prev,
      [viewMode]: defaultVisibility(COLUMN_CONFIGS[viewMode]),
    }));
  };

  const getRowHandlers = (year: number) => ({
    onClick: () => onSelectYear(year),
    onMouseEnter: () => onHoverYear(year),
    onMouseLeave: () => onHoverYear(null),
  });

  const formatYearCell = (year: number) => {
    const isSelected = year === selectedYear;

    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className={`w-0.5 h-4 rounded-r-sm shrink-0 ${isSelected ? "bg-brand" : "bg-transparent"}`} />
        <span className={isSelected ? "text-brand font-medium" : undefined}>
          Yr {year}
        </span>
      </span>
    );
  };

  const getRowClass = (year: number) => {
    const isSelected = year === selectedYear;
    const classes = ["h-8 transition-colors cursor-pointer hover:bg-white/[0.02]"];
    if (isSelected) classes.push("bg-brand/[0.04]");
    return classes.join(" ");
  };

  // hoveredYear is still consumed by parent components for chart highlighting
  void hoveredYear;

  const shared = {
    yearData,
    isInvestment,
    showOffset,
    propertyValue,
    depColor,
    formatYearCell,
    getRowClass,
    getRowHandlers,
    visibleCols,
  };

  return (
    <>
      {/* Toolbar floats above the table on the page background */}
      <div className="flex items-center justify-between mb-3">
        <ColumnDrawerTrigger
          visibleCount={visibleCount}
          totalCount={activeColumns.length}
          onClick={() => setDrawerOpen(true)}
        />
        <div className="text-[11px] text-fg-muted">
          {yearData.length} years
        </div>
      </div>

      <div className="relative w-full bg-card border border-border-subtle rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {viewMode === "summary"    && <SummaryTable    {...shared} />}
          {viewMode === "tax"        && <TaxTable        {...shared} />}
          {viewMode === "property"   && <PropertyTable   {...shared} />}
          {viewMode === "equity"     && <EquityTable     {...shared} />}
          {viewMode === "deductions" && <DeductionsTable {...shared} />}
        </div>
      </div>

      <ColumnDrawer
        columns={activeColumns}
        visibleColumns={visibleCols}
        onToggleColumn={toggleColumn}
        onReset={resetColumns}
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
