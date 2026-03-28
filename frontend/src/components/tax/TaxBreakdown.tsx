import { formatCurrencyShort } from "@/lib/formatters";
import { t, mix } from "@/lib/theme";
import GlassCard from "@/components/ui/GlassCard";

// ── Shared constants ─────────────────────────────

const DONUT_SEGMENTS = [
  { key: "income_tax", label: "Income Tax", color: "#f87171" },
  { key: "medicare_levy", label: "Medicare", color: "#60a5fa" },
  { key: "medicare_levy_surcharge", label: "Medicare Levy Surcharge", color: "#fb923c" },
  { key: "hecs_repayment", label: "HECS Repayment", color: "#a78bfa" },
  { key: "net_income", label: "Net Income", color: "#2dd4bf" },
] as const;

// TODO: replace with API response
const DUMMY: Record<string, number> = {
  income_tax: 24_967,
  medicare_levy: 2_000,
  medicare_levy_surcharge: 0,
  hecs_repayment: 0,
};

const CARD_STYLE = { borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated };

// ── Donut chart ──────────────────────────────────

function DonutChart({ segments, totalTax }: {
  segments: { label: string; color: string; value: number }[];
  totalTax: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const circumference = 2 * Math.PI * 60;
  let offset = 0;
  const arcs = segments.filter((s) => s.value > 0).map((s) => {
    const pct = total > 0 ? s.value / total : 0;
    const dash = pct * circumference;
    const arc = { ...s, dash, offset: -offset + circumference * 0.25 };
    offset += dash;
    return arc;
  });

  return (
    <svg viewBox="0 0 160 160" style={{ width: 200, height: 200, flexShrink: 0 }}>
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
      <text x="80" y="71" textAnchor="middle" className="fill-muted/40 text-[9px] font-semibold uppercase tracking-[0.14em]">
        Total tax
      </text>
      <text x="80" y="93" textAnchor="middle" fill="#f87171" className="text-[16px] font-light tabular-nums">
        {`-${formatCurrencyShort(totalTax)}`}
      </text>
    </svg>
  );
}

// ── Legend dots ───────────────────────────────────

function LegendDots({ segments }: { segments: { label: string; color: string; value: number }[] }) {
  const visible = segments.filter((s) => s.value > 0);
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {visible.map((s) => (
        <div key={s.label} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: s.color }} />
          <span className="text-[12px] text-muted/50">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Waterfall (net position) ─────────────────────

function WaterfallSection({ gross, taxSegments, netIncome }: {
  gross: number;
  taxSegments: { label: string; color: string; value: number }[];
  netIncome: number;
}) {
  if (gross === 0) return null;

  const deductions = taxSegments.filter((s) => s.value > 0);
  let running = gross;
  const rows = deductions.map((d) => {
    const startPct = ((running - d.value) / gross) * 100;
    const widthPct = (d.value / gross) * 100;
    running -= d.value;
    return { ...d, startPct, widthPct };
  });
  const netPct = (netIncome / gross) * 100;

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Gross Income */}
      <div className="flex items-center gap-3">
        <span className="min-w-[120px] text-[15px] font-semibold text-foreground">Gross Income</span>
        <div className="relative flex-1 h-[22px] rounded-[4px]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-[4px] transition-all duration-500"
            style={{
              width: "100%",
              background: mix("var(--color-foreground)", 25),
              border: `1px solid ${mix("var(--color-foreground)", 15)}`,
            }}
          />
        </div>
        <span className="min-w-[80px] text-right text-[16px] font-semibold tabular-nums text-foreground">
          {formatCurrencyShort(gross)}
        </span>
      </div>

      {/* Tax component deductions */}
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="min-w-[120px] text-[15px] text-muted/50">{row.label}</span>
          <div className="relative flex-1 h-[22px] rounded-[4px]" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div
              className="absolute inset-y-0 rounded-[4px] transition-all duration-500"
              style={{
                left: `${row.startPct}%`,
                width: `${row.widthPct}%`,
                background: mix(row.color, 25),
                border: `1px solid ${mix(row.color, 15)}`,
              }}
            />
          </div>
          <span className="min-w-[80px] text-right text-[16px] font-medium tabular-nums" style={{ color: row.color }}>
            -{formatCurrencyShort(row.value)}
          </span>
        </div>
      ))}

      {/* Net Income */}
      <div className="flex items-center gap-3">
        <span className="min-w-[120px] text-[15px] font-semibold" style={{ color: t.accent }}>Net Income</span>
        <div className="relative flex-1 h-[22px] rounded-[4px]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-[4px] transition-all duration-500"
            style={{
              width: `${netPct}%`,
              background: mix(t.accent, 30),
              border: `1px solid ${mix(t.accent, 15)}`,
            }}
          />
        </div>
        <span className="min-w-[80px] text-right text-[16px] font-semibold tabular-nums" style={{ color: t.accent }}>
          {formatCurrencyShort(netIncome)}
        </span>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────

interface TaxCompositionProps {
  taxableIncome?: number;
  totalTax: number;
  netIncome: number;
}

export default function TaxComposition({
  taxableIncome = 0, totalTax, netIncome,
}: TaxCompositionProps) {
  const allSegments = DONUT_SEGMENTS.map(({ key, label, color }) => ({
    key, label, color,
    value: key === "net_income" ? netIncome : (DUMMY[key] ?? 0),
  }));

  const taxSegments = allSegments.filter((s) => s.key !== "net_income");
  const gross = taxableIncome > 0 ? taxableIncome : totalTax + netIncome;

  return (
    <GlassCard className="flex flex-1 min-h-0 flex-col" style={CARD_STYLE}>
      <div className="custom-scrollbar flex flex-col items-center gap-8 overflow-y-auto px-7 py-5">
        <span
          className="text-[20px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: mix(t.accent, 50) }}
        >
          Tax Composition
        </span>

        <DonutChart segments={allSegments} totalTax={totalTax} />
        <LegendDots segments={allSegments} />

        <div className="w-full h-px" style={{ background: t.border.default }} />

        <WaterfallSection gross={gross} taxSegments={taxSegments} netIncome={netIncome} />
      </div>
    </GlassCard>
  );
}
