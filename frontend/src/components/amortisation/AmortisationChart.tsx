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
import { useState, useEffect, useMemo, useRef } from "react";
import type { ChartDataPoint } from "@/lib/types";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { t, SERIES, SERIES_LIST } from "@/lib/theme";

const SERIES_KEYS = Object.keys(SERIES) as (keyof typeof SERIES)[];

const AREA_CONFIG = SERIES_KEYS.map((key) => ({
  key,
  yAxisId: key === "lvr" ? "right" : "left",
}));

// ── Animation timing ──────────────────────────────
const ENTRANCE_MS = 800;
const ENTRANCE_STAGGER_MS = 100;
const TOGGLE_MS = 450;
const SLIDER_MS = 200;

// ── Tooltip ──────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  visibleSeries,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number; dataKey?: string }>;
  label?: number;
  visibleSeries?: Set<string>;
}) {
  if (!active || !payload?.length) return null;
  const filtered = visibleSeries
    ? payload.filter((e) => e.dataKey && visibleSeries.has(e.dataKey))
    : payload;
  if (!filtered.length) return null;
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
        <span className="text-[11px] font-semibold uppercase tracking-widest text-fg-secondary/50">
          Year {label}
        </span>
      </div>
      <div className="px-4 py-2.5">
        {filtered.map((entry, i) => (
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
            <span className="ml-auto text-[14px] font-medium text-fg-primary/65 text-right">
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
            aria-pressed={active}
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
  // ── Phase: entrance → steady ──
  const [phase, setPhase] = useState<"entrance" | "steady">("entrance");
  const hasData = data.length > 0;
  useEffect(() => {
    if (hasData && phase === "entrance") {
      const total = ENTRANCE_MS + ENTRANCE_STAGGER_MS * (AREA_CONFIG.length - 1) + 200;
      const timer = setTimeout(() => setPhase("steady"), total);
      return () => clearTimeout(timer);
    }
  }, [hasData, phase]);

  // ── Toggle detection ──
  // visibleSeries is a stable Set ref — only changes identity on toggle
  const [prevVisible, setPrevVisible] = useState(visibleSeries);
  const isToggle = phase === "steady" && prevVisible !== visibleSeries;
  if (prevVisible !== visibleSeries) setPrevVisible(visibleSeries);

  // ── Animation params: entrance 800ms, toggle 450ms ease-in-out, slider 200ms ease-out ──
  const animDuration = phase === "entrance" ? ENTRANCE_MS : isToggle ? TOGGLE_MS : SLIDER_MS;
  const animEasing: "ease-out" | "ease-in-out" = isToggle ? "ease-in-out" : "ease-out";

  // ── Display data: zero hidden series for baseline morphing ──
  const displayData = useMemo(
    () =>
      data.map((point) => {
        const d = { ...point };
        for (const key of SERIES_KEYS) {
          if (!visibleSeries.has(key)) d[key] = 0;
        }
        return d;
      }),
    [data, visibleSeries],
  );

  // ── Stepped opacity fade ──
  const [displayOpacity, setDisplayOpacity] = useState<Record<string, number>>(
    () => Object.fromEntries(SERIES_KEYS.map((k) => [k, visibleSeries.has(k) ? 1 : 0])),
  );
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});

  useEffect(() => {
    for (const key of SERIES_KEYS) {
      const visible = visibleSeries.has(key);
      timersRef.current[key]?.forEach(clearTimeout);
      timersRef.current[key] = [];
      if (visible) {
        // Toggle ON → show immediately (via setTimeout to defer setState out of effect body)
        timersRef.current[key] = [
          setTimeout(
            () => setDisplayOpacity((prev) => (prev[key] === 1 ? prev : { ...prev, [key]: 1 })),
            0,
          ),
        ];
      } else {
        // Toggle OFF → hold visible during morph, then stepped fade-out
        timersRef.current[key] = [
          setTimeout(
            () => setDisplayOpacity((prev) => ({ ...prev, [key]: 0.4 })),
            TOGGLE_MS * 0.65,
          ),
          setTimeout(
            () => setDisplayOpacity((prev) => ({ ...prev, [key]: 0 })),
            TOGGLE_MS,
          ),
        ];
      }
    }
    return () => {
      for (const timers of Object.values(timersRef.current)) timers.forEach(clearTimeout);
      timersRef.current = {};
    };
  }, [visibleSeries]);

  return (
    <div className="px-5 pb-2 pt-1">
      {hasData ? (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={displayData} margin={{ top: 4, right: 6, left: 0, bottom: 32 }}>
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
              tickFormatter={formatCompactCurrency}
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
              content={<ChartTooltip visibleSeries={visibleSeries} />}
              cursor={{ stroke: t.chart.cursor, strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <ReferenceLine yAxisId="left" y={0} stroke={t.chart.gridH} />
            {AREA_CONFIG.map(({ key, yAxisId }, i) => {
              const s = SERIES[key];
              const opacity = displayOpacity[key] ?? 0;
              return (
                <Area
                  key={key}
                  yAxisId={yAxisId}
                  type="monotone"
                  dataKey={key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={s.stroke}
                  fill={`url(#g${key})`}
                  strokeOpacity={opacity}
                  fillOpacity={opacity}
                  animationDuration={animDuration}
                  animationEasing={animEasing}
                  animationBegin={phase === "entrance" ? i * ENTRANCE_STAGGER_MS : 0}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div
          className="flex items-center justify-center text-sm text-fg-primary/20"
          style={{ height }}
        >
          Loading…
        </div>
      )}
    </div>
  );
}
