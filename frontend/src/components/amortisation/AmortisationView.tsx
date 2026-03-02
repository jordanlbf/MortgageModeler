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
import { formatCurrency, formatCurrencyShort, formatCurrencyCompact, formatCompact } from "@/lib/formatters";
import { t, SERIES, SERIES_LIST } from "@/lib/theme";
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
    <div
      className="rounded-lg backdrop-blur-xl"
      style={{
        background: t.tooltip.bg,
        border: `1px solid ${t.tooltip.border}`,
        boxShadow: t.tooltip.shadow,
      }}
    >
      <div className="px-4 py-2" style={{ borderBottom: `1px solid ${t.tooltip.divider}` }}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400/50">
          Year {label}
        </span>
      </div>
      <div className="px-4 py-2.5">
        {payload.map((entry, i) => (
          <div
            key={i}
            className="flex items-center gap-6 tabular-nums"
            style={{ marginTop: i > 0 ? 6 : 0 }}
          >
            <span className="flex items-center gap-2 min-w-[80px]">
              <span
                className="h-[6px] w-[6px] rounded-full shrink-0"
                style={{ background: entry.color, boxShadow: `0 0 5px ${entry.color}40` }}
              />
              <span className="text-[12px] font-medium" style={{ color: entry.color, opacity: 0.65 }}>
                {entry.name}
              </span>
            </span>
            <span className="ml-auto text-[14px] font-medium text-zinc-100/65 text-right">
              {entry.name === "LVR" ? `${entry.value.toFixed(1)}%` : formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
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
        if (next.size > 1) next.delete(key);
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
      <header className="flex items-center justify-between px-9 py-4" style={{ borderBottom: `1px solid ${t.border.default}` }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold text-zinc-900"
            style={{ background: t.accent }}
          >
            M
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-zinc-100/75">MortgageModeler</span>
        </div>
        <div className="flex rounded-lg p-[3px]" style={{ border: `1px solid ${t.border.default}`, background: t.bg.control }}>
          {FREQ_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFrequency(value)}
              className={`rounded-md px-4 py-1.5 text-[13px] font-semibold tracking-wide transition-all duration-200 ${
                frequency === value
                  ? "bg-teal-400/[0.12] text-teal-400 border border-teal-400/20"
                  : "text-zinc-100/25 border border-transparent hover:text-zinc-100/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="px-9 py-5">

        {/* ── KPI Cards ── */}
        <div className="mb-5 grid grid-cols-[1.2fr_1fr_1fr] gap-5">
          <GlassCard
            className="relative flex flex-col items-center justify-center pt-5 pb-5 text-center border-teal-400/20"
            style={{ borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated }}
          >
            <div className="text-[18px] font-medium uppercase tracking-[0.14em] text-teal-400/40">
              Repayment
            </div>
            <div className="mt-3 text-[42px] font-normal leading-none tracking-[-0.02em] text-zinc-50 tabular-nums">
              {data ? formatCurrency(animPayment) : "—"}
            </div>
            <div className="mt-2.5 text-[14px] font-normal uppercase tracking-[0.12em] text-zinc-100/30">
              per {FREQ_LABELS[frequency]}
            </div>
          </GlassCard>

          <GlassCard
            className="relative flex flex-col items-center justify-center pt-5 pb-5 text-center border-teal-400/20"
            style={{ borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated }}
          >
            <div className="text-[18px] font-medium uppercase tracking-[0.14em] text-teal-400/40">
              Total Interest
            </div>
            <div className="mt-3 text-[42px] font-normal leading-none tracking-[-0.02em] tabular-nums text-zinc-50">
              {data ? formatCurrencyCompact(animInterest) : "—"}
            </div>
            <div className="mt-2.5 text-[14px] font-normal uppercase tabular-nums tracking-[0.12em] text-zinc-100/30">
              {data ? `${interestPct}% of total` : ""}
            </div>
          </GlassCard>

          <GlassCard
            className="relative flex flex-col items-center justify-center pt-5 pb-5 text-center border-teal-400/20"
            style={{ borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated }}
          >
            <div className="text-[18px] font-medium uppercase tracking-[0.14em] text-teal-400/40">
              Loan Amount
            </div>
            <div className="mt-3 text-[42px] font-normal leading-none tracking-[-0.02em] tabular-nums text-zinc-50">
              {data ? formatCurrencyCompact(animLoan) : "—"}
            </div>
            <div className="mt-2.5 text-[14px] font-normal uppercase tabular-nums tracking-[0.12em] text-zinc-100/30">
              {data ? `${lvrPct}% LVR` : ""}
            </div>
          </GlassCard>
        </div>

        {/* ── Controls ── */}
        <div className="mb-4 grid grid-cols-[4fr_1fr] gap-4">
          <GlassCard
            className="border-teal-400/20"
            style={{ borderTopWidth: 3, borderTopColor: t.accentBorder }}
          >
            <div className="px-5 py-2.5 text-center" style={{ borderBottom: `1px solid ${t.border.default}` }}>
              <span className="text-[18px] font-medium uppercase tracking-[0.14em] text-teal-400/40">Loan</span>
            </div>
            <div className="grid grid-cols-4">
              <div className="px-5 py-3">
                <Slider label="Purchase price" value={purchasePrice} display={formatCurrencyShort(purchasePrice)} min={200_000} max={3_000_000} step={10_000} onChange={setPurchasePrice} />
              </div>
              <div className="px-5 py-3" style={{ borderLeft: `1px solid ${t.border.default}` }}>
                <Slider label="Deposit" value={deposit} display={formatCurrencyShort(deposit)} min={0} max={Math.min(purchasePrice, 1_500_000)} step={5_000} onChange={setDeposit} />
              </div>
              <div className="px-5 py-3" style={{ borderLeft: `1px solid ${t.border.default}` }}>
                <Slider label="Interest rate" value={rate} display={`${rate.toFixed(1)}%`} min={2} max={12} step={0.1} onChange={setRate} />
              </div>
              <div className="px-5 py-3" style={{ borderLeft: `1px solid ${t.border.default}` }}>
                <Slider label="Loan term" value={years} display={`${years} yrs`} min={5} max={30} step={1} onChange={setYears} />
              </div>
            </div>
          </GlassCard>

          <GlassCard
            className="border-teal-400/20"
            style={{ borderTopWidth: 3, borderTopColor: t.accentBorder }}
          >
            <div className="px-5 py-2.5 text-center" style={{ borderBottom: `1px solid ${t.border.default}` }}>
              <span className="text-[18px] font-medium uppercase tracking-[0.14em] text-teal-400/40">Assumptions</span>
            </div>
            <div className="px-5 py-3">
              <Slider label="Appreciation" value={appreciation} display={`${appreciation.toFixed(1)}%`} min={0} max={10} step={0.5} onChange={setAppreciation} />
            </div>
          </GlassCard>
        </div>

        {/* ── Chart / Table ── */}
        <GlassCard className="overflow-hidden">
          <div className="relative flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${t.border.default}` }}>
            {/* Legend (left) */}
            <div className="flex items-center gap-2">
              {view === "chart" ? (
                SERIES_LIST.map(({ key, color, label }) => {
                  const active = visibleSeries.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleSeries(key)}
                      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[16px] font-semibold tracking-wide transition-all duration-200 cursor-pointer"
                      style={{
                        background: active ? `color-mix(in srgb, ${color} 12%, transparent)` : "transparent",
                        border: `1px solid ${active ? `color-mix(in srgb, ${color} 25%, transparent)` : "transparent"}`,
                        color: active ? color : t.chart.legendInactive,
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.color = `color-mix(in srgb, ${color} 50%, transparent)`;
                          e.currentTarget.style.background = `color-mix(in srgb, ${color} 5%, transparent)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.color = t.chart.legendInactive;
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full transition-all duration-200"
                        style={{
                          background: active ? color : t.chart.legendDotInactive,
                          boxShadow: active ? `0 0 6px ${color}50` : "none",
                        }}
                      />
                      {label}
                    </button>
                  );
                })
              ) : data ? (
                <span className="text-[12px] font-medium tabular-nums text-zinc-100/25">
                  {data.total_periods} periods
                </span>
              ) : null}
            </div>

            {/* Toggle (right) */}
            <div className="flex rounded-lg p-[3px]" style={{ border: `1px solid ${t.border.default}`, background: t.bg.control }}>
              {(["chart", "table"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3.5 py-1 text-[12px] font-semibold capitalize tracking-wide transition-all duration-200 ${
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

          {/* Chart */}
          {view === "chart" && (
            <div ref={chartRef} className="px-5 pb-2 pt-1">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={fillHeight}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
                    <defs>
                      {Object.entries(SERIES).map(([key, s]) => (
                        <linearGradient key={key} id={`g${key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={s.color} stopOpacity={s.fill[0]} />
                          <stop offset="100%" stopColor={s.color} stopOpacity={s.fill[1]} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid horizontal={true} vertical={false} stroke={t.chart.gridH} strokeDasharray="1 0" />
                    <CartesianGrid horizontal={false} vertical={true} stroke={t.chart.gridV} strokeDasharray="1 0" />
                    <XAxis
                      dataKey="y"
                      stroke="transparent"
                      tick={{ fill: t.chart.axisTick, fontSize: 14, fontWeight: 500, dy: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: t.chart.axisLine }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="transparent"
                      tick={{ fill: t.chart.axisTick, fontSize: 14, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => "$" + formatCompact(v)}
                      width={60}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="transparent"
                      tick={{ fill: t.chart.axisTickMuted, fontSize: 14, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                      width={40}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: t.chart.cursor, strokeWidth: 1, strokeDasharray: "3 3" }}
                    />
                    <ReferenceLine yAxisId="left" y={0} stroke={t.chart.gridH} />
                    {visibleSeries.has("bal") && <Area yAxisId="left" type="monotone" dataKey="bal" name={SERIES.bal.label} stroke={SERIES.bal.color} strokeWidth={SERIES.bal.stroke} fill="url(#gbal)" animationDuration={400} animationEasing="ease-out" />}
                    {visibleSeries.has("int") && <Area yAxisId="left" type="monotone" dataKey="int" name={SERIES.int.label} stroke={SERIES.int.color} strokeWidth={SERIES.int.stroke} fill="url(#gint)" animationDuration={400} animationEasing="ease-out" />}
                    {visibleSeries.has("eq") && <Area yAxisId="left" type="monotone" dataKey="eq" name={SERIES.eq.label} stroke={SERIES.eq.color} strokeWidth={SERIES.eq.stroke} fill="url(#geq)" animationDuration={400} animationEasing="ease-out" />}
                    {visibleSeries.has("lvr") && <Area yAxisId="right" type="monotone" dataKey="lvr" name={SERIES.lvr.label} stroke={SERIES.lvr.color} strokeWidth={SERIES.lvr.stroke} fill="url(#glvr)" animationDuration={400} animationEasing="ease-out" />}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center text-sm text-zinc-100/20" style={{ height: fillHeight }}>
                  Loading…
                </div>
              )}
            </div>
          )}

          {/* Table */}
          {view === "table" && (
            <>
              <div className="grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] px-5 py-2.5" style={{ borderBottom: `1px solid ${t.border.default}` }}>
                {["#", "Opening", "Payment", "Interest", "Principal", "Closing"].map((h, i) => (
                  <div
                    key={h}
                    className={`text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-100/25 ${
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
                    className="grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] px-5 py-2.5 text-[15px] tabular-nums transition-colors hover:bg-zinc-400/[0.04]"
                    style={{ borderBottom: ri < tableRows.length - 1 ? `1px solid ${t.border.default}` : "none" }}
                  >
                    <div className="text-sm text-zinc-100/25">{row.period}</div>
                    <div className="text-right text-zinc-100/35">{formatCurrency(row.opening_balance)}</div>
                    <div className="text-right text-zinc-100/60">{formatCurrency(row.scheduled_repayment)}</div>
                    <div className="text-right text-red-400/85">{formatCurrency(row.interest)}</div>
                    <div className="text-right text-teal-400/85">{formatCurrency(row.principal_paid)}</div>
                    <div className="text-right text-zinc-100/35">{formatCurrency(row.closing_balance)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>

        <div className="py-3 text-center text-[10px] text-zinc-100/15">
          MortgageModeler v0.1 · Daily compounding · AUD
        </div>
      </div>
    </>
  );
}
