"use client";

import Stat from "@/components/patterns/Stat";
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
    <Stat label="Cash needed" labelAs="h2" labelId="pc-cash-needed" size="hero" value={<Money value={total} />}>
      {total === null && <p className="text-[13px] text-fg-tertiary">Enter a purchase price to see your estimate</p>}
      {children && <div className="mt-4">{children}</div>}
    </Stat>
  );
}
