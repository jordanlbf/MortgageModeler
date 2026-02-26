"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { Frequency, ScheduleResponse } from "@/lib/api";
import { fetchSchedule } from "@/lib/api";
import { formatCurrency, formatCurrencyShort, formatCompact } from "@/lib/formatters";
import GlassCard from "@/components/ui/GlassCard";
import Slider from "@/components/ui/Slider";

// ── Constants ────────────────────────────────────

const PERIODS_PER_YEAR: Record<Frequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
};

const FREQ_LABELS: Record<Frequency, string> = {
  weekly: "week",
  fortnightly: "fortnight",
  monthly: "month",
};

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
];

const LEGEND = [
  { color: "#818cf8", label: "Balance" },
  { color: "#f472b6", label: "Interest", dashed: true },
  { color: "#34d399", label: "Equity" },
];

// ── Chart tooltip ────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0a0a14] px-3 py-2 shadow-xl shadow-black/50">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">
        Yr {label}
      </div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-[12px] tabular-nums leading-snug">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-2" style={{ background: entry.color }} />
            <span style={{ color: entry.color, opacity: 0.7 }}>{entry.name}</span>
          </span>
          <span className="font-medium text-white/70">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Measure remaining viewport height ────────────

function useFillHeight(ref: React.RefObject<HTMLDivElement | null>, padding = 105, min = 300) {
  const [height, setHeight] = useState(min);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const top = el.getBoundingClientRect().top;
      setHeight(Math.max(window.innerHeight - top - padding, min));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref, padding, min]);
  return height;
}

// ── Main view ────────────────────────────────────

