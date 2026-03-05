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
import { useState, useEffect } from "react";
import type { ChartDataPoint } from "@/lib/types";
import { formatCurrency, formatCompact } from "@/lib/formatters";
import { t, SERIES, SERIES_LIST } from "@/lib/theme";

// ── Tooltip ──────────────────────────────────────

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
              <span className="text-[13px] font-medium" style={{ color: entry.color, opacity: 0.65 }}>
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

// ── Legend (toolbar-level, exported separately) ───

interface ChartLegendProps {
  visibleSeries: Set<string>;
  onToggle: (key: string) => void;
}

export function ChartLegend({ visibleSeries, onToggle }: ChartLegendProps) {
  return (
    <>
      {SERIES_LIST.map(({ key, color, label }) => {
        const active = visibleSeries.has(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className="flex items-center gap-2 rounded-md px-2.5 py-1 text-[13px] font-semibold tracking-wide transition-all duration-200 cursor-pointer"
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
      })}
    </>
  );
}

// ── Chart ─────────────────────────────────────────

interface AmortisationChartProps {
  data: ChartDataPoint[];
  visibleSeries: Set<string>;
  height: number;
}

export default function AmortisationChart({
  data,
  visibleSeries,
  height,
}: AmortisationChartProps) {
  const [animDuration, setAnimDuration] = useState(400);

  useEffect(() => {
    if (data.length > 0 && animDuration > 0) {
      const timer = setTimeout(() => setAnimDuration(0), 450);
      return () => clearTimeout(timer);
    }
  }, [data, animDuration]);
  const animEasing = "ease-out" as const;

  return (
    <div className="px-5 pb-2 pt-1">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 4, right: 6, left: 0, bottom: 32 }}>
            <defs>
              {Object.entries(SERIES).map(([key, s]) => (
                <linearGradient key={key} id={`g${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={s.fill[0]} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={s.fill[1]} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid horizontal vertical={false} stroke={t.chart.gridH} strokeDasharray="1 0" />
            <CartesianGrid horizontal={false} vertical stroke={t.chart.gridV} strokeDasharray="1 0" />
            <XAxis
              dataKey="y"
              stroke="transparent"
              tick={{ fill: t.chart.axisTick, fontSize: 11, fontWeight: 500, dy: 10 }}
              tickLine={false}
              axisLine={{ stroke: t.chart.axisLine }}
              label={{
                value: "Years",
                position: "bottom",
                offset: 10,
                style: { fill: t.chart.axisTick, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" },
              }}
            />
            <YAxis
              yAxisId="left"
              stroke="transparent"
              tick={{ fill: t.chart.axisTick, fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => "$" + formatCompact(v)}
              width={48}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="transparent"
              tick={{ fill: t.chart.axisTickMuted, fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              width={32}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: t.chart.cursor, strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <ReferenceLine yAxisId="left" y={0} stroke={t.chart.gridH} />
            {visibleSeries.has("bal") && <Area yAxisId="left" type="monotone" dataKey="bal" name={SERIES.bal.label} stroke={SERIES.bal.color} strokeWidth={SERIES.bal.stroke} fill="url(#gbal)" animationDuration={animDuration} animationEasing={animEasing} />}
            {visibleSeries.has("int") && <Area yAxisId="left" type="monotone" dataKey="int" name={SERIES.int.label} stroke={SERIES.int.color} strokeWidth={SERIES.int.stroke} fill="url(#gint)" animationDuration={animDuration} animationEasing={animEasing} />}
            {visibleSeries.has("eq") && <Area yAxisId="left" type="monotone" dataKey="eq" name={SERIES.eq.label} stroke={SERIES.eq.color} strokeWidth={SERIES.eq.stroke} fill="url(#geq)" animationDuration={animDuration} animationEasing={animEasing} />}
            {visibleSeries.has("paid") && <Area yAxisId="left" type="monotone" dataKey="paid" name={SERIES.paid.label} stroke={SERIES.paid.color} strokeWidth={SERIES.paid.stroke} fill="url(#gpaid)" animationDuration={animDuration} animationEasing={animEasing} />}
            {visibleSeries.has("lvr") && <Area yAxisId="right" type="monotone" dataKey="lvr" name={SERIES.lvr.label} stroke={SERIES.lvr.color} strokeWidth={SERIES.lvr.stroke} fill="url(#glvr)" animationDuration={animDuration} animationEasing={animEasing} />}
            {visibleSeries.has("offset") && <Area yAxisId="left" type="monotone" dataKey="offset" name={SERIES.offset.label} stroke={SERIES.offset.color} strokeWidth={SERIES.offset.stroke} fill="url(#goffset)" animationDuration={animDuration} animationEasing={animEasing} />}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div
          className="flex items-center justify-center text-sm text-zinc-100/20"
          style={{ height }}
        >
          Loading…
        </div>
      )}
    </div>
  );
}
