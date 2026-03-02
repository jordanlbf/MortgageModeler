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
  { key: "bal", color: "#38bdf8", label: "Balance" },
  { key: "int", color: "#f472b6", label: "Interest" },
  { key: "eq", color: "#34d399", label: "Equity" },
  { key: "lvr", color: "#fbbf24", label: "LVR" },
];

// ── Animated number ─────────────────────────────

function useAnimatedValue(target: number, duration = 300) {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number>(0);
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    const delta = target - from;
    if (delta === 0) return;

    const start = performance.now();
    cancelAnimationFrame(raf.current);

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = from + delta * eased;
      setDisplay(val);
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}

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
    <div className="rounded-xl border border-slate-400/[0.12] bg-slate-900/90 px-5 py-4 backdrop-blur-md">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-100/25">
        Year {label}
      </div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-8 text-[17px] tabular-nums leading-relaxed">
          <span className="flex items-center gap-2">
            <span className="inline-block h-[3px] w-3" style={{ background: entry.color }} />
            <span style={{ color: entry.color, opacity: 0.7 }}>{entry.name}</span>
          </span>
          <span className="font-medium text-slate-100/70">
            {entry.name === "LVR" ? `${entry.value.toFixed(1)}%` : formatCurrency(entry.value)}
          </span>
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
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(["bal", "int", "eq", "lvr"]));

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key); // keep at least one
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const [data, setData] = useState<ScheduleResponse | null>(null);

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
    return () => { cancelled = true; clearTimeout(timer); };
  }, [purchasePrice, deposit, rate, years, frequency, appreciation]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.chart_data.map((p) => ({
      y: p.year,
      bal: p.balance,
      int: p.total_interest,
      eq: p.equity,
      lvr: p.property_value > 0 ? (p.balance / p.property_value) * 100 : 0,
    }));
  }, [data]);

  const tableRows = useMemo(() => {
    if (!data) return [];
    const ppy = PERIODS_PER_YEAR[frequency];
    return data.rows.filter((_, i) => i % ppy === 0 || i === data.rows.length - 1);
  }, [data, frequency]);

  const total = data ? data.summary.loan_amount + data.total_interest : 0;
  const interestPct = data && total > 0 ? ((data.total_interest / total) * 100).toFixed(1) : "0";
  const lvrPct = data ? (data.summary.lvr * 100).toFixed(1) : "0";

  const animPayment = useAnimatedValue(data?.payment ?? 0);
  const animInterest = useAnimatedValue(data?.total_interest ?? 0);
  const animLoan = useAnimatedValue(data?.summary.loan_amount ?? 0);

  return (
    <>
      {/* ── Header ── */}
      <header className="flex items-center justify-between border-b border-slate-400/[0.08] px-9 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400 text-[13px] font-bold text-slate-900">
            M
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-slate-100/75">MortgageModeler</span>
        </div>
        <div className="flex rounded-lg border border-slate-400/[0.12] bg-slate-900/60 p-[3px]">
          {FREQ_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFrequency(value)}
              className={`rounded-md px-4 py-1.5 text-[13px] font-semibold tracking-wide transition-all duration-200 ${
                frequency === value
                  ? "bg-sky-400/[0.12] text-sky-400 border border-sky-400/20"
                  : "text-slate-100/25 border border-transparent hover:text-slate-100/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="px-9 py-4">

        {/* ── KPI Cards ── */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          <GlassCard className="relative flex flex-col items-center justify-center py-6 text-center border-sky-400/20 bg-slate-800/80" style={{ borderTopWidth: 2, borderTopColor: 'rgba(56,189,248,0.35)' }}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-400/50">
              Repayment
            </div>
            <div className="mt-2 text-[42px] font-light leading-none tracking-tight text-slate-50 tabular-nums">
              {data ? formatCurrency(animPayment) : "—"}
            </div>
            <div className="mt-1.5 text-[12px] font-medium tracking-wide text-slate-100/30">
              per {FREQ_LABELS[frequency]}
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-100/20">
              Total Interest
            </div>
            <div className="mt-2 text-[26px] font-normal leading-none tabular-nums text-pink-400/60">
              {data ? formatCurrencyShort(animInterest) : "—"}
            </div>
            <div className="mt-1.5 text-[12px] font-medium tabular-nums tracking-wide text-slate-100/20">
              {data ? `${interestPct}% of total` : ""}
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-100/20">
              Loan Amount
            </div>
            <div className="mt-2 text-[26px] font-normal leading-none tabular-nums text-slate-400/60">
              {data ? formatCurrencyShort(animLoan) : "—"}
            </div>
            <div className="mt-1.5 text-[12px] font-medium tabular-nums tracking-wide text-slate-100/20">
              {data ? `${lvrPct}% LVR` : ""}
            </div>
          </GlassCard>
        </div>

        {/* ── Controls ── */}
        <div className="mb-4 grid grid-cols-[4fr_1fr] gap-4">
          <GlassCard>
            <div className="border-b border-slate-400/[0.08] px-5 py-2 text-center">
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-100/25">Loan</span>
            </div>
            <div className="grid grid-cols-4">
              <div className="px-5 py-3">
                <Slider label="Purchase price" value={purchasePrice} display={formatCurrencyShort(purchasePrice)} min={200_000} max={3_000_000} step={10_000} onChange={setPurchasePrice} />
              </div>
              <div className="border-l border-slate-400/[0.08] px-5 py-3">
                <Slider label="Deposit" value={deposit} display={formatCurrencyShort(deposit)} min={0} max={Math.min(purchasePrice, 1_500_000)} step={5_000} onChange={setDeposit} />
              </div>
              <div className="border-l border-slate-400/[0.08] px-5 py-3">
                <Slider label="Interest rate" value={rate} display={`${rate.toFixed(1)}%`} min={2} max={12} step={0.1} onChange={setRate} />
              </div>
              <div className="border-l border-slate-400/[0.08] px-5 py-3">
                <Slider label="Loan term" value={years} display={`${years} yrs`} min={5} max={30} step={1} onChange={setYears} />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="border-b border-slate-400/[0.08] px-5 py-2 text-center">
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-100/25">Assumptions</span>
            </div>
            <div className="px-5 py-3">
              <Slider label="Appreciation" value={appreciation} display={`${appreciation.toFixed(1)}%`} min={0} max={10} step={0.5} onChange={setAppreciation} />
            </div>
          </GlassCard>
        </div>

        {/* ── Chart / Table ── */}
        <GlassCard className="overflow-hidden">
          <div className="relative flex items-center justify-between border-b border-slate-400/[0.08] px-5 py-3">
            {/* Legend (left) */}
            <div className="flex items-center gap-4">
              {view === "chart" ? (
                LEGEND.map(({ key, color, label }) => {
                  const active = visibleSeries.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleSeries(key)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                        active
                          ? "bg-slate-400/[0.08] border border-slate-400/[0.12] text-slate-100/50"
                          : "bg-transparent border border-transparent text-slate-100/20 hover:text-slate-100/35"
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full transition-all duration-200"
                        style={{
                          background: active ? color : "rgba(255,255,255,0.1)",
                          boxShadow: active ? `0 0 6px ${color}40` : "none",
                        }}
                      />
                      {label}
                    </button>
                  );
                })
              ) : data ? (
                <span className="text-[12px] font-medium tabular-nums text-slate-100/25">
                  {data.total_periods} periods
                </span>
              ) : null}
            </div>

            {/* Title (centred) */}
            <span className="absolute left-1/2 -translate-x-1/2 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-100/20">
              {view === "chart" ? "Balance & Equity Over Time" : "Amortisation Schedule"}
            </span>

            {/* Toggle (right) */}
            <div className="flex rounded-lg border border-slate-400/[0.12] bg-slate-900/60 p-[3px]">
              {(["chart", "table"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3.5 py-1 text-[12px] font-semibold capitalize tracking-wide transition-all duration-200 ${
                    view === v
                      ? "bg-sky-400/[0.12] text-sky-400 border border-sky-400/20"
                      : "text-slate-100/25 border border-transparent hover:text-slate-100/40"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          {view === "chart" && (
            <div ref={chartRef} className="px-5 pb-2 pt-1">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={fillHeight}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="gBal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.20} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gInt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#f472b6" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="gEq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.14} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="gLvr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.10} />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="1 0" />
                    <XAxis
                      dataKey="y"
                      stroke="transparent"
                      tick={{ fill: "rgba(148,163,184,0.5)", fontSize: 11, fontWeight: 500, dy: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(148,163,184,0.08)" }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="transparent"
                      tick={{ fill: "rgba(148,163,184,0.5)", fontSize: 11, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => "$" + formatCompact(v)}
                      width={50}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="transparent"
                      tick={{ fill: "rgba(148,163,184,0.4)", fontSize: 11, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                      width={40}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: "rgba(148,163,184,0.15)", strokeWidth: 1, strokeDasharray: "3 3" }}
                    />
                    <ReferenceLine yAxisId="left" y={0} stroke="rgba(148,163,184,0.08)" />
                    {visibleSeries.has("bal") && <Area yAxisId="left" type="monotone" dataKey="bal" name="Balance" stroke="#38bdf8" strokeWidth={2} fill="url(#gBal)" animationDuration={400} animationEasing="ease-out" />}
                    {visibleSeries.has("int") && <Area yAxisId="left" type="monotone" dataKey="int" name="Interest" stroke="#f472b6" strokeWidth={1} fill="url(#gInt)" animationDuration={400} animationEasing="ease-out" />}
                    {visibleSeries.has("eq") && <Area yAxisId="left" type="monotone" dataKey="eq" name="Equity" stroke="#34d399" strokeWidth={1.2} fill="url(#gEq)" animationDuration={400} animationEasing="ease-out" />}
                    {visibleSeries.has("lvr") && <Area yAxisId="right" type="monotone" dataKey="lvr" name="LVR" stroke="#fbbf24" strokeWidth={1.5} fill="url(#gLvr)" animationDuration={400} animationEasing="ease-out" />}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center text-sm text-slate-100/20" style={{ height: fillHeight }}>
                  Loading…
                </div>
              )}
            </div>
          )}

          {/* Table */}
          {view === "table" && (
            <>
              <div className="grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] border-b border-slate-400/[0.08] px-5 py-2.5">
                {["#", "Opening", "Payment", "Interest", "Principal", "Closing"].map((h, i) => (
                  <div
                    key={h}
                    className={`text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-100/25 ${
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
                    className={`grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] px-5 py-2.5 text-[15px] tabular-nums transition-colors hover:bg-slate-400/[0.04] ${
                      ri < tableRows.length - 1 ? "border-b border-slate-400/[0.08]" : ""
                    }`}
                  >
                    <div className="text-sm text-slate-100/25">{row.period}</div>
                    <div className="text-right text-slate-100/35">{formatCurrency(row.opening_balance)}</div>
                    <div className="text-right text-slate-100/60">{formatCurrency(row.scheduled_repayment)}</div>
                    <div className="text-right text-pink-400/85">{formatCurrency(row.interest)}</div>
                    <div className="text-right text-sky-400/85">{formatCurrency(row.principal_paid)}</div>
                    <div className="text-right text-slate-100/35">{formatCurrency(row.closing_balance)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>

        <div className="py-3 text-center text-[10px] text-slate-100/15">
          MortgageModeler v0.1 · Daily compounding · AUD
        </div>
      </div>
    </>
  );
}
