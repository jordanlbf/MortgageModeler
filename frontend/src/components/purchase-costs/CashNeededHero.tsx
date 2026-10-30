"use client";

import { forwardRef } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { formatDollars } from "@/lib/formatters";
import { Card } from "@/components/ui/card";

export interface Slice {
  key: string;
  name: string;
  amount: number;
  color: string;
}

const CAPTION = "text-[11px] font-medium uppercase tracking-[0.08em] text-fg-tertiary";
const SIZE = 168;

function Money({ value }: { value: number }) {
  const v = useAnimatedValue(value, 400);
  return <>{formatDollars(Math.round(v)) || "$0"}</>;
}

/** Donut of the purchase costs (not the deposit), with a legend underneath. */
function CostsDonut({ slices, active, onActive }: { slices: Slice[]; active: string | null; onActive: (k: string | null) => void }) {
  const shown = slices.filter((s) => s.amount > 0);
  const empty = shown.length === 0;
  const sum = shown.reduce((a, s) => a + s.amount, 0);
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative"
        style={{ width: SIZE, height: SIZE }}
        role="img"
        aria-label={empty ? "No purchase costs yet" : `Purchase costs: ${shown.map((s) => `${s.name} ${formatDollars(s.amount)}`).join(", ")}`}
        onMouseLeave={() => onActive(null)}
      >
        <PieChart width={SIZE} height={SIZE}>
          <Pie
            data={empty ? [{ key: "empty", amount: 1 }] : shown}
            dataKey="amount"
            nameKey="key"
            innerRadius={SIZE / 2 - 22}
            outerRadius={SIZE / 2 - 2}
            paddingAngle={empty || shown.length === 1 ? 0 : 2}
            cornerRadius={4}
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
                    fillOpacity={active && active !== s.key ? 0.25 : 1}
                    className="cursor-default outline-none transition-[fill-opacity] duration-150"
                    onMouseEnter={() => onActive(s.key)}
                  />
                ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5" aria-hidden="true">
          <span className="text-[11px] text-fg-tertiary">Costs</span>
          <span className="text-[16px] font-semibold tabular-nums text-fg-primary">{empty ? "—" : <Money value={sum} />}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5 self-stretch" onMouseLeave={() => onActive(null)}>
        {slices.map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-2.5 text-[12.5px] transition-opacity duration-150"
            style={{ opacity: active && active !== s.key ? 0.4 : 1 }}
            onPointerEnter={(e) => { if (e.pointerType === "mouse" && s.amount > 0) onActive(s.key); }}
          >
            <span className="size-2 shrink-0 rounded-full" style={{ background: s.color, opacity: s.amount > 0 ? 1 : 0.4 }} aria-hidden="true" />
            <span className="flex-1 text-fg-secondary">{s.name}</span>
            <span className="tabular-nums text-fg-tertiary">{empty ? "—" : formatDollars(s.amount) || "$0"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The one hero number: cash needed, with its share of the price and a
 * deposit + costs line, beside a donut splitting the purchase costs.
 */
const CashNeededHero = forwardRef<HTMLDivElement, {
  total: number | null;
  price: number;
  deposit: number;
  costs: number;
  /** Grants, already taken off `costs`. */
  grants: number;
  slices: Slice[];
  status: React.ReactNode;
  active: string | null;
  onActive: (k: string | null) => void;
}>(function CashNeededHero({ total, price, deposit, costs, grants, slices, status, active, onActive }, ref) {
  const share = total !== null && price > 0 ? (total / price) * 100 : null;
  return (
    <Card ref={ref} variant="panel" className="relative overflow-hidden rounded-2xl px-7 py-7 sm:px-8">
      <span className="absolute inset-x-0 top-0 h-px bg-brand/50" aria-hidden="true" />
      <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 id="pc-cash-needed" className={`${CAPTION} text-brand/80`}>Cash needed</h2>
            {status}
          </div>
          <div className="text-[48px] font-semibold leading-none tracking-[-0.03em] text-brand tabular-nums sm:text-[56px]">
            {total === null ? <span className="text-fg-muted">—</span> : <Money value={total} />}
          </div>
          <p className="text-[14px] text-fg-tertiary tabular-nums">
            {share === null ? "Enter a purchase price to see your estimate" : `≈ ${share.toFixed(1)}% of purchase price`}
          </p>
          {total !== null && (
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] tabular-nums text-fg-secondary">
              <span><span className="text-fg-tertiary">Deposit</span> {formatDollars(deposit) || "$0"}</span>
              <span><span className="text-fg-tertiary">Purchase costs</span> {formatDollars(costs) || "$0"}</span>
              {grants > 0 && <span><span className="text-fg-tertiary">after grants</span> <span className="text-data-positive">−{formatDollars(grants)}</span></span>}
            </p>
          )}
        </div>
        <CostsDonut slices={slices} active={active} onActive={onActive} />
      </div>
    </Card>
  );
});

export default CashNeededHero;
