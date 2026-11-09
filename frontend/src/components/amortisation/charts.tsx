"use client";

import { useId, useMemo, type ReactNode } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartDataPoint } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/formatters";
import { SERIES, t } from "@/lib/theme";
import { money } from "./format";

/** One palette for every amortisation chart. */
export const C = {
  balance: SERIES.bal.color,
  saved: t.data.positive,
  principal: SERIES.bal.color,
  interest: SERIES.int.color,
  equity: SERIES.eq.color,
  offset: SERIES.offset.color,
  lvr: SERIES.lvr.color,
  paid: SERIES.paid.color,
} as const;

const axis = { fontSize: 11, fill: "var(--color-chart-axis)" };

// ── Tooltip ──────────────────────────────────────

type Row = { name: string; value: number; color: string; display?: string };

function VizTooltip({ title, rows }: { title: ReactNode; rows: Row[] }) {
  return (
    <div
      className="min-w-[180px] rounded-lg px-3 py-2.5 backdrop-blur-xl"
      style={{ background: t.tooltip.bg, border: `1px solid ${t.tooltip.border}`, boxShadow: t.tooltip.shadow }}
    >
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-fg-tertiary">{title}</div>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-3 py-0.5 text-[13px] tabular-nums">
          <span className="size-2 shrink-0 rounded-full" style={{ background: r.color }} />
          <span className="text-fg-secondary">{r.name}</span>
          <span className="ml-auto font-medium text-fg-primary">{r.display ?? money(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-fg-tertiary">
      {dashed ? (
        <span className="h-0 w-3.5 border-t-2 border-dashed" style={{ borderColor: color }} />
      ) : (
        <span className="size-2 rounded-full" style={{ background: color }} />
      )}
      {label}
    </span>
  );
}

// ── Axes ─────────────────────────────────────────

/** Round money ticks from 0 to just above `max`, in 1, 2 or 5 × 10ⁿ steps. */
function moneyTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const n = Math.ceil(max / step - 1e-9);
  return Array.from({ length: n + 1 }, (_, i) => i * step);
}

/** Every 1, 2 or 5 years, from now to the last year. */
function yearTicks(last: number): number[] {
  const step = last <= 6 ? 1 : last <= 14 ? 2 : 5;
  const out: number[] = [];
  for (let y = 0; y <= last; y += step) out.push(y);
  return out;
}

const yearLabel = (v: number) => (v === 0 ? "Now" : `Yr ${v}`);
const yearTitle = (v: number) => (v === 0 ? "Now" : `Year ${v}`);

/** Shared by both charts so their plot areas line up year for year. */
const LEFT_AXIS = 52;
const RIGHT_AXIS = 40;

// ── Derived series ───────────────────────────────

interface YearSlice {
  /** Plotted at the middle of the year, so the bar spans it. */
  x: number;
  y: number;
  principal: number;
  interest: number;
}

/** Principal and interest paid in each year, from the cumulative series. */
function yearly(data: ChartDataPoint[]): YearSlice[] {
  const out: YearSlice[] = [];
  for (let i = 1; i < data.length; i++) {
    const a = data[i - 1], b = data[i];
    const principal = Math.max(0, a.bal - b.bal);
    const interest = Math.max(0, b.int - a.int);
    if (principal + interest < 1) break;
    out.push({ x: b.y - 0.5, y: b.y, principal, interest });
  }
  return out;
}

/** First year the balance hits zero, or null if it runs to term. */
function payoffYear(data: ChartDataPoint[]) {
  return data.find((d) => d.y > 0 && d.bal <= 1)?.y ?? null;
}

/** The last year either schedule reaches: the x-axis end for both charts. */
export function lastYear(data: ChartDataPoint[], baseline: ChartDataPoint[]) {
  return Math.max(data[data.length - 1]?.y ?? 0, baseline[baseline.length - 1]?.y ?? 0);
}

// ── Balance, and what the offset clears ──────────

/**
 * Balance with the offset (solid, filled). Above it, hatched, the debt the
 * offset has cleared compared with the same loan without it.
 */
export type BalanceSeriesKey = "bal" | "int" | "eq" | "paid" | "offset" | "lvr";

export const BALANCE_SERIES: { key: BalanceSeriesKey; label: string; color: string }[] = [
  { key: "bal", label: "Balance", color: C.balance },
  { key: "int", label: "Interest", color: C.interest },
  { key: "eq", label: "Equity", color: C.equity },
  { key: "paid", label: "Total paid", color: C.paid },
  { key: "offset", label: "Offset", color: C.offset },
  { key: "lvr", label: "LVR", color: C.lvr },
];

export const DEFAULT_BALANCE_SERIES: ReadonlySet<BalanceSeriesKey> = new Set(["bal", "int"]);

/** The key for the hatched band: what the offset has cleared. */
export function ClearedKey() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-fg-tertiary">
      <span
        aria-hidden="true"
        className="size-3 rounded-[3px] bg-data-positive/10 bg-[repeating-linear-gradient(135deg,transparent_0_2px,var(--color-data-positive)_2px_3px)] opacity-70"
      />
      Cleared by your offset
    </span>
  );
}

