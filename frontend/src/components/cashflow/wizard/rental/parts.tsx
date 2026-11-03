"use client";

import { formatDollars } from "@/lib/formatters";
import { Figures } from "../shared";
import type { RentalModel } from "./model";

const pct = (n: number | null) => (n === null ? "—" : `${n.toFixed(2)}%`);
const money = (ready: boolean, n: number) => (ready ? formatDollars(Math.round(n)) || "$0" : "—");

/** What the rent estimate is based on, carried over from Property setup. */
export function RentBasis({ m }: { m: RentalModel }) {
  return (
    <p className="text-[13px] text-fg-tertiary">
      {m.value > 0 ? (
        <>
          A <span className="font-semibold text-fg-primary tabular-nums">{formatDollars(m.value)}</span> property at a typical 4.5% yield rents for about{" "}
          <span className="font-semibold text-fg-primary tabular-nums">{formatDollars(m.estimateWeekly)}</span> / wk.
        </>
      ) : (
        "Enter the weekly rent you expect to charge."
      )}
    </p>
  );
}

export function RentalFigures({ m }: { m: RentalModel }) {
  return (
    <Figures
      items={[
        { label: "Net / yr", value: money(m.ready, m.net) },
        { label: "Net / wk", value: money(m.ready, m.net / 52) },
        { label: "Gross yield", value: pct(m.grossYield) },
        { label: "Net yield", value: pct(m.netYield) },
      ]}
    />
  );
}

export const weeksLabel = (w: number) => {
  const r = Math.round(w * 10) / 10;
  return `${r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)} ${r === 1 ? "wk" : "wks"}`;
};
