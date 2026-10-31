"use client";

import { formatDollars } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { LMI_THRESHOLD, Money, lvrColor } from "./shared";

/** One key–value row. */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col py-2.5 first:pt-0 last:pb-0 @min-[30rem]:py-0 @min-[44rem]:py-2.5">
      <div className="flex items-center gap-3">
        <dt className="flex-1 text-[12.5px] text-fg-tertiary">{label}</dt>
        <dd className="shrink-0 text-[14px] font-semibold tabular-nums text-fg-primary">{value}</dd>
      </div>
    </div>
  );
}

/**
 * Loan, LVR (a pill coloured by LVR band) and LMI as a compact list with
 * hairline dividers. A column when the card is wide; three side by side when it's
 * narrower.
 */
export default function StatTiles({
  loanAmount,
  lvr,
  lmi,
}: {
  loanAmount: number | null;
  lvr: number | null;
  /** LMI payable; null before there's an estimate. */
  lmi: number | null;
}) {
  return (
    <dl
      className={
        "grid grid-cols-1 divide-y divide-border-subtle " +
        "@min-[30rem]:grid-cols-3 @min-[30rem]:gap-8 @min-[30rem]:divide-y-0 " +
        "@min-[44rem]:grid-cols-1 @min-[44rem]:gap-0 @min-[44rem]:divide-y"
      }
    >
      <Row label="Loan" value={<Money value={loanAmount} />} />
      <Row
        label="LVR"
        value={
          lvr === null ? (
            <span className="text-fg-muted">—</span>
          ) : (
            <Badge
              variant="soft"
              className="px-2 py-1 text-[12.5px] font-semibold"
              style={{ "--badge-accent": lvrColor(lvr) } as React.CSSProperties}
              title={lvr > LMI_THRESHOLD ? "Above 80%: mortgage insurance applies" : "80% or less: no mortgage insurance"}
            >
              {(lvr * 100).toFixed(1)}%
            </Badge>
          )
        }
      />
      <Row
        label="LMI"
        value={lmi === null ? <span className="text-fg-muted">—</span> : lmi > 0 ? formatDollars(lmi) : <span className="text-data-positive">None</span>}
      />
    </dl>
  );
}
