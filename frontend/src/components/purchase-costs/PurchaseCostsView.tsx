"use client";

import { useRef, useState } from "react";
import { usePurchaseCostsState, type CostItem, type PurchaseCostsState } from "@/hooks/usePurchaseCostsState";
import { PURCHASE_COST_COLORS } from "@/lib/theme";
import SectionCard from "@/components/patterns/cards/SectionCard";
import CalculatorLayout from "@/components/patterns/layouts/CalculatorLayout";
import CashNeededHero from "./CashNeededHero";
import CostsDonut, { DonutLegend } from "./CostsDonut";
import CostTable, { type CostRow } from "./CostTable";
import InputPanel from "./InputPanel";
import MobileSummaryBar from "./MobileSummaryBar";
import StatTiles from "./StatTiles";
import InlineAlert from "@/components/patterns/blocks/InlineAlert";

/** Rows shown before there's an estimate, so the layout never jumps. */
const PLACEHOLDER_ITEMS: CostItem[] = [
  { key: "duty", name: "Stamp duty", amount: 0, color: PURCHASE_COST_COLORS.stampDuty, subtitle: "" },
  { key: "lmi", name: "Lenders mortgage insurance", amount: 0, color: PURCHASE_COST_COLORS.lmi, subtitle: "" },
  { key: "fees", name: "Fees", amount: 0, color: PURCHASE_COST_COLORS.fees, subtitle: "" },
];

/** Shorter names for the donut legend and centre. */
const SHORT_NAME: Partial<Record<CostItem["key"], string>> = { lmi: "LMI" };

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
    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle px-2 py-0.5 text-[12px] text-fg-secondary" aria-live="polite">
      <span className={`size-1.5 rounded-full ${s.dot} ${s.pulse ? "animate-pulse" : ""}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}

/**
 * Two-column calculator. Left: the input card. Right: a summary card (donut,
 * cash needed and loan / LVR / LMI tiles, like a finance dashboard's plan
 * card) above a breakdown card holding the itemised table. On desktop the
 * right column's two cards end level with the input card. Stacks below lg,
 * with a summary bar once the summary card scrolls away.
 */
export default function PurchaseCostsView() {
  const pc = usePurchaseCostsState();
  const [active, setActive] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { data, error, loading, derived } = pc;
  const empty = !data;

  const deposit = empty ? 0 : derived.deposit;
  const total = empty ? null : derived.total;

  const lmi = empty ? null : derived.effectiveLmi;

  const rows: CostRow[] = [
    { key: "deposit", name: "Deposit", amount: deposit, color: PURCHASE_COST_COLORS.deposit, subtitle: "" },
    ...(empty ? PLACEHOLDER_ITEMS : derived.items),
  ];
  const slices = rows
    .filter((r) => !r.saving)
    .map((r) => ({ key: r.key, name: SHORT_NAME[r.key] ?? r.name, amount: r.amount, color: r.color ?? "" }));

  const fade = `transition-opacity duration-200 ${loading ? "opacity-60" : ""}`;

  return (
    <CalculatorLayout inputs={<InputPanel pc={pc} />} aria-labelledby="pc-title" aria-busy={loading}>
        <MobileSummaryBar target={cardRef} total={total} />

        {error && (
          <InlineAlert>{error}</InlineAlert>
        )}

        <SectionCard ref={cardRef} title="Purchase Costs" titleAs="h1" titleId="pc-title" action={<Status pc={pc} />} className={`@container ${fade}`}>

          <div className="grid grid-cols-1 items-center gap-x-8 gap-y-6 @min-[30rem]:grid-cols-[136px_minmax(0,1fr)] @min-[44rem]:grid-cols-[136px_minmax(0,1fr)_192px]">
            <div>
              <CostsDonut slices={slices} total={total} active={active} onActive={setActive} />
            </div>
            <CashNeededHero total={total}>
              <DonutLegend slices={slices} total={total} active={active} onActive={setActive} />
            </CashNeededHero>
            <div className="@min-[30rem]:col-span-2 @min-[30rem]:border-t @min-[30rem]:border-border-subtle @min-[30rem]:pt-5 @min-[44rem]:col-span-1 @min-[44rem]:border-0 @min-[44rem]:pt-0">
              <StatTiles
                loanAmount={empty ? null : derived.loanAmount}
                lvr={empty ? null : derived.lvr}
                lmi={lmi}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Where your cash goes" className={`flex-1 gap-3 pb-3 ${fade}`}>
          <CostTable rows={rows} total={total} empty={empty} active={active} onActive={setActive} />
        </SectionCard>
    </CalculatorLayout>
  );
}
