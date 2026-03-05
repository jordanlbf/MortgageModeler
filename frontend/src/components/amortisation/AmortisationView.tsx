"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { Frequency, ChartDataPoint } from "@/lib/types";
import type { ScheduleResponse } from "@/lib/api";
import { fetchSchedule } from "@/lib/api";
import { PERIODS_PER_YEAR } from "@/lib/constants";
import { t } from "@/lib/theme";
import { useFillHeight } from "@/hooks/useFillHeight";
import Header from "@/components/layout/Header";
import KpiCards from "@/components/amortisation/KpiCards";
import LoanControls from "@/components/amortisation/LoanControls";
import AmortisationChart, { ChartLegend } from "@/components/amortisation/AmortisationChart";
import AmortisationTable from "@/components/amortisation/AmortisationTable";
import GlassCard from "@/components/ui/GlassCard";

const TRANSITION_MS = 350;
const COLLAPSE_STYLE = "grid transition-[grid-template-rows,opacity] ease-in-out";

export default function AmortisationView() {
  // ── Input state ────────────────────────────────
  const [purchasePrice, setPurchasePrice] = useState(600_000);
  const [deposit, setDeposit] = useState(100_000);
  const [rate, setRate] = useState(6.2);
  const [years, setYears] = useState(30);
  const [appreciation, setAppreciation] = useState(6.5);
  const [offsetBalance, setOffsetBalance] = useState(0);
  const [offsetContribution, setOffsetContribution] = useState(0);
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  // ── View state ─────────────────────────────────
  const [view, setView] = useState<"chart" | "table">("chart");
  const [focused, setFocused] = useState(false);
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(["bal", "int"]));
  const chartRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const showOffset = visibleSeries.has("offset");
  const showEquity = visibleSeries.has("eq");

  // ── Chart height ─────────────────────────────
  // normalHeight is the live measurement for non-focused mode.
  // When entering focus we freeze it and add the collapsible section
  // height so the chart grows upward; bottom stays pinned.
  const normalHeight = useFillHeight(chartRef, 80, 300, `${showOffset}${showEquity}`);
  const [focusedChartHeight, setFocusedChartHeight] = useState(0);

  const chartHeight = focused ? focusedChartHeight : normalHeight;

  // ── Focus toggle ─────────────────────────────
  const handleFocusToggle = useCallback(() => {
    if (!focused) {
      const delta = controlsRef.current?.offsetHeight ?? 0;
      setFocusedChartHeight(normalHeight + delta);
    }
    setFocused((f) => !f);
  }, [focused, normalHeight]);

  // Escape + click-outside to exit focus
  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleFocusToggle(); };
    const onClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) handleFocusToggle();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onClick); };
  }, [focused, handleFocusToggle]);

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

  // ── API fetch ──────────────────────────────────
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setError(null);
      try {
        const result = await fetchSchedule({
          purchase_price: purchasePrice,
          deposit,
          annual_rate: rate / 100,
          loan_term_years: years,
          frequency,
          annual_appreciation: appreciation / 100,
          offset_balance: offsetBalance,
          offset_contribution: offsetContribution,
        });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch schedule");
      }
    }, 80);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [purchasePrice, deposit, rate, years, frequency, appreciation, offsetBalance, offsetContribution]);

  // ── Derived data ───────────────────────────────
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!data) return [];
    const loan = data.summary.loan_amount;
    return data.chart_data.map((p) => ({
      y: p.year,
      bal: p.balance,
      int: p.total_interest,
      eq: p.equity,
      paid: p.total_interest + (loan - p.balance),
      lvr: p.property_value > 0 ? (p.balance / p.property_value) * 100 : 0,
      offset: p.offset_balance,
    }));
  }, [data]);

  const tableRows = useMemo(() => {
    if (!data) return [];
    const ppy = PERIODS_PER_YEAR[frequency];
    return data.rows.filter((_, i) => i % ppy === 0 || i === data.rows.length - 1);
  }, [data, frequency]);

  // ── Render ─────────────────────────────────────
  return (
    <>
      <Header frequency={frequency} onFrequencyChange={setFrequency} />

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
              onPurchasePriceChange={setPurchasePrice}
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
              onPurchasePriceChange={setPurchasePrice}
              onDepositChange={setDeposit}
              onRateChange={setRate}
              onYearsChange={setYears}
              onAppreciationChange={setAppreciation}
              onOffsetBalanceChange={setOffsetBalance}
              onOffsetContributionChange={setOffsetContribution}
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
                <span className="text-[12px] font-medium tabular-nums text-zinc-100/25">
                  {data.total_periods} periods
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <div
                className="flex rounded-lg p-[3px]"
                style={{ border: `1px solid ${t.border.default}`, background: t.bg.control }}
              >
                {(["chart", "table"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-md px-3.5 py-1.5 text-[16px] font-semibold capitalize tracking-wide transition-all duration-200 ${
                      view === v
                        ? "bg-teal-400/[0.12] text-teal-400 border border-teal-400/20"
                        : "text-zinc-100/25 border border-transparent hover:text-zinc-100/40"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <button
                onClick={handleFocusToggle}
                className="rounded-lg p-2 text-zinc-100/25 transition-all duration-200 hover:text-zinc-100/50 hover:bg-white/[0.04] active:scale-90"
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
            {view === "chart" ? (
              <AmortisationChart
                data={chartData}
                visibleSeries={visibleSeries}
                height={chartHeight}
              />
            ) : (
              <AmortisationTable rows={tableRows} height={chartHeight} />
            )}
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
            <div className="py-3 text-center text-[10px] text-zinc-100/15">
              MortgageModeler v0.1 · Daily compounding · AUD
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
