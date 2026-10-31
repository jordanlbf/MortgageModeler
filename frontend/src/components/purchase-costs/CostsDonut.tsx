"use client";

import { Cell, Pie, PieChart } from "recharts";
import { formatDollars, formatDollarsShort } from "@/lib/formatters";

export interface Slice {
  key: string;
  name: string;
  amount: number;
  color: string;
}

interface HoverProps {
  slices: Slice[];
  total: number | null;
  active: string | null;
  onActive: (k: string | null) => void;
}

/**
 * Donut of where the cash goes (deposit and each cost). The centre shows the
 * hovered slice and its share, and is empty otherwise. Hover is shared with
 * the legend and table through `active` / `onActive`.
 */
export default function CostsDonut({ slices, total, active, onActive, size = 136 }: HoverProps & { size?: number }) {
  const shown = slices.filter((s) => s.amount > 0);
  const empty = total === null || shown.length === 0;
  const hit = empty ? null : shown.find((s) => s.key === active) ?? null;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={empty ? "No estimate yet" : `Cash needed: ${shown.map((s) => `${s.name} ${formatDollars(s.amount)}`).join(", ")}`}
      onMouseLeave={() => onActive(null)}
    >
      <PieChart width={size} height={size}>
        <Pie
          data={empty ? [{ key: "empty", amount: 1 }] : shown}
          dataKey="amount"
          nameKey="key"
          innerRadius={size / 2 - 18}
          outerRadius={size / 2 - 1}
          paddingAngle={empty || shown.length === 1 ? 0 : 2}
          cornerRadius={3}
          startAngle={90}
          endAngle={-270}
          stroke="none"
          isAnimationActive={!empty}
          animationDuration={400}
        >
          {empty
            ? <Cell fill="var(--color-surface-hover)" />
            : shown.map((s) => (
                <Cell
                  key={s.key}
                  fill={s.color}
                  fillOpacity={hit && hit.key !== s.key ? 0.25 : 1}
                  className="cursor-default outline-none transition-[fill-opacity] duration-150"
                  onMouseEnter={() => onActive(s.key)}
                />
              ))}
        </Pie>
      </PieChart>
      {hit && total ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center" aria-hidden="true">
          <span className="max-w-full truncate text-[10.5px] text-fg-tertiary">{hit.name}</span>
          <span className="text-[16px] font-semibold tabular-nums text-fg-primary">{formatDollarsShort(hit.amount)}</span>
          <span className="text-[10.5px] tabular-nums text-fg-tertiary">{((hit.amount / total) * 100).toFixed(1)}%</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Two-column legend for the donut: dot and name on the left, share of the
 * total right-aligned so the percentages line up. Hovering
 * an item highlights its slice. Visual only; the table carries the same data
 * for screen readers.
 */
export function DonutLegend({ slices, total, active, onActive }: HoverProps) {
  const empty = total === null;
  return (
    <ul className="grid w-full max-w-[300px] grid-cols-2 gap-x-6 gap-y-1.5" aria-hidden="true" onMouseLeave={() => onActive(null)}>
      {slices.map((s) => {
        const off = empty || s.amount <= 0;
        return (
          <li
            key={s.key}
            className="flex items-center gap-1.5 text-[12px] whitespace-nowrap transition-opacity duration-150"
            style={{ opacity: active && active !== s.key ? 0.4 : 1 }}
            onPointerEnter={(e) => { if (e.pointerType === "mouse" && !off) onActive(s.key); }}
          >
            <span className="size-2 shrink-0 rounded-full" style={{ background: s.color, opacity: off ? 0.4 : 1 }} />
            <span className={`flex-1 ${off ? "text-fg-muted" : "text-fg-secondary"}`}>{s.name}</span>
            {!off && total ? <span className="text-right tabular-nums text-fg-tertiary">{Math.round((s.amount / total) * 100)}%</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
