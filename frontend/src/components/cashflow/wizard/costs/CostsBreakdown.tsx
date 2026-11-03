"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { CashflowState } from "@/hooks/useCashflowState";
import { formatDollars } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Section } from "../loan/parts";
import { SliderInputField } from "../shared";
import { applyEstimate, canEstimate, costsModel, DEFAULT_GROWTH, fillEstimates, type CostLine } from "./model";
import { BasisLine, CostInput, growthChange } from "./parts";

const COLOR: Record<CostLine["key"], string> = {
  council: "var(--color-chart-1)",
  water: "var(--color-chart-2)",
  building: "var(--color-chart-3)",
  landlord: "var(--color-chart-4)",
  maintenance: "var(--color-chart-5)",
  strata: "var(--color-data-neutral)",
};

/**
 * Running Costs, read top to bottom like a bill: the lines, how fast they
 * grow, then the total with a stacked bar that makes the biggest cost obvious
 * (each segment matches its line's dot).
 */
export default function CostsBreakdown({ s }: { s: CashflowState }) {
  const m = costsModel(s);
  const share = (l: CostLine) => (m.annual > 0 ? (l.annual / m.annual) * 100 : 0);
  // "Estimate all" only fills blank lines, so it's done once none are left.
  const anyBlank = m.lines.some((l) => !l.entered && l.estimate > 0);

  return (
    <div className="@container flex flex-col">
      <Section first>
        <BasisLine value={m.value} />
      </Section>

      <Section>
        <div className="mb-4 flex justify-end">
          <Button type="button" variant="outline-action" className="disabled:opacity-40" disabled={!anyBlank} onClick={() => fillEstimates(m.lines)}>
            <Sparkles size={14} aria-hidden="true" />
            Estimate all
          </Button>
        </div>
        <ul className="flex flex-col gap-3">
          {m.lines.map((l) => {
            const id = `bd-${l.key}`;
            return (
              <li key={l.key} className="flex items-center gap-3">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: COLOR[l.key] }} aria-hidden="true" />
                <Label variant="bare" htmlFor={id} className="min-w-0 flex-1 truncate text-[14px] font-medium text-fg-primary">{l.label}</Label>
                {/* Kept in the layout when not needed, so the fields stay aligned. */}
                <Button
                  type="button"
                  variant="link-quiet"
                  onClick={() => applyEstimate(l)}
                  aria-label={`Estimate ${l.label.toLowerCase()}`}
                  className={cn("inline-flex items-center gap-1 text-[12px] hover:text-brand", !canEstimate(l) && "invisible")}
                >
                  <Sparkles size={12} aria-hidden="true" />
                  Estimate
                </Button>
                <CostInput l={l} id={id} className="w-32" />
              </li>
            );
          })}
        </ul>
      </Section>

      <Section>
        <SliderInputField
          label="Cost growth"
          value={s.annualCostGrowthRate}
          onType={growthChange(s)}
          onSlide={(v) => s.setAnnualCostGrowthRate(String(Math.round(v * 10) / 10))}
          min={0}
          max={6}
          step={0.1}
          suffix="%/yr"
          ticks={["0%", "2%", "4%", "6%"]}
          fallback={DEFAULT_GROWTH}
          aside={m.annual > 0 ? <span className="text-[12px] text-fg-muted tabular-nums">{formatDollars(m.inTenYears)} / yr in 10 yrs</span> : null}
        />
      </Section>

      <Section>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
            <div className="flex flex-col gap-1">
              <Label variant="caps" asChild><span>Running costs</span></Label>
              <p className="text-[28px] font-semibold leading-none text-fg-primary tabular-nums">
                {formatDollars(m.annual) || "$0"}
                <span className="ml-1 text-[14px] font-medium text-fg-tertiary">/ yr</span>
              </p>
            </div>
            <p className="text-[13px] text-fg-tertiary tabular-nums">
              {formatDollars(m.monthly) || "$0"} / mo · {formatDollars(m.weekly) || "$0"} / wk
              {m.pctOfValue !== null && <> · {m.pctOfValue.toFixed(2)}% of value</>}
            </p>
          </div>
          <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Share of running costs by line">
            {m.lines.filter((l) => l.annual > 0).map((l) => (
              <div key={l.key} className="h-full transition-[width] duration-300 first:rounded-l-full last:rounded-r-full" style={{ width: `${share(l)}%`, background: COLOR[l.key] }} />
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
