import { formatCurrencyShort } from "@/lib/formatters";
import { t, mix } from "@/lib/theme";
import GlassCard from "@/components/ui/GlassCard";

interface TaxDonutBreakdownProps {
  assessableIncome?: number;
  totalDeductions?: number;
  taxableIncome?: number;
  repaymentIncome?: number;
  mlsIncome?: number;
}

const DONUT_SEGMENTS = [
  { key: "income_tax", label: "Income Tax", color: "#f87171" },
  { key: "medicare_levy", label: "Medicare", color: "#60a5fa" },
  { key: "medicare_levy_surcharge", label: "Medicare Levy Surcharge", color: "#fb923c" },
  { key: "hecs_repayment", label: "HECS Repayment", color: "#a78bfa" },
  { key: "net_income", label: "Net Income", color: "#2dd4bf" },
] as const;

const CARD_STYLE = { borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated };
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

export default function TaxDonutBreakdown({
  assessableIncome = 0, totalDeductions = 0,
  taxableIncome = 0, repaymentIncome = 0, mlsIncome = 0,
}: TaxDonutBreakdownProps) {
  const segments = DONUT_SEGMENTS.map(({ key, label, color }) => ({
    key,
    label,
    color,
    value: DUMMY[key] as number,
  }));

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  // Build stroke-dasharray/offset for each arc (filter out zero-value segments)
  const circumference = 2 * Math.PI * 60; // r=60
  let offset = 0;
  const arcs = segments.filter((s) => s.value > 0).map((s) => {
    const pct = total > 0 ? s.value / total : 0;
    const dash = pct * circumference;
    const arc = { ...s, pct, dash, offset: -offset + circumference * 0.25 };
    offset += dash;
    return arc;
  });

  const totalTax = DUMMY.total_tax;
  const netIncome = DUMMY.net_income;
  const effRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;
  const marginalRate = DUMMY.marginal_rate;

  const taxSegments = segments.filter((s) => s.key !== "net_income");

  return (
    <GlassCard className="flex flex-col items-center px-10 py-6" style={CARD_STYLE}>
      {/* Header */}
      <span className="mb-4 text-[19px] font-semibold uppercase tracking-[0.14em]" style={{ color: mix(t.accent, 50) }}>
        Tax Breakdown
      </span>

      {/* Income measure bars */}
      <div className="flex w-full flex-col gap-3 py-4">
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
      <div className="w-full h-px" style={{ background: t.border.default }} />

      {/* Donut with rate flanks */}
      <div className="flex w-full items-center justify-center gap-6 py-6">
        {/* Left — Effective Rate */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted/40">Effective Tax Rate</span>
          <span className="text-[32px] font-light tabular-nums text-foreground">
            {`${effRate.toFixed(1)}%`}
          </span>
        </div>

        {/* Centre — Donut */}
        <svg viewBox="0 0 160 160" style={{ width: "100%", height: "100%", maxWidth: 240, maxHeight: 240, flexShrink: 0 }}>
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
          {/* Centre text */}
          <text x="80" y="71" textAnchor="middle" className="fill-muted/40 text-[9px] font-semibold uppercase tracking-[0.14em]">
            Total tax
          </text>
          <text x="80" y="93" textAnchor="middle" fill="#f87171" className="text-[16px] font-light tabular-nums">
            {`-${formatCurrencyShort(totalTax)}`}
          </text>
        </svg>

        {/* Right — Marginal Rate */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted/40">Marginal Tax Rate</span>
          <span className="text-[32px] font-light tabular-nums text-foreground">
            {`${(marginalRate * 100).toFixed(0)}%`}
          </span>
        </div>
      </div>

      {/* Breakdown rows */}
      <div className="flex w-full flex-col pt-4">
        {/* Assessable Income */}
        <div className="flex items-center justify-between py-2">
          <span className="text-[15px] font-medium text-foreground">Assessable Income</span>
          <span className="text-[16px] font-medium tabular-nums text-foreground">{formatCurrencyShort(assessableIncome)}</span>
        </div>
        {/* Less: Deductions */}
        <div className="flex items-center justify-between py-2" style={{ opacity: totalDeductions === 0 ? 0.35 : 1 }}>
          <span className="text-[15px] text-muted/50">Less: Allowable Deductions</span>
          <span className="text-[16px] font-medium tabular-nums" style={{ color: "rgba(248,113,113,0.8)" }}>-{formatCurrencyShort(totalDeductions)}</span>
        </div>
        {/* Taxable Income */}
        <div className="my-2 h-px" style={{ background: t.border.default }} />
        <div className="flex items-center justify-between py-2">
          <span className="text-[15px] font-semibold text-foreground">Taxable Income</span>
          <span className="text-[16px] font-semibold tabular-nums text-foreground">{formatCurrencyShort(taxableIncome)}</span>
        </div>
        <div className="my-2 h-px" style={{ background: t.border.default }} />

        {/* Tax components */}
        <div className="flex flex-col gap-3 py-2">
          {taxSegments.map((s) => (
            <div key={s.key} className="flex items-center gap-3" style={{ opacity: s.value === 0 ? 0.35 : 1 }}>
              <span className="h-[13px] w-[13px] shrink-0 rounded-[3px]" style={{ background: s.color }} />
              <span className="flex-1 text-[15px] text-muted/50">{s.label}</span>
              <span className="text-[16px] font-medium tabular-nums" style={{ color: "rgba(248,113,113,0.8)" }}>
                -{formatCurrencyShort(s.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Total Tax */}
        <div className="my-2 h-px" style={{ background: t.border.default }} />
        <div className="flex items-center justify-between py-2">
          <span className="text-[15px] font-semibold" style={{ color: "#f87171" }}>Total Tax</span>
          <span className="text-[16px] font-semibold tabular-nums" style={{ color: "#f87171" }}>-{formatCurrencyShort(totalTax)}</span>
        </div>
        <div className="my-2 h-px" style={{ background: t.border.default }} />

        {/* Net Income */}
        <div className="flex items-center justify-between py-2">
          <span className="text-[15px] font-semibold" style={{ color: "#2dd4bf" }}>Net Income</span>
          <span className="text-[16px] font-semibold tabular-nums" style={{ color: "#2dd4bf" }}>+{formatCurrencyShort(netIncome)}</span>
        </div>
      </div>
    </GlassCard>
  );
}
