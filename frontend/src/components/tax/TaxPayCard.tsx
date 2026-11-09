"use client";

import SectionCard from "@/components/patterns/cards/SectionCard";
import { TAX_YEAR } from "@/lib/tax-brackets";
import { t } from "@/lib/theme";
import { cn } from "cn";
import { KPI_COLORS, money, tint, type ItemSum } from "./items";
import { Swatch } from "./parts";

const ROW = "grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_6rem] items-center gap-x-4 @min-[40rem]:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_7rem]";

/** Taxable income as a full bar, with each tax cut off the end in its own colour until only take-home is left. */
function PayBar({ s, per, unit }: { s: ItemSum; per: number; unit: string }) {
  const pay = s.taxable / per;
  // Each step starts where the previous one left off.
  const steps = s.charged.map((x, i) => {
    const amt = x.amount / per;
    const before = pay - s.charged.slice(0, i).reduce((a, y) => a + y.amount / per, 0);
    return { ...x, amt, before, after: before - amt };
  });
  const hi = Math.max(1, pay, ...steps.map((x) => x.before));
  const w = (v: number) => (Math.max(0, v) / hi) * 100;
  const share = (v: number) => (pay > 0 ? `${((v / pay) * 100).toFixed(1)}%` : "0%");

  return (
    <ol className="flex flex-col gap-1" aria-label={`Your taxable income a ${unit}, less each tax`}>
      <li className={cn(ROW, "py-2")}>
        <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-fg-primary">
          <Swatch color={KPI_COLORS.taxable} />
          Taxable income a {unit}
        </span>
        <span aria-hidden="true" className="flex h-9 overflow-hidden rounded-lg bg-surface-subtle">
          <span className="rounded-lg transition-[width] duration-300" style={{ width: `${w(pay)}%`, background: KPI_COLORS.taxable }} />
        </span>
        <span className="text-right text-[15px] font-semibold text-fg-primary tabular-nums">{money(pay)}</span>
      </li>

      {steps.map((x) => {
        const back = x.amt < 0;
        const segL = w(Math.min(x.before, x.after));
        const segW = Math.max(0.5, Math.abs(w(x.before) - w(x.after)));
        return (
          <li key={x.key} className={cn(ROW, "py-1.5")}>
            <span className="flex min-w-0 flex-col">
              <span className="inline-flex items-center gap-2 text-[13px] text-fg-secondary">
                <Swatch color={x.color} />
                <span className="truncate">{x.label}</span>
              </span>
              <span className="pl-4 text-[11px] text-fg-muted tabular-nums">{back ? "Back to you" : `${share(x.amt)} of taxable income`}</span>
            </span>
            <span aria-hidden="true" className="relative h-6 rounded-md">
              <span className="absolute inset-y-0 left-0 rounded-l-md transition-[width] duration-300" style={{ width: `${segL}%`, background: tint(KPI_COLORS.taxable, 14) }} />
              <span
                className="absolute inset-y-0 rounded-md transition-[left,width] duration-300"
                style={{ left: `${segL}%`, width: `${segW}%`, background: back ? tint(x.color, 25) : x.color, boxShadow: back ? `inset 0 0 0 1.5px ${x.color}` : undefined }}
              />
            </span>
            <span className="text-right text-[13.5px] font-semibold tabular-nums" style={{ color: back ? t.data.positive : x.color }}>
              <span aria-hidden="true">{back ? "+" : "−"}</span>
              <span className="sr-only">{back ? "plus " : "minus "}</span>
              {money(Math.abs(x.amt))}
            </span>
          </li>
        );
      })}

      <li className={cn(ROW, "mt-1 border-t border-border-default pt-3")}>
        <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-fg-primary">
          <Swatch color={KPI_COLORS.kept} />
          Take-home a {unit}
        </span>
        <span aria-hidden="true" className="flex h-9 overflow-hidden rounded-lg bg-surface-subtle">
          <span className="rounded-lg transition-[width] duration-300" style={{ width: `${w(s.kept / per)}%`, background: KPI_COLORS.kept }} />
        </span>
        <span className="text-right text-[17px] font-semibold tabular-nums" style={{ color: KPI_COLORS.kept }}>
          {money(s.kept / per)}
        </span>
      </li>
    </ol>
  );
}

/** Taxes that don't apply at this income, so their absence is still explained. */
function NotCharged({ s }: { s: ItemSum }) {
  if (s.notCharged.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px]">
      <span className="text-fg-muted">Not charged:</span>
      {s.notCharged.map((x) => (
        <span
          key={x.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-fg-tertiary"
          style={{ borderColor: tint(x.color, 50) }}
        >
          <Swatch color={tint(x.color, 55)} />
          {x.short}
          <span className="text-fg-muted">· {x.note}</span>
        </span>
      ))}
    </div>
  );
}

export default function TaxPayCard({
  s,
  per,
  unit,
  className,
}: {
  s: ItemSum;
  per: number;
  unit: string;
  className?: string;
}) {
  return (
    <SectionCard
      title="Your income, less each tax"
      description={`Each tax is cut from your taxable income in its own colour. Australian resident rates, ${TAX_YEAR}.`}
      className={cn("@container", className)}
    >
      <div className="flex flex-col gap-6">
        <PayBar s={s} per={per} unit={unit} />
        <NotCharged s={s} />
      </div>
    </SectionCard>
  );
}
