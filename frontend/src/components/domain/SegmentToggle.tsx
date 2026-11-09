"use client";

import type { ReactNode } from "react";
import { cn } from "cn";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * A small segmented choice: one option always on, filled with the brand
 * colour (the `solid` toggle). Used for every "show as" or "per period"
 * switch (Cashflow's Overview/Details, Tax's Week/Fortnight/Month/Year,
 * Amortisation's repayment frequency and Chart/Table), so they all match.
 */
export default function SegmentToggle<V extends string>({
  value,
  onChange,
  options,
  className,
  ...aria
}: {
  value: V;
  onChange: (v: V) => void;
  options: readonly { value: V; label: ReactNode }[];
  className?: string;
} & ({ "aria-label": string } | { "aria-labelledby": string })) {
  return (
    <ToggleGroup
      type="single"
      variant="solid"
      value={value}
      // Radix deselects on a second click; keep the current choice instead.
      onValueChange={(v) => { if (v) onChange(v as V); }}
      className={cn("flex gap-1.5", className)}
      {...aria}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} className="px-3 py-1.5 text-xs">
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
