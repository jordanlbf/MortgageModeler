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

const INCOME_MEASURES = [
  { label: "Taxable Income", field: "taxableIncome" as const, color: t.accent },
  { label: "HECS Repayment Income", field: "repaymentIncome" as const, color: "#a78bfa" },
  { label: "MLS Income", field: "mlsIncome" as const, color: "#fb923c" },
];

// TODO: replace dummy data with API response
const DUMMY = {
  income_tax: 24_967,
  medicare_levy: 2_000,
  medicare_levy_surcharge: 0,
  hecs_repayment: 0,
  total_tax: 26_967,
  net_income: 73_033,
  marginal_rate: 0.345,
};

const CARD_STYLE = { borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated };
const SECTION_TITLE = "w-full text-[13px] font-bold uppercase tracking-[0.16em]";

// ── Section title ────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <span className={SECTION_TITLE} style={{ color: mix(t.accent, 50) }}>
      {children}
    </span>
  );
}

// ── Section divider ──────────────────────────────

function Divider() {
  return <div className="w-full h-px" style={{ background: t.border.default }} />;
}

// ── Section 1: Income Measures ───────────────────

function IncomeMeasuresSection({ taxableIncome, repaymentIncome, mlsIncome }: {
  taxableIncome: number;
  repaymentIncome: number;
  mlsIncome: number;
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      {INCOME_MEASURES.map(({ label, field, color }) => {
        const val = { taxableIncome, repaymentIncome, mlsIncome }[field];
        const pct = Math.min((val / 500_000) * 100, 100);
        return (
          <div key={field}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[15px] text-muted/50">{label}</span>
              <span className="text-[16px] font-medium tabular-nums text-foreground">
                {formatCurrencyShort(val)}
              </span>
            </div>
            <div className="relative h-[5px] rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: mix(color, 50) }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Rate gauge ───────────────────────────────────

const GAUGE_R = 76;
const GAUGE_STROKE = 14;
const GAUGE_HALF = Math.PI * GAUGE_R;

function RateGauge({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(value / 100, 1);
  const filled = (1 - pct) * GAUGE_HALF;
  const viewW = (GAUGE_R + GAUGE_STROKE) * 2;
  const viewH = GAUGE_R + GAUGE_STROKE + 4;
  const cx = viewW / 2;
  const cy = GAUGE_R + GAUGE_STROKE;

  return (
    <div className="flex flex-col items-center" style={{ minWidth: 90 }}>
      <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted/40 mb-3">{label}</span>
      <svg viewBox={`0 0 ${viewW} ${viewH}`} width={viewW} height={viewH}>
        <path
          d={`M ${cx - GAUGE_R} ${cy} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${cx + GAUGE_R} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={GAUGE_STROKE}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - GAUGE_R} ${cy} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${cx + GAUGE_R} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={GAUGE_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${GAUGE_HALF - filled}`}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="text-[22px] font-light tabular-nums text-foreground -mt-2">
        {`${value.toFixed(1)}%`}
      </span>
    </div>
  );
}

// ── Section 2: Tax Composition ───────────────────

interface TaxCompositionProps {
  segments: { key: string; label: string; color: string; value: number }[];
  totalTax: number;
  effRate: number;
  marginalRate: number;
}

function TaxCompositionSection({ segments, totalTax, effRate, marginalRate }: TaxCompositionProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const circumference = 2 * Math.PI * 60;
  let offset = 0;
  const arcs = segments.filter((s) => s.value > 0).map((s) => {
    const pct = total > 0 ? s.value / total : 0;
    const dash = pct * circumference;
    const arc = { ...s, pct, dash, offset: -offset + circumference * 0.25 };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-center gap-[108px]">
        <RateGauge label="Effective Tax Rate" value={effRate} color="#fb923c" />

        <svg viewBox="0 0 160 160" style={{ width: "100%", height: "100%", maxWidth: 280, maxHeight: 280, flexShrink: 0 }}>
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

        <RateGauge label="Marginal Tax Rate" value={marginalRate * 100} color="#f87171" />
      </div>
    </div>
  );
}

// ── Section 3: Net Position (waterfall) ──────────

interface NetPositionProps {
  gross: number;
  taxSegments: { key: string; label: string; color: string; value: number }[];
  netIncome: number;
}

function NetPositionSection({ gross, taxSegments, netIncome }: NetPositionProps) {
  if (gross === 0) return null;

  const deductions = taxSegments
    .filter((s) => s.value > 0)
    .map((s) => ({ label: s.label, value: s.value, color: s.color }));

  let running = gross;
  const rows = deductions.map((d) => {
    const startPct = ((running - d.value) / gross) * 100;
    const widthPct = (d.value / gross) * 100;
    running -= d.value;
    return { ...d, startPct, widthPct };
  });

  const netPct = (netIncome / gross) * 100;

  return (
    <div className="flex w-full flex-col gap-4">
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
    </div>
  );
}

// ── Main component ───────────────────────────────

interface TaxDonutBreakdownProps {
  taxableIncome?: number;
  repaymentIncome?: number;
  mlsIncome?: number;
}

export default function TaxDonutBreakdown({
  taxableIncome = 0, repaymentIncome = 0, mlsIncome = 0,
}: TaxDonutBreakdownProps) {
  const segments = DONUT_SEGMENTS.map(({ key, label, color }) => ({
    key, label, color,
    value: DUMMY[key] as number,
  }));

  const totalTax = DUMMY.total_tax;
  const netIncome = DUMMY.net_income;
  const effRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;
  const marginalRate = DUMMY.marginal_rate;
  const taxSegments = segments.filter((s) => s.key !== "net_income");
  const gross = taxableIncome > 0 ? taxableIncome : totalTax + netIncome;

  return (
    <GlassCard className="flex flex-1 flex-col items-center px-10 py-6" style={CARD_STYLE}>
      <span className="mb-8 text-[22px] font-semibold uppercase tracking-[0.14em]" style={{ color: mix(t.accent, 50) }}>
        Tax Breakdown
      </span>

      <div className="flex w-full flex-col gap-10">
        <IncomeMeasuresSection
          taxableIncome={taxableIncome}
          repaymentIncome={repaymentIncome}
          mlsIncome={mlsIncome}
        />

        <Divider />

        <TaxCompositionSection
          segments={segments}
          totalTax={totalTax}
          effRate={effRate}
          marginalRate={marginalRate}
        />

        <Divider />

        <NetPositionSection
          gross={gross}
          taxSegments={taxSegments}
          netIncome={netIncome}
        />
      </div>
    </GlassCard>
  );
}