export default function AmortisationView() {
  const chartRef = useRef<HTMLDivElement>(null);
  const fillHeight = useFillHeight(chartRef);
  const [purchasePrice, setPurchasePrice] = useState(600_000);
  const [deposit, setDeposit] = useState(100_000);
  const [rate, setRate] = useState(6.2);
  const [years, setYears] = useState(30);
  const [appreciation, setAppreciation] = useState(3.0);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [view, setView] = useState<"chart" | "table">("chart");

  const [data, setData] = useState<ScheduleResponse | null>(null);

  // Debounced API fetch
  useEffect(() => {
    let cancelled = false;
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
        console.error("Failed to fetch schedule:", err);
      }
    }, 80);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [purchasePrice, deposit, rate, years, frequency, appreciation]);

  // Chart data mapped from API response
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.chart_data.map((p) => ({
      y: p.year,
      bal: p.balance,
      int: p.total_interest,
      eq: p.equity,
    }));
  }, [data]);

  // Table rows — yearly snapshots
  const tableRows = useMemo(() => {
    if (!data) return [];
    const ppy = PERIODS_PER_YEAR[frequency];
    return data.rows.filter((_, i) => i % ppy === 0 || i === data.rows.length - 1);
  }, [data, frequency]);

  const total = data ? data.summary.loan_amount + data.total_interest : 0;
  const interestPct = data && total > 0 ? ((data.total_interest / total) * 100).toFixed(1) : "0";
  const lvrPct = data ? (data.summary.lvr * 100).toFixed(1) : "0";

  return (
    <>
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.06] px-9 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 text-[13px] font-bold text-white">
            M
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-white/85">MortgageModeler</span>
        </div>
        <div className="flex rounded-lg border border-white/[0.07] bg-[#08080e] p-[3px]">
          {FREQ_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFrequency(value)}
              className={`relative rounded-md px-4 py-1.5 text-[13px] font-semibold tracking-wide transition-all duration-200 ${
                frequency === value
                  ? "bg-[#14142a] text-indigo-300 border border-indigo-400/20"
                  : "text-white/20 border border-transparent hover:text-white/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 px-9 py-6">
        {/* Stat Cards */}
        <div className="mb-5 grid grid-cols-3 gap-5">
          {/* Primary KPI — dominant */}
          <GlassCard className="flex flex-col items-center justify-center py-7 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/20">
              Repayment
            </div>
            <div className="mt-2.5 text-[40px] font-light leading-none tracking-tight text-white tabular-nums">
              {data ? formatCurrency(data.payment) : "—"}
            </div>
            <div className="mt-2 text-[12px] font-medium tracking-wide text-white/25">
              per {FREQ_LABELS[frequency]}
            </div>
          </GlassCard>

          {/* Secondary KPI */}
          <GlassCard className="flex flex-col items-center justify-center py-7 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/20">
              Total Interest
            </div>
            <div className="mt-2.5 text-[28px] font-normal leading-none tabular-nums text-pink-400/85">
              {data ? formatCurrencyShort(data.total_interest) : "—"}
            </div>
            <div className="mt-2 text-[12px] font-medium tabular-nums tracking-wide text-white/20">
              {data ? `${interestPct}% of total` : ""}
            </div>
          </GlassCard>

          {/* Secondary KPI */}
          <GlassCard className="flex flex-col items-center justify-center py-7 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/20">
              Loan Amount
            </div>
            <div className="mt-2.5 text-[28px] font-normal leading-none tabular-nums text-white/55">
              {data ? formatCurrencyShort(data.summary.loan_amount) : "—"}
            </div>
            <div className="mt-2 text-[12px] font-medium tabular-nums tracking-wide text-white/20">
              {data ? `${lvrPct}% LVR` : ""}
            </div>
          </GlassCard>
        </div>

        {/* Controls */}
        <GlassCard className="mb-5">
          <div className="grid grid-cols-5">
            <div className="px-5 py-4">
              <Slider
                label="Purchase price"
                value={purchasePrice}
                display={formatCurrencyShort(purchasePrice)}
                min={200_000}
                max={3_000_000}
                step={10_000}
                onChange={setPurchasePrice}
              />
            </div>
            <div className="border-l border-white/[0.05] px-5 py-4">
              <Slider
                label="Deposit"
                value={deposit}
                display={formatCurrencyShort(deposit)}
                min={0}
                max={Math.min(purchasePrice, 1_500_000)}
                step={5_000}
                onChange={setDeposit}
              />
            </div>
            <div className="border-l border-white/[0.05] px-5 py-4">
              <Slider
                label="Interest rate"
                value={rate}
                display={`${rate.toFixed(1)}%`}
                min={2}
                max={12}
                step={0.1}
                onChange={setRate}
              />
            </div>
            <div className="border-l border-white/[0.05] px-5 py-4">
              <Slider
                label="Loan term"
                value={years}
                display={`${years} yrs`}
                min={5}
                max={30}
                step={1}
                onChange={setYears}
              />
            </div>
            <div className="border-l border-white/[0.05] px-5 py-4">
              <Slider
                label="Appreciation"
                value={appreciation}
                display={`${appreciation.toFixed(1)}%`}
                min={0}
                max={10}
                step={0.5}
                onChange={setAppreciation}
              />
            </div>
          </div>
        </GlassCard>

        {/* Chart / Table */}
        <GlassCard className="overflow-hidden">
          {/* Toggle header */}
          <div className="relative flex items-center justify-between border-b border-white/[0.05] px-6 py-3.5">
            {/* Legend (left) */}
            <div className="flex items-center gap-4">
              {view === "chart" ? (
                LEGEND.map(({ color, label, dashed }) => (
                  <span key={label} className="flex items-center gap-2 text-[12px] font-medium text-white/30">
                    <span
                      className="inline-block w-4"
                      style={{ borderTop: `${dashed ? "1.5px dashed" : "2px solid"} ${color}` }}
                    />
                    {label}
                  </span>
                ))
              ) : data ? (
                <span className="text-[13px] tabular-nums text-white/15">
                  {data.total_periods} periods
                </span>
              ) : null}
            </div>

            {/* Title (centred) */}
            <span className="absolute left-1/2 -translate-x-1/2 text-[13px] font-medium uppercase tracking-[0.1em] text-white/25">
              {view === "chart" ? "Balance & Equity Over Time" : "Amortisation Schedule"}
            </span>

            {/* Toggle (right) */}
            <div className="flex rounded-lg border border-white/[0.07] bg-[#08080e] p-[3px]">
              {(["chart", "table"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3.5 py-1 text-[12px] font-semibold capitalize tracking-wide transition-all duration-200 ${
                    view === v
                      ? "bg-[#14142a] text-indigo-300 border border-indigo-400/20"
                      : "text-white/20 border border-transparent hover:text-white/40"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          {view === "chart" && (
            <div ref={chartRef} className="px-4 pb-3 pt-2">
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={fillHeight}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="gBal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.05} />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gInt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f472b6" stopOpacity={0.02} />
                          <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gEq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.03} />
                          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="rgba(255,255,255,0.035)"
                        horizontal={true}
                        vertical={true}
                        strokeDasharray="1 0"
                      />
                      <XAxis
                        dataKey="y"
                        stroke="transparent"
                        tick={{ fill: "rgba(255,255,255,0.18)", fontSize: 11, fontWeight: 500, dy: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
                      />
                      <YAxis
                        stroke="transparent"
                        tick={{ fill: "rgba(255,255,255,0.18)", fontSize: 11, fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => "$" + formatCompact(v)}
                        width={50}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1, strokeDasharray: "3 3" }}
                      />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" />
                      <Area type="monotone" dataKey="bal" name="Balance" stroke="#818cf8" strokeWidth={2} fill="url(#gBal)" />
                      <Area type="monotone" dataKey="int" name="Interest" stroke="#f472b6" strokeWidth={1} fill="url(#gInt)" strokeDasharray="4 3" />
                      <Area type="monotone" dataKey="eq" name="Equity" stroke="#34d399" strokeWidth={1.2} fill="url(#gEq)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="flex items-center justify-center text-sm text-white/15" style={{ height: fillHeight }}>
                  Loading…
                </div>
              )}
            </div>
          )}

          {/* Table */}
          {view === "table" && (
            <>
              <div className="grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] border-b border-white/[0.05] px-6 py-2.5">
                {["#", "Opening", "Payment", "Interest", "Principal", "Closing"].map((h, i) => (
                  <div
                    key={h}
                    className={`text-xs font-medium uppercase tracking-[0.1em] text-white/20 ${
                      i === 0 ? "text-left" : "text-right"
                    }`}
                  >
                    {h}
                  </div>
                ))}
              </div>
              <div className="custom-scrollbar overflow-y-auto" style={{ maxHeight: fillHeight }}>
                {tableRows.map((row, ri) => (
                  <div
                    key={row.period}
                    className={`grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] px-6 py-2.5 text-[15px] tabular-nums transition-colors hover:bg-white/[0.02] ${
                      ri < tableRows.length - 1 ? "border-b border-white/[0.03]" : ""
                    }`}
                  >
                    <div className="text-sm text-white/20">{row.period}</div>
                    <div className="text-right text-white/30">{formatCurrency(row.opening_balance)}</div>
                    <div className="text-right text-white/50">{formatCurrency(row.scheduled_repayment)}</div>
                    <div className="text-right text-pink-400/80">{formatCurrency(row.interest)}</div>
                    <div className="text-right text-indigo-400/80">{formatCurrency(row.principal_paid)}</div>
                    <div className="text-right text-white/30">{formatCurrency(row.closing_balance)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>

        <div className="shrink-0 py-4 text-center text-xs text-white/[0.08]">
          MortgageModeler v0.1 · Daily compounding · AUD
        </div>
      </div>
    </>
  );
}
