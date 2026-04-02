import { useState } from "react";
import { formatCurrencyShort } from "@/lib/formatters";
import { t, mix } from "@/lib/theme";
import GlassCard from "@/components/ui/GlassCard";

// ── Shared constants ─────────────────────────────

const DONUT_SEGMENTS = [
  { key: "income_tax", label: "Income Tax", legendLabel: "Income Tax", color: "#f87171" },
  { key: "medicare_levy", label: "Medicare", legendLabel: "Medicare", color: "#60a5fa" },
  { key: "medicare_levy_surcharge", label: "MLS", legendLabel: "Medicare Levy Surcharge", color: "#fb923c" },
  { key: "hecs_repayment", label: "HECS Repayment", legendLabel: "HECS Repayment", color: "#a78bfa" },
  { key: "net_income", label: "Net Income", legendLabel: "Net Income", color: "#2dd4bf" },
] as const;

const CARD_STYLE = { borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated };

// ── Donut chart ──────────────────────────────────

const GAP = 0.008; // ~0.8% of circumference per gap

function DonutChart({ segments, totalTax, hoveredKey, onHover, onClick, activeSegment }: {
  segments: { key: string; label: string; color: string; value: number }[];
  totalTax: number;
  hoveredKey: string | null;
  onHover: (key: string | null) => void;
  onClick: (key: string) => void;
  activeSegment: { label: string; value: number; pct: string; color: string; isDeduction: boolean } | null;
}) {
  const visible = segments.filter((s) => s.value > 0);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const circumference = 2 * Math.PI * 60;
  const totalGap = visible.length > 1 ? GAP * circumference * visible.length : 0;
  const usable = circumference - totalGap;
  let offset = 0;
  const arcs = visible.map((s) => {
    const pct = total > 0 ? s.value / total : 0;
    const dash = pct * usable;
    const arc = { ...s, pct, dash, offset: -offset + circumference * 0.25 };
    offset += dash + (visible.length > 1 ? GAP * circumference : 0);
    return arc;
  });

  return (
    <svg viewBox="0 0 160 160" style={{ width: 300, height: 300, flexShrink: 0 }}>
      <defs>
        {arcs.map((arc) => (
          <linearGradient key={`grad-${arc.key}`} id={`grad-${arc.key}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={arc.color} stopOpacity="1" />
            <stop offset="100%" stopColor={arc.color} stopOpacity="0.6" />
          </linearGradient>
        ))}
      </defs>
      <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="20" />
      {arcs.map((arc) => {
        const isHovered = hoveredKey === arc.key;
        const isDimmed = hoveredKey != null && !isHovered;
        return (
          <circle
            key={arc.key}
            cx="80"
            cy="80"
            r="60"
            fill="none"
            stroke={`url(#grad-${arc.key})`}
            strokeWidth={isHovered ? 24 : 20}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={arc.offset}
            className="transition-all duration-300 ease-out"
            style={{ transformOrigin: "center", opacity: isDimmed ? 0.3 : 1, cursor: "pointer" }}
            onMouseEnter={() => onHover(arc.key)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick(arc.key)}
          />
        );
      })}
      <text x="80" y={activeSegment ? 68 : 71} textAnchor="middle" className="text-[9px] font-medium uppercase tracking-widest" style={{ transition: "all 0.2s" }} fill={activeSegment ? activeSegment.color : "rgba(161,161,170,0.4)"}>
        {activeSegment ? activeSegment.label : "Total Tax"}
      </text>
      <text x="80" y={activeSegment ? 88 : 93} textAnchor="middle" className="text-[16px] font-semibold tabular-nums" style={{ transition: "all 0.2s" }} fill={activeSegment ? activeSegment.color : "#f87171"}>
        {activeSegment
          ? `${activeSegment.isDeduction && activeSegment.value >= 0 ? "-" : ""}${formatCurrencyShort(Math.abs(activeSegment.value))}`
          : `${totalTax >= 0 ? "-" : "+"}${formatCurrencyShort(Math.abs(totalTax))}`}
      </text>
      {activeSegment && (
        <text x="80" y="103" textAnchor="middle" className="text-[8px] font-medium tabular-nums" fill={activeSegment.color} opacity="0.6">
          {activeSegment.pct}%
        </text>
      )}
    </svg>
  );
}

// ── Legend ────────────────────────────────────────

/* Legend is now rendered inline in the main component */

// ── Waterfall (net position) ─────────────────────

function WaterfallSection({ gross, taxSegments, netIncome, hoveredKey, onHover, onClick }: {
  gross: number;
  taxSegments: { key: string; label: string; color: string; value: number }[];
  netIncome: number;
  hoveredKey: string | null;
  onHover: (key: string | null) => void;
  onClick?: (key: string) => void;
}) {
  if (gross === 0) return null;

  // Separate refunds (negative tax, e.g. franking) from deductions (positive tax)
  const refunds = taxSegments.filter((s) => s.value < 0);
  const deductions = taxSegments.filter((s) => s.value > 0);

  // Baseline extends beyond gross when there are refunds
  const totalRefund = refunds.reduce((sum, s) => sum + Math.abs(s.value), 0);
  const baseline = gross + totalRefund;

  // Refund rows start from gross and extend right
  let refundOffset = gross;
  const refundRows = refunds.map((r) => {
    const absVal = Math.abs(r.value);
    const startPct = (refundOffset / baseline) * 100;
    const widthPct = (absVal / baseline) * 100;
    refundOffset += absVal;
    return { ...r, startPct, widthPct, absVal };
  });

  // Deduction rows eat inward from the right of baseline
  let running = baseline;
  const rows = deductions.map((d) => {
    const startPct = ((running - d.value) / baseline) * 100;
    const widthPct = (d.value / baseline) * 100;
    running -= d.value;
    return { ...d, startPct, widthPct };
  });
  const netPct = (netIncome / baseline) * 100;
  const grossPct = (gross / baseline) * 100;

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Gross Income */}
      <div className="flex items-center gap-3 transition-opacity duration-200" style={{ opacity: hoveredKey != null ? 0.3 : 1 }}>
        <span className="min-w-[120px] text-[15px] font-semibold text-foreground">Gross Income</span>
        <div className="relative flex-1 h-[22px] rounded-[4px]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-[4px] transition-all duration-500"
            style={{
              width: `${grossPct}%`,
              background: mix("var(--color-foreground)", 25),
              border: `1px solid ${mix("var(--color-foreground)", 15)}`,
            }}
          />
        </div>
        <span className="min-w-[80px] text-right text-[16px] font-semibold tabular-nums text-foreground">
          {formatCurrencyShort(gross)}
        </span>
      </div>

      {/* Refund rows (negative tax components shown as income) */}
      {refundRows.map((row) => {
        const isHovered = hoveredKey === row.key;
        const isDimmed = hoveredKey != null && !isHovered;
        return (
          <div
            key={row.key}
            className="flex items-center gap-3 transition-opacity duration-200"
            style={{ opacity: isDimmed ? 0.3 : 1, cursor: "pointer" }}
            onMouseEnter={() => onHover(row.key)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick?.(row.key)}
          >
            <span className="min-w-[120px] text-[15px] text-muted/50">{row.label}</span>
            <div className="relative flex-1 rounded-[4px] transition-all duration-300" style={{ height: isHovered ? 28 : 22, background: "rgba(255,255,255,0.02)" }}>
              <div
                className="absolute inset-y-0 rounded-[4px] transition-all duration-300"
                style={{
                  left: `${row.startPct}%`,
                  width: `${row.widthPct}%`,
                  background: mix(row.color, isHovered ? 40 : 25),
                  border: `1px solid ${mix(row.color, isHovered ? 25 : 15)}`,
                }}
              />
            </div>
            <span className="min-w-[80px] text-right text-[16px] font-medium tabular-nums" style={{ color: row.color }}>
              +{formatCurrencyShort(row.absVal)}
            </span>
          </div>
        );
      })}

      {/* Tax component deductions */}
      {rows.map((row) => {
        const isHovered = hoveredKey === row.key;
        const isDimmed = hoveredKey != null && !isHovered;
        return (
          <div
            key={row.key}
            className="flex items-center gap-3 transition-opacity duration-200"
            style={{ opacity: isDimmed ? 0.3 : 1, cursor: "pointer" }}
            onMouseEnter={() => onHover(row.key)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick?.(row.key)}
          >
            <span className="min-w-[120px] text-[15px] text-muted/50">{row.label}</span>
            <div className="relative flex-1 rounded-[4px] transition-all duration-300" style={{ height: isHovered ? 28 : 22, background: "rgba(255,255,255,0.02)" }}>
              <div
                className="absolute inset-y-0 rounded-[4px] transition-all duration-300"
                style={{
                  left: `${row.startPct}%`,
                  width: `${row.widthPct}%`,
                  background: mix(row.color, isHovered ? 40 : 25),
                  border: `1px solid ${mix(row.color, isHovered ? 25 : 15)}`,
                }}
              />
            </div>
            <span className="min-w-[80px] text-right text-[16px] font-medium tabular-nums" style={{ color: row.color }}>
              -{formatCurrencyShort(row.value)}
            </span>
          </div>
        );
      })}

      {/* Net Income */}
      <div
        className="flex items-center gap-3 transition-opacity duration-200"
        style={{ opacity: hoveredKey != null && hoveredKey !== "net_income" ? 0.3 : 1, cursor: "pointer" }}
        onMouseEnter={() => onHover("net_income")}
        onMouseLeave={() => onHover(null)}
        onClick={() => onClick?.("net_income")}
      >
        <span className="min-w-[120px] text-[15px] font-semibold" style={{ color: t.accent }}>Net Income</span>
        <div className="relative flex-1 rounded-[4px] transition-all duration-300" style={{ height: hoveredKey === "net_income" ? 28 : 22, background: "rgba(255,255,255,0.02)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-[4px] transition-all duration-300"
            style={{
              width: `${netPct}%`,
              background: mix(t.accent, hoveredKey === "net_income" ? 45 : 30),
              border: `1px solid ${mix(t.accent, hoveredKey === "net_income" ? 25 : 15)}`,
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
  effectiveRate?: number;
  marginalRate?: number;
  incomeTax?: number;
  medicareLevy?: number;
  medicareLevySurcharge?: number;
  hecsRepayment?: number;
}

export default function TaxComposition({
  taxableIncome = 0, totalTax, netIncome, effectiveRate, marginalRate,
  incomeTax = 0, medicareLevy = 0, medicareLevySurcharge = 0, hecsRepayment = 0,
}: TaxCompositionProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const activeKey = pinnedKey ?? hoveredKey;

  const handleHover = (key: string | null) => {
    if (pinnedKey == null) setHoveredKey(key);
  };
  const handleClick = (key: string) => {
    setPinnedKey((prev) => (prev === key ? null : key));
  };

  // When income tax is negative (franking refund), fold the refund into net income for the donut
  const refund = incomeTax < 0 ? Math.abs(incomeTax) : 0;
  const donutIncomeTax = incomeTax + refund;  // 0 when negative
  const donutNetIncome = netIncome + refund;

  const taxValues: Record<string, number> = {
    income_tax: donutIncomeTax,
    medicare_levy: medicareLevy,
    medicare_levy_surcharge: medicareLevySurcharge,
    hecs_repayment: hecsRepayment,
    net_income: donutNetIncome,
  };

  const allSegments = DONUT_SEGMENTS.map(({ key, label, legendLabel, color }) => ({
    key, label, legendLabel, color,
    value: taxValues[key] ?? 0,
  }));

  const total = allSegments.reduce((sum, s) => sum + s.value, 0);
  const taxSegments = allSegments.filter((s) => s.key !== "net_income");
  const gross = taxableIncome > 0 ? taxableIncome : totalTax + netIncome;

  // Waterfall uses real (non-donut-adjusted) values so refund bars render correctly
  const realTaxValues: Record<string, number> = {
    income_tax: incomeTax,
    medicare_levy: medicareLevy,
    medicare_levy_surcharge: medicareLevySurcharge,
    hecs_repayment: hecsRepayment,
  };
  const waterfallSegments = DONUT_SEGMENTS
    .filter((s) => s.key !== "net_income")
    .map(({ key, label, color }) => ({ key, label, color, value: realTaxValues[key] ?? 0 }));

  const activeSegData = activeKey ? allSegments.find((s) => s.key === activeKey) : null;
  const activeSegment = activeSegData && total > 0
    ? { label: activeSegData.label, value: activeSegData.value, pct: ((activeSegData.value / total) * 100).toFixed(1), color: activeSegData.color, isDeduction: activeSegData.key !== "net_income" }
    : null;

  return (
    <GlassCard className="flex flex-1 min-h-0 flex-col" style={CARD_STYLE}>
      <div className="custom-scrollbar flex flex-col items-center gap-8 overflow-y-auto px-7 py-5">
        <span
          className="text-[20px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: t.accent }}
        >
          Tax Composition
        </span>

        <div className="flex w-full items-center">
          {/* Rate pills — left */}
          <div className="flex flex-1 flex-col items-end gap-5">
            {effectiveRate != null && marginalRate != null && (
              <>
                <div
                  className="flex flex-col items-center rounded-full px-5 py-2 text-center"
                  style={{ background: mix("#fb923c", 10), border: `1px solid ${mix("#fb923c", 25)}` }}
                >
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: mix("#fb923c", 58) }}>Effective Rate</span>
                  <span className="text-[18px] font-semibold tabular-nums" style={{ color: "#fb923c" }}>{effectiveRate.toFixed(1)}%</span>
                </div>
                <div
                  className="flex flex-col items-center rounded-full px-5 py-2 text-center"
                  style={{ background: mix("#a78bfa", 10), border: `1px solid ${mix("#a78bfa", 25)}` }}
                >
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: mix("#a78bfa", 58) }}>Marginal Rate</span>
                  <span className="text-[18px] font-semibold tabular-nums" style={{ color: "#a78bfa" }}>{marginalRate.toFixed(1)}%</span>
                </div>
              </>
            )}
          </div>

          {/* Donut — centre */}
          <div className="mx-10 shrink-0">
            <DonutChart segments={allSegments} totalTax={totalTax} hoveredKey={activeKey} onHover={handleHover} onClick={handleClick} activeSegment={activeSegment} />
          </div>

          {/* Legend — right */}
          <div className="flex flex-1 flex-col gap-2">
            {allSegments.filter((s) => s.value > 0).map((s) => {
              const isHovered = activeKey === s.key;
              const isDimmed = activeKey != null && !isHovered;
              return (
                <div
                  key={s.key}
                  className="flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-200"
                  style={{
                    opacity: isDimmed ? 0.3 : 1,
                    background: isHovered ? mix(s.color, 8) : "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => handleHover(s.key)}
                  onMouseLeave={() => handleHover(null)}
                  onClick={() => handleClick(s.key)}
                >
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="text-[16px] font-medium text-muted/60">{s.legendLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full h-px" style={{ background: t.border.default }} />

        <WaterfallSection gross={gross} taxSegments={waterfallSegments} netIncome={netIncome} hoveredKey={activeKey} onHover={handleHover} onClick={handleClick} />
      </div>
    </GlassCard>
  );
}
