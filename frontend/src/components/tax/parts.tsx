"use client";

import type { TaxState } from "@/hooks/useTaxState";
import { Skeleton } from "@/components/ui/skeleton";

/** Announces updates to screen readers. */
export function LiveStatus({ tax }: { tax: TaxState }) {
  return (
    <p className="sr-only" aria-live="polite">
      {tax.error ? "Couldn't update" : tax.loading ? "Updating" : tax.results ? "Up to date" : ""}
    </p>
  );
}

/** Before the first figures: what to do, or what's happening. Skeleton lines hold the shape while loading. */
export function Waiting({ tax, prompt }: { tax: TaxState; prompt: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-[15px] font-medium text-fg-primary">
          {tax.error ? "Your figures will show here once it's working again." : tax.loading ? "Working out your tax…" : prompt}
        </p>
        {!tax.error && !tax.loading && (
          <p className="text-[13px] text-fg-tertiary">Add rent, other income and deductions for the full picture. It updates as you type.</p>
        )}
      </div>
      {tax.loading && (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-10 w-48" />
          {[90, 75, 60].map((w) => (
            <Skeleton key={w} className="h-4" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}

/** A colour swatch for a legend or row label. */
export function Swatch({ color }: { color: string }) {
  return <span aria-hidden="true" className="size-2 shrink-0 rounded-[3px]" style={{ background: color }} />;
}
