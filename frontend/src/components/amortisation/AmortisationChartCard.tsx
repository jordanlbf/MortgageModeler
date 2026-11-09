"use client";

import { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import type { AmortisationState } from "@/hooks/useAmortisationState";
import SectionCard from "@/components/patterns/cards/SectionCard";
import ErrorBoundary from "@/components/domain/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AmortisationChart, { ChartLegend } from "./AmortisationChart";
import AmortisationTable from "./AmortisationTable";

const HEIGHT = 360;
/** The table's column header, which sits above its scrolling body. */
const TABLE_HEAD = 38;

/** The loan over its life: a chart of the chosen series, or the year-by-year table. */
export default function AmortisationChartCard({ am, className }: { am: AmortisationState; className?: string }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(() => new Set(["bal", "int"]));

  // Adds or removes one series; the last one can't be hidden.
  const toggleSeries = (key: string) =>
    setVisibleSeries((prev) => {
      const next = new Set(prev);
      if (!next.has(key)) next.add(key);
      else if (next.size > 1) next.delete(key);
      return next;
    });

  return (
    <SectionCard
      flush
      title="Over the life of the loan"
      className={className}
      action={
        <ToggleGroup
          type="single"
          variant="segment"
          aria-label="View"
          value={view}
          onValueChange={(v) => { if (v) setView(v as "chart" | "table"); }}
          className="flex gap-1"
        >
          <ToggleGroupItem value="chart" className="flex items-center gap-1.5 px-3 py-1.5">
            <BarChart3 className="size-3.5" aria-hidden="true" /> Chart
          </ToggleGroupItem>
          <ToggleGroupItem value="table" className="flex items-center gap-1.5 px-3 py-1.5">
            <Table2 className="size-3.5" aria-hidden="true" /> Table
          </ToggleGroupItem>
        </ToggleGroup>
      }
    >
      {view === "chart" && (
        <div className="flex flex-wrap gap-1 px-6 pb-3">
          <ChartLegend visibleSeries={visibleSeries} onToggle={toggleSeries} />
        </div>
      )}
      <div className="overflow-hidden border-t border-border-subtle" style={{ height: HEIGHT }}>
        {!am.data ? (
          <Skeleton className="m-6 h-[calc(100%-48px)]" aria-hidden="true" />
        ) : (
          <ErrorBoundary>
            {view === "chart" ? (
              <AmortisationChart data={am.chartData} visibleSeries={visibleSeries} height={HEIGHT} />
            ) : (
              <AmortisationTable rows={am.tableRows} frequency={am.inputs.frequency} height={HEIGHT - TABLE_HEAD} />
            )}
          </ErrorBoundary>
        )}
      </div>
    </SectionCard>
  );
}
