import type { TaxBreakdownResponse } from "@/lib/api";
import { formatCurrencyShort } from "@/lib/formatters";
import { t, mix } from "@/lib/theme";
import GlassCard from "@/components/ui/GlassCard";

interface TaxBreakdownProps {
  data: TaxBreakdownResponse | null;
  gross: number;
  effRate: number;
  marginalRate: number;
  monthly: number;
}

const DEDUCTIONS = [
  { key: "income_tax", label: "Income Tax", color: "#f87171" },
  { key: "medicare_levy", label: "Medicare Levy", color: "#60a5fa" },
  { key: "medicare_levy_surcharge", label: "Medicare Surcharge", color: "#fb923c" },
  { key: "hecs_repayment", label: "HECS Repayment", color: "#a78bfa" },
] as const;

const DONUT_SEGMENTS = [
  { key: "income_tax", label: "Income Tax", color: "#f87171" },
  { key: "medicare_levy", label: "Medicare", color: "#60a5fa" },
  { key: "medicare_levy_surcharge", label: "MLS", color: "#fb923c" },
  { key: "hecs_repayment", label: "HECS", color: "#a78bfa" },
  { key: "net_income", label: "Net Income", color: "#2dd4bf" },
] as const;

const CARD_BORDER = { borderTopWidth: 3, borderTopColor: t.accentBorder };

// ── Progress bars ────────────────────────────

function ProgressBars({ data, gross }: { data: TaxBreakdownResponse | null; gross: number }) {
  return (
    <GlassCard className="flex h-full min-h-0 flex-col justify-evenly overflow-hidden px-7" style={CARD_BORDER}>
      {DEDUCTIONS.map(({ key, label, color }) => {
        const value = data ? (data[key] as number) : 0;
        const pct = gross > 0 ? Math.min((value / gross) * 100 * 3, 100) : 0;
        return (
          <div key={key} className="flex items-center gap-5">
            <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: color }} />
            <span className="w-[155px] shrink-0 text-[13px] font-medium text-muted/50">{label}</span>
            <div className="relative flex-1 h-[10px] rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className="w-[95px] shrink-0 text-right text-[15px] tabular-nums text-foreground/70">
              {data ? formatCurrencyShort(value) : "—"}
            </span>
          </div>
        );
      })}
    </GlassCard>
  );
}

// ── Donut chart ──────────────────────────────

function DonutChart({ data, gross, effRate, marginalRate, monthly }: TaxBreakdownProps) {
  const segments = DONUT_SEGMENTS
    .map(({ key, label, color }) => ({
      label,
      color,
      value: data ? (data[key] as number) : 0,
    }))
    .filter((s) => s.value > 0);

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  // Build stroke-dasharray/offset for each arc
  const circumference = 2 * Math.PI * 60; // r=60
  let offset = 0;
  const arcs = segments.map((s) => {
    const pct = total > 0 ? s.value / total : 0;
    const dash = pct * circumference;
    const arc = { ...s, pct, dash, offset: -offset + circumference * 0.25 };
    offset += dash;
    return arc;
  });

  return (
    <GlassCard className="flex h-full items-center justify-center gap-10 px-10 py-6" style={CARD_BORDER}>
      {/* Left — Effective rate */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted/40">Effective</span>
        <span className="text-[32px] font-light tabular-nums text-foreground">
          {data ? `${effRate.toFixed(1)}%` : "—"}
        </span>
      </div>

      {/* Center — SVG donut */}
      <div className="flex shrink items-center justify-center" style={{ aspectRatio: "1/1", height: "100%", maxHeight: 240 }}>
        <svg viewBox="0 0 160 160" className="h-full w-full">
          <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="20" />
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx="80"
              cy="80"
              r="60"
              fill="none"
              stroke={arc.color}
              strokeWidth="20"
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={arc.offset}
              className="transition-all duration-500 ease-out"
              style={{ transformOrigin: "center" }}
            />
          ))}
        </svg>
      </div>

      {/* Right — Marginal rate */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted/40">Marginal</span>
        <span className="text-[32px] font-light tabular-nums text-foreground">
          {data ? `${(marginalRate * 100).toFixed(0)}%` : "—"}
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="h-[11px] w-[11px] shrink-0 rounded-[3px]" style={{ background: s.color }} />
            <span className="w-[120px] text-[13px] text-muted/50">{s.label}</span>
            <span className="text-[14px] font-medium tabular-nums text-foreground">{formatCurrencyShort(s.value)}</span>
            <span className="text-[12px] tabular-nums text-muted/30">
              {gross > 0 ? `${((s.value / gross) * 100).toFixed(1)}%` : "—"}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export { ProgressBars, DonutChart };
