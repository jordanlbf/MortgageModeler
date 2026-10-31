"use client";

import { Label } from "@/components/ui/label";
import { Money } from "./shared";

/** The hero number: cash needed, then `children` (the donut legend). Before an estimate, a one-line prompt. */
export default function CashNeededHero({
  total,
  children,
}: {
  total: number | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label variant="caps" asChild><h2 id="pc-cash-needed">Cash needed</h2></Label>
      <div className="text-[44px] leading-none font-semibold tracking-[-0.03em] tabular-nums text-fg-primary">
        <Money value={total} />
      </div>
      {total === null && <p className="text-[13px] text-fg-tertiary">Enter a purchase price to see your estimate</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
