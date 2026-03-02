"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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

export default function AmortisationView() {
  // ── Input state ────────────────────────────────
  const [purchasePrice, setPurchasePrice] = useState(600_000);
  const [deposit, setDeposit] = useState(100_000);
  const [rate, setRate] = useState(6.2);
  const [years, setYears] = useState(30);
  const [appreciation, setAppreciation] = useState(6.5);
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  // ── View state ─────────────────────────────────
  const [view, setView] = useState<"chart" | "table">("chart");
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(["bal", "int"]));
  const chartRef = useRef<HTMLDivElement>(null);
  const fillHeight = useFillHeight(chartRef);

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // ── API fetch ──────────────────────────────────
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const result = await fetchSchedule({
          purchase_price: purchasePrice,
          deposit,
          annual_rate: rate / 100,
          loan_term_years: years,
          frequency,
          annual_appreciation: appreciation / 100,
        });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch schedule");
      }
    }, 80);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [purchasePrice, deposit, rate, years, frequency, appreciation]);

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
          onPurchasePriceChange={setPurchasePrice}
          onDepositChange={setDeposit}
          onRateChange={setRate}
          onYearsChange={setYears}
          onAppreciationChange={setAppreciation}
        />

        {error && (
          <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-[14px] text-red-400/80">
            {error}
          </div>
        )}

        <GlassCard className="overflow-hidden">
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
          </div>

          {/* Content */}
          <div ref={chartRef}>
            {view === "chart" ? (
              <AmortisationChart
                data={chartData}
                visibleSeries={visibleSeries}
                height={fillHeight}
              />
            ) : (
              <AmortisationTable rows={tableRows} height={fillHeight} />
            )}
          </div>
        </GlassCard>

        <div className="py-3 text-center text-[10px] text-zinc-100/15">
          MortgageModeler v0.1 · Daily compounding · AUD
        </div>
      </div>
    </>
  );
}
