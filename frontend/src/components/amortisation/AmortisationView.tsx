"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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

const SLIDERS = [
  { key: "principal", label: "Loan amount", min: 100_000, max: 2_000_000, step: 10_000 },
  { key: "rate", label: "Interest rate", min: 2, max: 12, step: 0.1 },
  { key: "years", label: "Loan term", min: 5, max: 30, step: 1 },
] as const;

const LEGEND = [
  { color: "#818cf8", label: "Balance", dashed: false },
  { color: "#f472b6", label: "Interest", dashed: true },
  { color: "#34d399", label: "Equity", dashed: false },
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
    <div className="rounded-xl border border-white/[0.06] bg-[rgba(10,10,18,0.92)] px-3.5 py-2.5 text-xs backdrop-blur-2xl">
      <div className="mb-1 text-[9px] font-medium uppercase tracking-[0.1em] text-white/25">
        Year {label}
      </div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color }} className="font-medium tabular-nums leading-relaxed">
          {entry.name}
          <span className="mx-1 text-white/15">·</span>
          {formatCurrency(entry.value)}
        </div>
      ))}
    </div>
  );
}

// ── Main view ────────────────────────────────────

export default function AmortisationView() {
  const [principal, setPrincipal] = useState(500_000);
  const [rate, setRate] = useState(6.2);
  const [years, setYears] = useState(30);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [view, setView] = useState<"chart" | "table">("chart");

  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Debounced API fetch
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await fetchSchedule({
          principal,
          annual_rate: rate / 100,
          loan_term_years: years,
          frequency,
        });
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch schedule:", err);
        if (!cancelled) setLoading(false);
      }
    }, 80);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [principal, rate, years, frequency]);

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

  const total = data ? principal + data.total_interest : 0;
  const interestPct = data ? ((data.total_interest / total) * 100).toFixed(1) : "0";

  const setters = { principal: setPrincipal, rate: setRate, years: setYears } as const;
  const values = { principal, rate, years } as const;
  const displays = {
    principal: formatCurrencyShort(principal),
    rate: `${rate.toFixed(1)}%`,
    years: `${years} years`,
  } as const;

  return (
    <>
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.03] px-9 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-gradient-to-br from-indigo-400 to-indigo-600 text-[9px] font-bold text-white">
            M
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-white/90">MortgageModeler</span>
        </div>
        <div className="flex gap-0.5 rounded-lg bg-white/[0.03] p-0.5">
          {FREQ_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFrequency(value)}
              className={`rounded-md px-3.5 py-1.5 text-[11px] font-medium transition-all ${
                frequency === value
                  ? "bg-indigo-500/15 text-indigo-300"
                  : "text-white/20 hover:text-white/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1280px] px-9 py-8">
        {/* Hero + Stats */}
        <div className="mb-5 flex flex-wrap gap-5">
          <GlassCard className="flex-[1_1_340px] p-6" glow>
            <div className="mb-2 text-[9px] font-medium uppercase tracking-[0.1em] text-white/18">
              Your repayment
            </div>
            <div className="text-[42px] font-light leading-none tracking-tight text-white tabular-nums">
              {data ? formatCurrency(data.payment) : "—"}
            </div>
            <div className="mt-1.5 text-xs text-white/15">per {FREQ_LABELS[frequency]}</div>
          </GlassCard>

          <GlassCard className="min-w-36 flex-1 px-5 py-4">
            <div className="mb-1 text-[8px] font-medium uppercase tracking-[0.1em] text-white/15">
              Total Interest
            </div>
            <div className="text-xl font-medium tabular-nums text-pink-400">
              {data ? formatCurrencyShort(data.total_interest) : "—"}
            </div>
            <div className="mt-0.5 text-[9px] tabular-nums text-white/[0.12]">
              {data ? `${interestPct}% of total` : ""}
            </div>
          </GlassCard>

          <GlassCard className="min-w-36 flex-1 px-5 py-4">
            <div className="mb-1 text-[8px] font-medium uppercase tracking-[0.1em] text-white/15">
              Total Cost
            </div>
            <div className="text-xl font-medium tabular-nums text-white/50">
              {data ? formatCurrencyShort(total) : "—"}
            </div>
            <div className="mt-0.5 text-[9px] tabular-nums text-white/[0.12]">
              {data ? `over ${years} years` : ""}
            </div>
          </GlassCard>
        </div>

        {/* Controls */}
        <GlassCard className="mb-5 px-5 py-4">
          <div className="flex flex-wrap gap-6">
            {SLIDERS.map(({ key, label, min, max, step }) => (
              <Slider
                key={key}
                label={label}
                value={values[key]}
                display={displays[key]}
                min={min}
                max={max}
                step={step}
                onChange={setters[key]}
              />
            ))}
          </div>
        </GlassCard>

        {/* Chart / Table */}
        <GlassCard className="overflow-hidden">
          {/* Toggle header */}
          <div className="flex items-center justify-between border-b border-white/[0.03] px-5 py-3">
            <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-white/18">
              {view === "chart" ? "Balance & Equity Over Time" : "Amortisation Schedule"}
            </span>
            <div className="flex items-center gap-3">
              {view === "table" && data && (
                <span className="text-[9px] tabular-nums text-white/[0.08]">
                  {data.total_periods} periods
                </span>
              )}
              <div className="flex gap-0.5 rounded-lg bg-white/[0.03] p-0.5">
                {(["chart", "table"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-md px-4 py-1 text-[10px] font-medium capitalize transition-all ${
                      view === v ? "bg-indigo-500/15 text-indigo-300" : "text-white/20"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          {view === "chart" && (
            <div className="px-4 pb-3.5 pt-4">
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={380}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gBal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gInt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f472b6" stopOpacity={0.08} />
                          <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gEq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.1} />
                          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.025)" />
                      <XAxis
                        dataKey="y"
                        stroke="transparent"
                        tick={{ fill: "rgba(255,255,255,0.12)", fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="transparent"
                        tick={{ fill: "rgba(255,255,255,0.12)", fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${formatCompact(v)}`}
                        width={44}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="bal" name="Balance" stroke="#818cf8" strokeWidth={1.5} fill="url(#gBal)" />
                      <Area type="monotone" dataKey="int" name="Interest" stroke="#f472b6" strokeWidth={1} fill="url(#gInt)" strokeDasharray="4 3" />
                      <Area type="monotone" dataKey="eq" name="Equity" stroke="#34d399" strokeWidth={1} fill="url(#gEq)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="mt-1.5 flex gap-4.5 pl-1">
                    {LEGEND.map(({ color, label, dashed }) => (
                      <span key={label} className="flex items-center gap-1.5 text-[9px] text-white/20">
                        <span
                          className="inline-block w-3.5"
                          style={{ borderTop: `1.5px ${dashed ? "dashed" : "solid"} ${color}` }}
                        />
                        {label}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-[380px] items-center justify-center text-xs text-white/10">
                  Loading…
                </div>
              )}
            </div>
          )}

          {/* Table */}
          {view === "table" && (
            <>
              <div className="grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] border-b border-white/[0.03] px-5 py-2">
                {["#", "Opening", "Payment", "Interest", "Principal", "Closing"].map((h, i) => (
                  <div
                    key={h}
                    className={`text-[8px] font-medium uppercase tracking-[0.1em] text-white/[0.12] ${
                      i === 0 ? "text-left" : "text-right"
                    }`}
                  >
                    {h}
                  </div>
                ))}
              </div>
              <div className="custom-scrollbar max-h-[400px] overflow-y-auto">
                {tableRows.map((row, ri) => (
                  <div
                    key={row.period}
                    className={`grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] px-5 py-1.5 text-[11px] tabular-nums transition-colors hover:bg-white/[0.015] ${
                      ri < tableRows.length - 1 ? "border-b border-white/[0.015]" : ""
                    }`}
                  >
                    <div className="text-[10px] text-white/[0.12]">{row.period}</div>
                    <div className="text-right text-white/[0.22]">{formatCurrency(row.opening_balance)}</div>
                    <div className="text-right text-white/[0.38]">{formatCurrency(row.scheduled_repayment)}</div>
                    <div className="text-right text-pink-400">{formatCurrency(row.interest)}</div>
                    <div className="text-right text-indigo-400">{formatCurrency(row.principal_paid)}</div>
                    <div className="text-right text-white/[0.22]">{formatCurrency(row.closing_balance)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>

        <div className="py-7 text-center text-[9px] text-white/[0.06]">
          MortgageModeler v0.1 · Daily compounding · AUD
        </div>
      </div>
    </>
  );
}
