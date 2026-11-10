"use client";

import { useId } from "react";
import { PC_STATES, type PurchaseCostsState } from "@/hooks/usePurchaseCostsState";
import { formatDollars } from "@/lib/formatters";
import SectionCard from "@/components/patterns/cards/SectionCard";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { AmountSection, PercentChip } from "@/components/domain/AmountSection";
import SwitchRow from "@/components/domain/SwitchRow";
import { LMI_THRESHOLD, lvrColor } from "@/lib/lvr";

const PROPERTY_TYPES = [
  { value: "existing", label: "Existing home" },
  { value: "new", label: "New build" },
  { value: "land", label: "Vacant land" },
] as const;

/** The input card: title, then price, deposit, property and buyer sections. */
export default function InputPanel({ pc }: { pc: PurchaseCostsState }) {
  const id = useId();
  const { inputs, setters } = pc;
  const { price, depositAmount } = inputs;

  // The deposit slider runs 0–100% of the price; the 80% LVR point (20% deposit) is marked.
  const depositPct = price > 0 ? (depositAmount / price) * 100 : 0;
  const noLmiPct = Math.round((1 - LMI_THRESHOLD) * 100);
  const pctTick = (n: number) => `${n}%`;
  const lvr = price > 0 ? Math.max(0, (price - depositAmount) / price) : null;
  const overPrice = price > 0 && depositAmount > price;

  return (
    <SectionCard flush title="Your Purchase" titleId={`${id}-title`} role="group" aria-labelledby={`${id}-title`} className="h-full">

      <AmountSection
        id={`${id}-price`}
        label="Purchase price"
        value={price}
        onChange={(n) => setters.setPriceInput(String(n))}
        inputStep={10_000}
        autoFocus={price === 0}
      />

      <AmountSection
        id={`${id}-deposit`}
        label="Deposit"
        value={depositAmount}
        onChange={(n) => setters.setDepositAmountInput(String(n))}
        scale={{
          value: depositPct,
          min: 0,
          max: 100,
          step: 1,
          onChange: (pct) => setters.setDepositAmountInput(String(Math.round((price * pct) / 100))),
          tick: pctTick,
          valueText: `${formatDollars(depositAmount) || "$0"}, ${Math.round(depositPct)}% of the price`,
        }}
        inputStep={5_000}
        percentOf={price}
        disabled={price <= 0}
        accent={lvr === null ? undefined : lvrColor(lvr)}
        markers={
          price > 0
            ? [
                ...(inputs.firstHome
                  ? [{ value: 5, label: "5%", title: "5%: the minimum deposit under the First Home Guarantee, with no LMI" }]
                  : []),
                { value: noLmiPct, label: `${noLmiPct}%`, title: `${noLmiPct}%: deposit needed to avoid LMI` },
              ]
            : undefined
        }
        aside={
          price > 0 && (
            <PercentChip
              id={`${id}-deposit-pct`}
              percent={depositPct}
              accent={overPrice ? "var(--color-data-negative)" : lvrColor(lvr)}
              onCommit={(pct) => setters.setDepositAmountInput(String(Math.round((price * pct) / 100)))}
            />
          )
        }
      />

      <div className="flex flex-col gap-4 border-t border-border-subtle px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <Label variant="bare" htmlFor={`${id}-state`} className="text-[13.5px] text-fg-secondary">State</Label>
            <NativeSelect
              variant="form"
              id={`${id}-state`}
              value={inputs.state}
              onChange={(e) => setters.setState(e.target.value)}
              className="h-8 w-[88px] shrink-0 rounded-lg pr-7 pl-3 text-[13px] font-medium"
            >
              {PC_STATES.map((s) => (
                <NativeSelectOption variant="form" key={s} value={s}>{s}</NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {/* One type is always on: switching one on turns the others off, and the active one can't be switched off. */}
          <div role="group" aria-label="Property type" className="flex flex-col gap-4">
            {PROPERTY_TYPES.map((t) => (
              <SwitchRow
                key={t.value}
                id={`${id}-type-${t.value}`}
                label={t.label}
                checked={inputs.propertyType === t.value}
                onChange={(on) => { if (on) setters.setPropertyType(t.value); }}
              />
            ))}
          </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border-subtle px-6 pt-5 pb-6">
          <SwitchRow
            id={`${id}-occ`}
            label="Living in it"
            checked={inputs.ownerOcc}
            onChange={(v) => {
              setters.setOwnerOcc(v);
              // First home benefits need you to live in it.
              if (!v) setters.setFirstHome(false);
            }}
          />
          <SwitchRow
            id={`${id}-first`}
            label="First home buyer"
            checked={inputs.firstHome}
            onChange={setters.setFirstHome}
            disabled={!inputs.ownerOcc}
            note="Only for a home you'll live in"
          />
          <SwitchRow id={`${id}-couple`} label="Buying as a couple" checked={inputs.couple} onChange={setters.setCouple} />
          <SwitchRow
            id={`${id}-lmi`}
            label="LMI exempt"
            checked={inputs.lmiExempt}
            onChange={setters.setLmiExempt}
            disabled={lvr !== null && lvr <= LMI_THRESHOLD}
            note={`No LMI with a ${noLmiPct}%+ deposit`}
          />
      </div>
    </SectionCard>
  );
}