export function BalanceRaceChart({
  data,
  baseline,
  last,
  height = 340,
  visible = DEFAULT_BALANCE_SERIES,
}: {
  data: ChartDataPoint[];
  baseline: ChartDataPoint[];
  /** Last year on the x-axis (see `lastYear`). */
  last: number;
  height?: number;
  visible?: ReadonlySet<BalanceSeriesKey>;
}) {
  const gid = useId().replace(/:/g, "");
  // The baseline usually runs longer (the loan ends later without the offset),
  // so plot over whichever series is longer. After payoff the balance and
  // offset sit at zero and the cumulative totals hold their final value.
  const merged = useMemo(() => {
    const longer = baseline.length > data.length ? baseline : data;
    const last = data[data.length - 1];
    return longer.map((p, i) => {
      const d = data[i];
      const bal = d?.bal ?? 0;
      const base = baseline[i]?.bal ?? bal;
      return {
        y: p.y,
        bal,
        base,
        gap: Math.max(0, base - bal),
        int: d?.int ?? last?.int ?? 0,
        eq: d?.eq ?? last?.eq ?? 0,
        paid: d?.paid ?? last?.paid ?? 0,
        offset: d?.offset ?? 0,
        lvr: d?.lvr ?? 0,
      };
    });
  }, [data, baseline]);
  const show = (k: BalanceSeriesKey) => visible.has(k);
  const hasBase = baseline.length > 0;
  const paid = payoffYear(data);

  // Round ticks over whatever is on the chart; the hatched band reaches the no-offset balance.
  const ticks = useMemo(() => {
    let max = 0;
    for (const p of merged) {
      if (show("bal")) max = Math.max(max, hasBase ? p.base : p.bal);
      if (show("int")) max = Math.max(max, p.int);
      if (show("eq")) max = Math.max(max, p.eq);
      if (show("paid")) max = Math.max(max, p.paid);
      if (show("offset")) max = Math.max(max, p.offset);
    }
    return moneyTicks(max);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merged, visible, hasBase]);

  return (
    <div style={{ height }} role="img" aria-label="Loan balance by year, and what the offset account clears">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={merged} margin={{ top: 12, right: show("lvr") ? 0 : RIGHT_AXIS, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`${gid}-bal`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.balance} stopOpacity={0.32} />
              <stop offset="100%" stopColor={C.balance} stopOpacity={0} />
            </linearGradient>
            <pattern id={`${gid}-gap`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill={C.saved} fillOpacity={0.08} />
              <line x1="0" y1="0" x2="0" y2="6" stroke={C.saved} strokeOpacity={0.35} strokeWidth={1.5} />
            </pattern>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-chart-grid-h)" strokeDasharray="2 4" />
          <XAxis dataKey="y" type="number" domain={[0, last]} ticks={yearTicks(last)} tick={axis} tickLine={false} axisLine={false} tickFormatter={yearLabel} />
          <YAxis yAxisId="left" domain={[0, ticks[ticks.length - 1]]} ticks={ticks} tick={axis} tickLine={false} axisLine={false} width={LEFT_AXIS} tickFormatter={(v) => formatCompactCurrency(v)} />
          <YAxis yAxisId="right" orientation="right" hide={!show("lvr")} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ ...axis, fill: C.lvr }} tickLine={false} axisLine={false} width={RIGHT_AXIS} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            cursor={{ stroke: "var(--color-chart-cursor)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof merged)[number];
              const rows: Row[] = [];
              if (show("bal")) rows.push({ name: "Balance", value: p.bal, color: C.balance });
              if (hasBase && show("bal")) rows.push({ name: "Cleared by offset", value: p.gap, color: C.saved });
              if (show("int")) rows.push({ name: "Interest", value: p.int, color: C.interest });
              if (show("eq")) rows.push({ name: "Equity", value: p.eq, color: C.equity });
              if (show("paid")) rows.push({ name: "Total paid", value: p.paid, color: C.paid });
              if (show("offset")) rows.push({ name: "Offset", value: p.offset, color: C.offset });
              if (show("lvr")) rows.push({ name: "LVR", value: p.lvr, color: C.lvr, display: `${p.lvr.toFixed(1)}%` });
              return <VizTooltip title={yearTitle(p.y)} rows={rows} />;
            }}
          />
          {hasBase && show("bal") && (
            <>
              <Area yAxisId="left" dataKey="bal" stackId="race" stroke="none" fill="transparent" isAnimationActive={false} activeDot={false} />
              <Area yAxisId="left" dataKey="gap" stackId="race" stroke="none" fill={`url(#${gid}-gap)`} animationDuration={700} activeDot={false} />
            </>
          )}
          {show("bal") && <Area yAxisId="left" dataKey="bal" stroke="none" fill={`url(#${gid}-bal)`} animationDuration={700} activeDot={false} />}
          {show("paid") && <Line yAxisId="left" dataKey="paid" stroke={C.paid} strokeWidth={1.75} dot={false} activeDot={{ r: 3, strokeWidth: 0, fill: C.paid }} animationDuration={700} />}
          {show("eq") && <Line yAxisId="left" dataKey="eq" stroke={C.equity} strokeWidth={1.75} dot={false} activeDot={{ r: 3, strokeWidth: 0, fill: C.equity }} animationDuration={700} />}
          {show("int") && <Line yAxisId="left" dataKey="int" stroke={C.interest} strokeWidth={1.75} dot={false} activeDot={{ r: 3, strokeWidth: 0, fill: C.interest }} animationDuration={700} />}
          {show("offset") && <Line yAxisId="left" dataKey="offset" stroke={C.offset} strokeWidth={1.75} dot={false} activeDot={{ r: 3, strokeWidth: 0, fill: C.offset }} animationDuration={700} />}
          {/* Dashed: on its own % axis, and it can sit right on the balance line. */}
          {show("lvr") && <Line yAxisId="right" dataKey="lvr" stroke={C.lvr} strokeWidth={1.75} strokeDasharray="5 4" dot={false} activeDot={{ r: 3, strokeWidth: 0, fill: C.lvr }} animationDuration={700} />}
          {show("bal") && <Line yAxisId="left" dataKey="bal" stroke={C.balance} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-surface-raised)" }} animationDuration={700} />}
          {paid !== null && show("bal") && (
            <>
              <ReferenceLine yAxisId="left" x={paid} stroke={C.saved} strokeOpacity={0.4} strokeDasharray="2 3" />
              <ReferenceDot yAxisId="left" x={paid} y={0} r={5} fill={C.saved} stroke="var(--color-surface-raised)" strokeWidth={2} />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Yearly stacked bars ──────────────────────────

/**
 * Principal and interest paid each year. Each bar spans its year on the same
 * axis as the balance chart above, so the two line up.
 */
export function YearlyBarsChart({ data, last, height = 240 }: {
  data: ChartDataPoint[];
  last: number;
  height?: number;
}) {
  const rows = useMemo(() => yearly(data), [data]);
  const ticks = useMemo(() => moneyTicks(Math.max(0, ...rows.map((r) => r.principal + r.interest))), [rows]);
  const cross = rows.find((r) => r.principal > r.interest);
  return (
    <div style={{ height }} role="img" aria-label="Principal and interest paid each year">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: RIGHT_AXIS, bottom: 0, left: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="var(--color-chart-grid-h)" strokeDasharray="2 4" />
          <XAxis dataKey="x" type="number" domain={[0, last]} ticks={yearTicks(last)} tick={axis} tickLine={false} axisLine={false} tickFormatter={yearLabel} />
          <YAxis domain={[0, ticks[ticks.length - 1]]} ticks={ticks} tick={axis} tickLine={false} axisLine={false} width={LEFT_AXIS} tickFormatter={(v) => formatCompactCurrency(v)} />
          <Tooltip
            cursor={{ fill: "var(--color-chart-cursor)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload as YearSlice;
              return (
                <VizTooltip
                  title={yearTitle(r.y)}
                  rows={[
                    { name: "Principal", value: r.principal, color: C.principal },
                    { name: "Interest", value: r.interest, color: C.interest },
                  ]}
                />
              );
            }}
          />
          {cross && <ReferenceLine x={cross.x} stroke="var(--color-fg-tertiary)" strokeDasharray="2 3" strokeOpacity={0.6} />}
          <Bar dataKey="principal" stackId="y" fill={C.principal} fillOpacity={0.85} animationDuration={600} />
          <Bar dataKey="interest" stackId="y" fill={C.interest} fillOpacity={0.85} radius={[3, 3, 0, 0]} animationDuration={600} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
