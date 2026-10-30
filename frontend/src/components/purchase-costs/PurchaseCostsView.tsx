"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { usePurchaseCostsState, type CostItem, type PurchaseCostsState } from "@/hooks/usePurchaseCostsState";
import { formatDollars } from "@/lib/formatters";
import { PURCHASE_COST_COLORS } from "@/lib/theme";
import { Card } from "@/components/ui/card";
import CashBar from "./CashBar";
import CostTable from "./CostTable";
import EstimateTiles from "./EstimateTiles";
import PurchaseInputs from "./PurchaseInputs";

/** Rows shown before there's an estimate, so the layout never jumps. */
const PLACEHOLDER_ITEMS: CostItem[] = [
  { key: "duty", name: "Stamp duty", amount: 0, color: PURCHASE_COST_COLORS.stampDuty, subtitle: "" },
  { key: "lmi", name: "Lenders mortgage insurance", amount: 0, color: PURCHASE_COST_COLORS.lmi, subtitle: "" },
  { key: "fees", name: "Fees", amount: 0, color: PURCHASE_COST_COLORS.fees, subtitle: "" },
];

function Status({ pc }: { pc: PurchaseCostsState }) {
  const { inputs, loading, error, data } = pc;
  const s = inputs.price <= 0
    ? { label: "Waiting for a price", dot: "bg-fg-muted", pulse: false }
    : error
      ? { label: "Couldn't update", dot: "bg-data-negative", pulse: false }
      : loading || !data
        ? { label: "Updating", dot: "bg-data-warning", pulse: true }
        : { label: "Live", dot: "bg-brand", pulse: false };
  return (
    <span className="flex shrink-0 items-center gap-2 rounded-full border border-border-subtle px-3 py-1 text-[12px] text-fg-secondary" aria-live="polite">
      <span className={`size-1.5 rounded-full ${s.dot} ${s.pulse ? "animate-pulse" : ""}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}

/** Inputs bar, then the estimate: headline tiles and one cash breakdown (bar + itemised table). */
export default function PurchaseCostsView() {
  const pc = usePurchaseCostsState();
  const [active, setActive] = useState<string | null>(null);
  const { data, error, loading, inputs, derived } = pc;
  const empty = !data;

  // LMI is the cost you can act on: say how much more deposit avoids it.
  const lmiGap = Math.max(0, Math.round(inputs.price * 0.2 - derived.deposit));
  const items = empty
    ? PLACEHOLDER_ITEMS
    : derived.items.map((i) =>
        i.key === "lmi" && i.amount > 0 && lmiGap > 0
          ? { ...i, subtitle: `${i.subtitle} · +${formatDollars(lmiGap)} deposit avoids it` }
          : i,
      );
  const deposit = empty ? 0 : derived.deposit;
  const costs = empty ? 0 : derived.costs;

  return (
    <div className="flex flex-col gap-8">
      <PurchaseInputs pc={pc} />

      <section className="flex flex-col gap-3" aria-labelledby="pc-estimate">
        <div className="flex items-center justify-between gap-4">
          <h2 id="pc-estimate" className="text-[15px] font-semibold text-fg-primary">Estimate</h2>
          <Status pc={pc} />
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2.5 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-[13px] text-red-400/80">
            <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <div className={`flex flex-col gap-3 transition-opacity duration-200 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
          <EstimateTiles
            total={empty ? null : derived.total}
            loanAmount={empty ? null : derived.loanAmount}
            lvr={empty ? null : derived.lvr}
          />

          <Card variant="panel" className="flex flex-col gap-5 px-5 pt-4 pb-3">
            <h3 className="text-[14px] font-semibold text-fg-primary">Where your cash goes</h3>
            <CashBar
              parts={[
                { key: "deposit", name: "Deposit", amount: deposit, color: PURCHASE_COST_COLORS.deposit },
                ...items.filter((i) => !i.saving).map((i) => ({ key: i.key, name: i.name, amount: i.amount, color: i.color ?? "" })),
              ]}
              deposit={deposit}
              costs={costs}
              active={active}
              onActive={setActive}
            />
            <CostTable items={items} deposit={deposit} empty={empty} active={active} onActive={setActive} />
          </Card>
        </div>
      </section>
    </div>
  );
}
