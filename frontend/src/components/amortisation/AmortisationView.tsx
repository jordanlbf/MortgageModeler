"use client";

import { useState, useRef, useCallback } from "react";
import { FREQ_OPTIONS } from "@/lib/constants";
import { t } from "@/lib/theme";
import { useAmortisationState } from "@/hooks/useAmortisationState";
import { useFillHeight } from "@/hooks/useFillHeight";
import { useFocusMode } from "@/hooks/useFocusMode";
import Header from "@/components/layout/Header";
import KpiCards from "@/components/amortisation/KpiCards";
import LoanControls from "@/components/amortisation/LoanControls";
import AmortisationChart, { ChartLegend } from "@/components/amortisation/AmortisationChart";
import AmortisationTable from "@/components/amortisation/AmortisationTable";
import GlassCard from "@/components/ui/GlassCard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import SegmentedToggle from "@/components/ui/SegmentedToggle";

const TRANSITION_MS = 350;
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
    setVisibleSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // ── Render ─────────────────────────────────────
  return (
    <>
      <Header>
        <SegmentedToggle options={FREQ_OPTIONS} value={frequency} onChange={setters.setFrequency} size="sm" />
      </Header>

      <div className="px-9 py-5">
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

        <GlassCard ref={cardRef} className="overflow-hidden">
          {/* Toolbar */}
          <div
            className="relative flex items-center justify-between px-5 py-3"
            style={{ borderBottom: `1px solid ${t.border.default}` }}
          >
            <div className="flex items-center gap-2">
              {view === "chart" ? (
                <ChartLegend visibleSeries={visibleSeries} onToggle={toggleSeries} />
              ) : data ? (
                <span className="text-[12px] font-medium tabular-nums text-muted/25">
                  {data.total_periods} periods
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <SegmentedToggle
                options={[{ value: "chart" as const, label: "Chart" }, { value: "table" as const, label: "Table" }]}
                value={view}
                onChange={setView}
                size="md"
              />

              <button
                onClick={handleFocusToggle}
                className="rounded-lg p-2 text-muted/25 transition-all duration-200 hover:text-muted/50 hover:bg-white/[0.04] active:scale-90"
                style={{ border: "1px solid transparent" }}
                title={focused ? "Exit focus mode (Esc)" : "Focus mode"}
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
              </button>
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
        </GlassCard>

        {/* Collapsible: footer */}
        <div
          className={COLLAPSE_STYLE}
          style={{
            gridTemplateRows: focused ? "0fr" : "1fr",
            opacity: focused ? 0 : 1,
            transitionDuration: `${TRANSITION_MS}ms`,
          }}
        >
          <div className="overflow-hidden min-h-0">
            <div className="py-3 text-center text-[10px] text-muted/15">
              MortgageModeler v0.1 · Daily compounding · AUD
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
