"use client";

import type { TaxState } from "@/hooks/useTaxState";
import Stat from "@/components/patterns/blocks/Stat";
import SectionCard from "@/components/patterns/cards/SectionCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "cn";
import { KPI_COLORS, money, netParts, pct, perLabel, PERIODS, type ItemSum, type Period } from "./items";
import { LiveStatus, Waiting } from "./parts";

/** Which pay period every figure on the page is shown for. */
function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <ToggleGroup
      type="single"
      variant="segment"
      aria-label="Show amounts per"
      value={value}
      onValueChange={(v) => v && onChange(v as Period)}
      className="flex gap-1"
    >
      {PERIODS.map((x) => (
        <ToggleGroupItem key={x.value} value={x.value} className="px-2.5 py-1">
          {x.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function Bracket({ grow, color, label, align }: { grow: number; color: string; label: string; align: "start" | "end" }) {
  return (
    <span className={cn("flex min-w-0 flex-col gap-1.5", align === "end" && "items-end text-right")} style={{ flexGrow: grow, flexBasis: 0 }}>
      <span className="text-[12px] font-semibold whitespace-nowrap tabular-nums" style={{ color }}>
        {label}
      </span>
      <span aria-hidden="true" className="h-2 w-full rounded-t-sm border-x-2 border-t-2" style={{ borderColor: color }} />
    </span>
  );
}

/** What you keep and what you pay, the bar they split, and the average rate drawn over the tax part of it. */
function TakeHome({ s, per, unit }: { s: ItemSum; per: number; unit: string }) {
  const parts = netParts(s);
  const taxTotal = parts.reduce((a, p) => a + (p.key === "kept" ? 0 : p.amount), 0);
  const kept = Math.max(0, s.kept);
  const refund = s.total < 0;
  const each = perLabel(unit);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <Stat label={`You keep ${each}`} value={money(s.kept / per)} size="hero" tone="positive" />
        <Stat label={`${refund ? "Refund" : "You pay in tax"} ${each}`} value={money(Math.abs(s.total) / per)} size="lg" tone={refund ? "positive" : "negative"} className="items-end text-right" />
      </div>

      <div className="flex flex-col gap-1.5">
        {taxTotal > 0 && s.taxable > 0 && (
          <div className="flex gap-[3px]" aria-hidden="true">
            <Bracket grow={kept} color={KPI_COLORS.kept} label={`${pct(kept / s.taxable)} kept`} align="start" />
            <Bracket grow={taxTotal} color={KPI_COLORS.rate} label={`${pct(s.avgRate)} average rate`} align="end" />
          </div>
        )}
        <span
          role="img"
          aria-label={parts.map((p) => `${p.label} ${money(p.amount / per)} ${each}`).join(", ")}
          className="flex h-12 gap-[3px] overflow-hidden rounded-lg"
        >
          {parts.map((p) => (
            <span
              key={p.key}
              className="transition-[flex-grow] duration-300 first:rounded-l-lg last:rounded-r-lg"
              style={{ flexGrow: p.amount, flexBasis: 0, background: p.color }}
            />
          ))}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[12.5px] text-fg-tertiary">
        <p>
          Taxable income <span className="font-semibold text-fg-secondary tabular-nums">{money(s.taxable / per)}</span> {each}
        </p>
        <p>
          Your top rate is <span className="font-semibold text-fg-secondary tabular-nums">{pct(s.topRate, 0)}</span>, on your last dollars only.
        </p>
      </div>
    </div>
  );
}

export default function TaxTakeHomeCard({
  tax,
  s,
  period,
  onPeriodChange,
  per,
  unit,
  className,
}: {
  tax: TaxState;
  s: ItemSum | null;
  period: Period;
  onPeriodChange: (p: Period) => void;
  per: number;
  unit: string;
  className?: string;
}) {
  return (
    <SectionCard
      title="Tax Calculator"
      titleAs="h1"
      titleId="tax-title"
      action={s && <PeriodToggle value={period} onChange={onPeriodChange} />}
      className={cn("@container", className)}>
      <LiveStatus tax={tax} />
      {s ? <TakeHome s={s} per={per} unit={unit} /> : <Waiting tax={tax} prompt="Enter your salary to see what you keep and what you pay." />}
    </SectionCard>
  );
}
