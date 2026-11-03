"use client";

import { Input } from "@/components/ui/input";
import type { CashflowState } from "@/hooks/useCashflowState";
import { formatDollars } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { CostLine } from "./model";
import { lineChange, linePlaceholder } from "./model";

/** Right-aligned compact field for one cost line, in its own unit. */
export function CostInput({ l, id, className }: { l: CostLine; id?: string; className?: string }) {
  const suffix = l.kind === "percent" ? "%" : l.kind === "quarterly" ? "/qtr" : undefined;
  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        variant="filled"
        inputMode="numeric"
        aria-label={id ? undefined : l.label}
        value={l.entered}
        onChange={lineChange(l)}
        placeholder={linePlaceholder(l)}
        className={cn("h-9 w-full text-right text-[14px] font-semibold tabular-nums", suffix && "pr-11")}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-fg-tertiary">{suffix}</span>
      )}
    </div>
  );
}

/** "Est." / "Yours" provenance of a line's value; nothing for an empty field. */
export function SourceTag({ source }: { source: "estimate" | "own" | "empty" }) {
  const edited = source === "own";
  return (
    <span
      aria-hidden={source === "empty" || undefined}
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        // Keeps its width so the column stays aligned.
        source === "empty" && "invisible",
        edited ? "bg-brand/12 text-brand" : "bg-surface-subtle text-fg-muted",
      )}
    >
      {edited ? "Yours" : "Est."}
    </span>
  );
}

/** Context line: how to fill in the lines, and where the estimates come from. */
export function BasisLine({ value }: { value: number }) {
  return (
    <p className="text-[13px] text-fg-tertiary">
      Enter what you pay each year, or estimate each line
      {value > 0 && (
        <>
          {" "}from the <span className="font-semibold text-fg-primary tabular-nums">{formatDollars(value)}</span> price
        </>
      )}
      . Leave a line blank if it doesn&apos;t apply.
    </p>
  );
}

export const growthChange = (s: CashflowState) => (e: React.ChangeEvent<HTMLInputElement>) =>
  s.setAnnualCostGrowthRate(e.target.value.replace(/[^\d.]/g, "").slice(0, 4));
