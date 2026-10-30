"use client";

import { formatDollars } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface BarPart {
  key: string;
  name: string;
  amount: number;
  color: string;
}

/**
 * One long bar: deposit then each cost, left to right, adding up to the cash
 * needed. A bracket above groups it into "Deposit" and "Purchase costs".
 * Rows in the itemised table below act as its legend (same colour dots).
 */
export default function CashBar({
  parts,
  deposit,
  costs,
  active,
  onActive,
}: {
  parts: BarPart[];
  deposit: number;
  costs: number;
  active: string | null;
  onActive: (key: string | null) => void;
}) {
  const total = deposit + costs;
  const shown = parts.filter((p) => p.amount > 0);
  const depositPct = total > 0 ? (deposit / total) * 100 : 0;
  const costsPct = total > 0 ? 100 - depositPct : 0;

  if (total <= 0) {
    return (
      <div className="flex flex-col gap-2.5" aria-hidden="true">
        <div className="h-4" />
        <div className="h-3 w-full rounded-full bg-surface-hover" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5" onMouseLeave={() => onActive(null)}>
      {/* Bracket: deposit vs purchase costs */}
      <div className="flex gap-[3px]" aria-hidden="true">
        {depositPct > 0 && (
          <Bracket label="Deposit" width={depositPct} />
        )}
        {costsPct > 0 && (
          <Bracket label="Purchase costs" width={costsPct} amount={costs} />
        )}
      </div>

      <div
        className="flex h-3 w-full gap-[3px]"
        role="img"
        aria-label={`Cash needed split: ${shown.map((p) => `${p.name} ${formatDollars(p.amount)}`).join(", ")}`}
      >
        {shown.map((p) => (
          <Tooltip key={p.key}>
            <TooltipTrigger asChild>
              <div
                className="h-full min-w-1.5 rounded-full transition-[width,opacity] duration-300"
                style={{
                  width: `${(p.amount / total) * 100}%`,
                  background: p.color,
                  opacity: active && active !== p.key ? 0.25 : 1,
                }}
                onPointerEnter={(e) => { if (e.pointerType === "mouse") onActive(p.key); }}
              />
            </TooltipTrigger>
            <TooltipContent variant="surface" side="top" sideOffset={8}>
              <span className="font-semibold">{p.name}</span>
              <span className="ml-2 tabular-nums">{formatDollars(p.amount)}</span>
              <span className="ml-1.5 tabular-nums text-fg-tertiary">{((p.amount / total) * 100).toFixed(0)}%</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

function Bracket({ label, width, amount }: { label: string; width: number; amount?: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 transition-[width] duration-300" style={{ width: `${width}%` }}>
      {/* The costs label sits right-aligned and may run left over the deposit side when its segment is narrow. */}
      <span className={amount !== undefined ? "flex justify-end" : "flex"}>
        <span className="whitespace-nowrap text-[11px] text-fg-tertiary">
          <span className="font-medium text-fg-secondary">{label}</span>
          {amount !== undefined && <span className="ml-1.5 tabular-nums text-fg-secondary">{formatDollars(amount)}</span>}
        </span>
      </span>
      <span className="h-1.5 rounded-t-[3px] border-x border-t border-fg-muted/50" />
    </div>
  );
}
