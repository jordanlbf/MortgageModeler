"use client";

import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { formatDollars } from "@/lib/formatters";
import { LVR_COLORS } from "@/lib/theme";
import { Card } from "@/components/ui/card";

const CAPTION = "text-[11px] font-medium uppercase tracking-[0.08em] text-fg-tertiary";
const LMI_THRESHOLD = 0.8;
const EMPTY = <span className="text-fg-muted">—</span>;

function Money({ value }: { value: number }) {
  const v = useAnimatedValue(value, 400);
  return <>{formatDollars(Math.round(v)) || "$0"}</>;
}

function Tile({ label, value, visual }: { label: string; value: React.ReactNode; visual?: React.ReactNode }) {
  return (
    <Card variant="panel" className="flex h-full min-w-0 flex-col gap-3 rounded-2xl px-6 py-5">
      <span className={CAPTION}>{label}</span>
      <div className="text-[26px] font-semibold leading-none tracking-[-0.025em] tabular-nums text-fg-primary">{value}</div>
      {visual && <div className="mt-auto pt-1">{visual}</div>}
    </Card>
  );
}

function lvrColor(lvr: number) {
  if (lvr <= LMI_THRESHOLD) return LVR_COLORS.safe;
  if (lvr <= 0.9) return LVR_COLORS.moderate;
  return LVR_COLORS.high;
}

/** LVR meter with the 80% LMI threshold marked and labelled. */
function LvrMeter({ lvr }: { lvr: number | null }) {
  const pct = lvr === null ? 0 : Math.min(Math.max(lvr, 0), 1) * 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="relative h-1.5 w-full rounded-full bg-surface-hover"
        role="meter"
        aria-label="Loan to value ratio"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-valuetext={lvr === null ? "No estimate yet" : `${Math.round(pct)}%${lvr > LMI_THRESHOLD ? ", over the 80% LMI threshold" : ""}`}
      >
        {lvr !== null && (
          <span
            className="block h-full rounded-full transition-[width,background-color] duration-300"
            style={{ width: `${pct}%`, background: lvrColor(lvr) }}
          />
        )}
        <span
          className="absolute -top-[3px] -bottom-[3px] w-0.5 rounded-full bg-fg-tertiary"
          style={{ left: `calc(${LMI_THRESHOLD * 100}% - 1px)` }}
          aria-hidden="true"
        />
      </div>
      {/* Label under the 80% marker: above it, LMI applies. */}
      <div className="relative h-3 text-[10.5px] tabular-nums text-fg-muted" aria-hidden="true">
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${LMI_THRESHOLD * 100}%` }}>80% · LMI</span>
      </div>
    </div>
  );
}

/** Supporting numbers beside the hero: loan amount and LVR. "—" until there's an estimate. */
export default function EstimateTiles({ loanAmount, lvr }: { loanAmount: number | null; lvr: number | null }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Tile label="Loan amount" value={loanAmount === null ? EMPTY : <Money value={loanAmount} />} />
      <Tile
        label="LVR"
        value={lvr === null ? EMPTY : <span style={{ color: lvrColor(lvr) }}>{Math.round(lvr * 100)}%</span>}
        visual={<LvrMeter lvr={lvr} />}
      />
    </div>
  );
}
