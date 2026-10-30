"use client";

import { useState, useRef, useCallback } from "react";
import { t } from "@/lib/theme";
import { useAmortisationState } from "@/hooks/useAmortisationState";
import { useFillHeight } from "@/hooks/useFillHeight";
import { useFocusMode } from "@/hooks/useFocusMode";
import KpiCards from "@/components/amortisation/KpiCards";
import LoanControls from "@/components/amortisation/LoanControls";
import AmortisationChart, { ChartLegend } from "@/components/amortisation/AmortisationChart";
import AmortisationTable from "@/components/amortisation/AmortisationTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import ErrorBoundary from "@/components/domain/ErrorBoundary";


const TRANSITION_MS = 350;
/** Layout for the Chart / Table segment options (look comes from the variant). */
const SEGMENT_ITEM = "flex items-center gap-1.5 px-3.5 py-1.5";
const COLLAPSE_STYLE = "grid transition-[grid-template-rows,opacity] ease-in-out";

export default function AmortisationView() {
  // ── Data + inputs ──────────────────────────────
  const { inputs, setters, data, error, chartData, tableRows } = useAmortisationState();
  const { purchasePrice, deposit, rate, years, appreciation, offsetBalance, offsetContribution, frequency } = inputs;

  // ── View state ─────────────────────────────────
  const [view, setView] = useState<"chart" | "table">("chart");
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(["bal", "int"]));
  const chartRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const showOffset = visibleSeries.has("offset");
  const showEquity = visibleSeries.has("eq");

  // ── Chart height + focus ───────────────────────
  const normalHeight = useFillHeight(chartRef, 80, 300, `${showOffset}${showEquity}`);
  const { focused, chartHeight, handleFocusToggle } = useFocusMode({ cardRef, controlsRef, normalHeight });

  const toggleSeries = useCallback((key: string) => {
    const willEnable = !visibleSeries.has(key);
    setVisibleSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    if (key === "eq") {
      setters.setAppreciation(willEnable ? 6.5 : 0);
    }
  }, [visibleSeries, setters]);

  // ── Render ─────────────────────────────────────
  return (
    <>
      <div>
        {/* Collapsible: KPIs + Controls */}
        <div
          className={COLLAPSE_STYLE}
          style={{
            gridTemplateRows: focused ? "0fr" : "1fr",
            opacity: focused ? 0 : 1,
            transitionDuration: `${TRANSITION_MS}ms`,
          }}
        >
          <div ref={controlsRef} className="overflow-hidden min-h-0">
            <KpiCards
              data={data}
              frequency={frequency}
              rate={rate}
              years={years}
              deposit={deposit}
              onPurchasePriceChange={setters.setPurchasePrice}
              onFrequencyChange={setters.setFrequency}
            />

            <LoanControls
              purchasePrice={purchasePrice}
              deposit={deposit}
              rate={rate}
              years={years}
              appreciation={appreciation}
              loanAmount={data?.summary.loan_amount ?? 0}
              frequency={frequency}
              showOffset={showOffset}
              showEquity={showEquity}
              offsetBalance={offsetBalance}
              offsetContribution={offsetContribution}
              onPurchasePriceChange={setters.setPurchasePrice}
              onDepositChange={setters.setDeposit}
              onRateChange={setters.setRate}
              onYearsChange={setters.setYears}
              onAppreciationChange={setters.setAppreciation}
              onOffsetBalanceChange={setters.setOffsetBalance}
              onOffsetContributionChange={setters.setOffsetContribution}
            />

            {error && (
              <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-[14px] text-red-400/80">
                {error}
              </div>
            )}
          </div>
        </div>

        <Card variant="glass" ref={cardRef} className="overflow-hidden">
          {/* Toolbar */}
          <div
            className="relative flex items-center justify-between px-5 py-3"
            style={{ borderBottom: `1px solid ${t.border.default}` }}
          >
            <div className="flex items-center gap-2">
              {view === "chart" ? (
                <ChartLegend visibleSeries={visibleSeries} onToggle={toggleSeries} />
              ) : data ? (
                <span className="text-[12px] font-medium tabular-nums text-fg-primary/25">
                  {data.total_periods} periods
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                variant="segment"
                aria-label="View"
                value={view}
                onValueChange={(v) => { if (v) setView(v as "chart" | "table"); }}
                className="flex gap-1"
              >
                <ToggleGroupItem value="chart" className={SEGMENT_ITEM}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <rect x="0" y="7" width="3" height="6" rx="1" fill="currentColor" />
                    <rect x="5" y="4" width="3" height="9" rx="1" fill="currentColor" />
                    <rect x="10" y="1" width="3" height="12" rx="1" fill="currentColor" />
                  </svg>
                  Chart
                </ToggleGroupItem>
                <ToggleGroupItem value="table" className={SEGMENT_ITEM}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true">
                    <rect x="0" y="0" width="13" height="2" rx="1" />
                    <rect x="0" y="4" width="13" height="2" rx="1" />
                    <rect x="0" y="8" width="13" height="2" rx="1" />
                    <rect x="0" y="11" width="8" height="2" rx="1" />
                  </svg>
                  Table
                </ToggleGroupItem>
              </ToggleGroup>

              <Button
                variant="ghost-icon"
                onClick={handleFocusToggle}
                className="inline-block border border-transparent p-2 text-fg-primary/25 transition-all duration-200 hover:bg-white/[0.04] hover:text-fg-primary/50 active:scale-90"
                title={focused ? "Exit focus mode (Esc)" : "Focus mode"}
                aria-pressed={focused}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="transition-transform duration-200"
                  style={{ transform: focused ? "rotate(180deg)" : undefined }}
                >
                  {focused ? (
                    <>
                      <polyline points="3 9 7 9 7 13" />
                      <line x1="2" y1="14" x2="7" y2="9" />
                      <polyline points="13 7 9 7 9 3" />
                      <line x1="14" y1="2" x2="9" y2="7" />
                    </>
                  ) : (
                    <>
                      <polyline points="10 2 14 2 14 6" />
                      <line x1="14" y1="2" x2="9" y2="7" />
                      <polyline points="6 14 2 14 2 10" />
                      <line x1="2" y1="14" x2="7" y2="9" />
                    </>
                  )}
                </svg>
              </Button>
            </div>
          </div>

          {/* Content */}
          <div
            ref={chartRef}
            className="overflow-hidden"
            style={{ height: chartHeight, transition: `height ${TRANSITION_MS}ms ease-in-out` }}
          >
            <ErrorBoundary>
              {view === "chart" ? (
                <AmortisationChart
                  data={chartData}
                  visibleSeries={visibleSeries}
                  height={chartHeight}
                />
              ) : (
                <AmortisationTable rows={tableRows} height={chartHeight} />
              )}
            </ErrorBoundary>
          </div>
        </Card>

      </div>
    </>
  );
}
