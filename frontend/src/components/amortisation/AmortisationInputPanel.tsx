"use client";

import { useId } from "react";
import type { AmortisationState } from "@/hooks/useAmortisationState";
import type { Frequency } from "@/lib/types";
import { FREQ_LABELS, FREQ_OPTIONS } from "@/lib/constants";
import { formatDollars } from "@/lib/formatters";
import { LMI_THRESHOLD, lvrColor } from "@/lib/lvr";
import SectionCard from "@/components/patterns/cards/SectionCard";
import InfoTip from "@/components/patterns/blocks/InfoTip";
import { AmountSection, PercentChip } from "@/components/domain/AmountSection";
import MoneyInput from "@/components/domain/MoneyInput";
import UnitInput from "@/components/domain/UnitInput";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** A label (with optional help) on the left, its field on the right. */
function Row({ id, label, help, children }: { id: string; label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-1">
        <Label variant="bare" htmlFor={id} className="text-[13.5px] text-fg-secondary">{label}</Label>
        {help && <InfoTip label={label} id={`${id}-help`}>{help}</InfoTip>}
      </div>
      {children}
    </div>
  );
}

/** A titled group of rows, divided from the one above. */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t border-border-subtle px-6 py-5">
      <Label variant="caps" asChild><h3>{title}</h3></Label>
      {children}
    </div>
  );
}

/** The loan card: price and deposit, then the loan terms, the offset account and property growth. */
export default function AmortisationInputPanel({ am }: { am: AmortisationState }) {
  const id = useId();
  const { inputs, setters } = am;
  const { purchasePrice: price, deposit } = inputs;

  // The deposit slider runs 0–100% of the price; the 80% LVR point (20% deposit) is marked.
  const depositPct = price > 0 ? (deposit / price) * 100 : 0;
  const noLmiPct = Math.round((1 - LMI_THRESHOLD) * 100);
  const lvr = price > 0 ? Math.max(0, (price - deposit) / price) : null;
  const setDepositPct = (pct: number) => setters.setDeposit(Math.round((price * pct) / 100));
  const per = FREQ_LABELS[inputs.frequency];

  return (
    <SectionCard flush title="Your loan" titleId={`${id}-title`} role="group" aria-labelledby={`${id}-title`}>
      <AmountSection
        id={`${id}-price`}
        label="Purchase price"
        value={price}
        onChange={setters.setPurchasePrice}
        inputStep={10_000}
      />

      <AmountSection
        id={`${id}-deposit`}
        label="Deposit"
        value={deposit}
        onChange={setters.setDeposit}
        scale={{
          value: depositPct,
          min: 0,
          max: 100,
          step: 1,
          onChange: setDepositPct,
          tick: (n) => `${n}%`,
          valueText: `${formatDollars(deposit) || "$0"}, ${Math.round(depositPct)}% of the price`,
        }}
        inputStep={5_000}
        percentOf={price}
        disabled={price <= 0}
        accent={lvrColor(lvr)}
        markers={price > 0 ? [{ value: noLmiPct, label: `${noLmiPct}%`, title: `${noLmiPct}%: deposit needed to avoid LMI` }] : undefined}
        aside={price > 0 && <PercentChip id={`${id}-deposit-pct`} percent={depositPct} accent={lvrColor(lvr)} onCommit={setDepositPct} />}
      />

      <Group title="Loan">
        <Row id={`${id}-rate`} label="Interest rate">
          <UnitInput id={`${id}-rate`} unit="%" value={inputs.rate} onValueChange={setters.setRate} min={0.5} max={15} step={0.05} decimals={2} className="w-[120px] shrink-0" />
        </Row>
        <Row id={`${id}-term`} label="Loan term">
          <UnitInput id={`${id}-term`} unit="yrs" value={inputs.years} onValueChange={setters.setYears} min={1} max={30} className="w-[120px] shrink-0" />
        </Row>
        <div className="flex flex-col gap-2">
          <Label variant="bare" id={`${id}-freq`} className="text-[13.5px] text-fg-secondary">Repayments</Label>
          <ToggleGroup
            type="single"
            variant="segment-pill"
            aria-labelledby={`${id}-freq`}
            value={inputs.frequency}
            onValueChange={(v) => { if (v) setters.setFrequency(v as Frequency); }}
            className="grid grid-cols-3 gap-1.5"
          >
            {FREQ_OPTIONS.map((o) => (
              <ToggleGroupItem key={o.value} value={o.value} className="py-2">{o.label}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </Group>

      <Group title="Offset account">
        <Row id={`${id}-offset`} label="Balance" help="Savings in an offset account. Interest is only charged on the loan minus this balance.">
          <MoneyInput id={`${id}-offset`} value={inputs.offsetBalance} onValueChange={setters.setOffsetBalance} className="w-[120px] shrink-0" aria-describedby={`${id}-offset-help`} />
        </Row>
        <Row id={`${id}-contrib`} label={`Added a ${per}`} help={`What you put into the offset account each ${per}, on top of your repayment.`}>
          <MoneyInput id={`${id}-contrib`} value={inputs.offsetContribution} onValueChange={setters.setOffsetContribution} className="w-[120px] shrink-0" aria-describedby={`${id}-contrib-help`} />
        </Row>
      </Group>

      <Group title="Property">
        <Row id={`${id}-growth`} label="Growth a year" help="How fast the property's value grows. Used for the equity and LVR lines.">
          <UnitInput id={`${id}-growth`} unit="%" value={inputs.appreciation} onValueChange={setters.setAppreciation} min={0} max={15} step={0.5} decimals={1} className="w-[120px] shrink-0" aria-describedby={`${id}-growth-help`} />
        </Row>
      </Group>
    </SectionCard>
  );
}
