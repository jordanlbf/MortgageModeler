"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDollars, formatDollarsSigned, parseCurrencyInput } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { DepModel } from "./model";

export const DIV43_COLOR = "var(--color-chart-1)";
export const DIV40_COLOR = "var(--color-chart-2)";

const money = (n: number) => formatDollars(Math.round(n)) || "$0";

/** This year's deduction, with the tax it gets back at the user's marginal rate. */
export function Headline({ m }: { m: DepModel }) {
  const showTaxBack = m.marginalRate > 0 && m.annual > 0;
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
      <div className="flex flex-col gap-1">
        <Label variant="caps" asChild>
          <span>Depreciation this year</span>
        </Label>
        <p className="text-[28px] font-semibold leading-none text-brand tabular-nums">
          {money(m.annual)}
          <span className="ml-1 text-[14px] font-medium text-fg-tertiary">/ yr</span>
        </p>
      </div>
      {showTaxBack && (
        <p className="text-[13px] text-fg-tertiary tabular-nums">
          ≈ {money(m.taxBack)} back at tax time · {Math.round(m.marginalRate * 100)}% rate
        </p>
      )}
    </div>
  );
}

export function BasisLine({ m }: { m: DepModel }) {
  if (!m.isEstimate) {
    return <p className="text-[12px] text-fg-muted">From your figures. Year one deductions; plant & equipment declines each year.</p>;
  }
  if (m.anchorPrice <= 0) {
    return <p className="text-[12px] text-fg-muted">Add a purchase price in Property Setup to estimate depreciation.</p>;
  }
  return (
    <p className="text-[12px] text-fg-muted tabular-nums">
      Estimated from the {formatDollarsSigned(m.anchorPrice)} purchase price ({m.estYear}) using typical ATO rates.
    </p>
  );
}

export function MoneyField({ id, value, onValue, ariaLabel, placeholder = "$0", className }: { id: string; value: number; onValue: (n: number) => void; ariaLabel: string; placeholder?: string; className?: string }) {
  return (
    <Input
      id={id}
      variant="filled"
      inputMode="numeric"
      value={value > 0 ? formatDollarsSigned(Math.round(value)) : ""}
      onChange={(e) => onValue(parseCurrencyInput(e.target.value))}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={cn("h-9 w-32 text-right text-[14px] font-semibold tabular-nums", className)}
    />
  );
}
