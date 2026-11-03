"use client";

import { Label } from "@/components/ui/label";
import { formatDollars } from "@/lib/formatters";
import { DIV43_RATE, type depreciationModel } from "./model";
import { DIV40_COLOR, DIV43_COLOR } from "./parts";

const YEARS = 10;

/** Ten-year deduction bars: plant & equipment tapers, building stays flat. */
export default function DepTimeline({ m }: { m: ReturnType<typeof depreciationModel> }) {
  const years = Array.from({ length: YEARS }, (_, k) => {
    const total = m.yearAt(k);
    return { k, total, div43: m.div43, div40: Math.max(0, total - m.div43) };
  });
  const peak = Math.max(1, ...years.map((y) => y.total));
  const tenYearTotal = years.reduce((sum, y) => sum + y.total, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Label variant="caps" asChild><span>Next 10 years</span></Label>
        <span className="text-[12px] text-fg-muted tabular-nums">
          {formatDollars(Math.round(tenYearTotal)) || "$0"} total
          {m.marginalRate > 0 && <> · {formatDollars(Math.round(tenYearTotal * m.marginalRate))} back</>}
        </span>
      </div>
      <ol className="flex h-28 items-end gap-1.5" aria-label="Deduction by year">
        {years.map((y) => (
          <li key={y.k} className="flex h-full flex-1 flex-col justify-end" title={`Year ${y.k + 1}: ${formatDollars(Math.round(y.total))}`}>
            <span className="sr-only">Year {y.k + 1}: {formatDollars(Math.round(y.total))}</span>
            <div className="flex flex-col overflow-hidden rounded-t-sm transition-[height] duration-300" style={{ height: `${(y.total / peak) * 100}%` }} aria-hidden="true">
              <div style={{ flexGrow: y.div40, background: DIV40_COLOR }} />
              <div style={{ flexGrow: y.div43, background: DIV43_COLOR }} />
            </div>
          </li>
        ))}
      </ol>
      <div className="flex justify-between text-[11px] text-fg-muted tabular-nums" aria-hidden="true">
        <span>Yr 1</span><span>Yr 5</span><span>Yr 10</span>
      </div>
      <p className="text-[12px] text-fg-muted">
        Plant & equipment is claimed fastest in the early years; the building claims a flat {DIV43_RATE * 100}% each year.
      </p>
    </div>
  );
}
