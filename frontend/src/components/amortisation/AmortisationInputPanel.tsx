"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import type { AmortisationState } from "@/hooks/useAmortisationState";
import { FREQ_LABELS } from "@/lib/constants";
import { formatDollars } from "@/lib/formatters";
import { LMI_THRESHOLD, lvrColor } from "@/lib/lvr";
import SectionCard from "@/components/patterns/cards/SectionCard";
import InfoTip from "@/components/patterns/blocks/InfoTip";
import { AmountSection, PercentChip } from "@/components/domain/AmountSection";
import MoneyInput from "@/components/domain/MoneyInput";
import UnitInput from "@/components/domain/UnitInput";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const FIELD = "w-[130px] shrink-0";

const HELP = {
  offset: "Savings in an offset account. Interest is only charged on the loan minus this balance.",
  growth: "How fast the property's value grows. Used for the equity and LVR lines.",
};

/** A label (with optional help) on the left, its field on the right. */
function Row({ id, label, help, children }: { id: string; label: string; help?: string; children: ReactNode }) {
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

/**
 * "Your loan", in the order you fill it in: price and deposit (as on Purchase
 * Costs), rate and term, the offset account behind a switch, and property
 * growth. How often you repay is in the Amortisation card's header.
 */
export default function AmortisationInputPanel({ am }: { am: AmortisationState }) {
  const id = useId();
  const { inputs, setters } = am;
  const price = inputs.purchasePrice;
  const deposit = inputs.deposit;
  const depositPct = price > 0 ? (deposit / price) * 100 : 0;
  const lvr = price > 0 ? Math.max(0, (price - deposit) / price) : null;
  const accent = lvrColor(lvr);
  const noLmiPct = Math.round((1 - LMI_THRESHOLD) * 100);
  const per = FREQ_LABELS[inputs.frequency];
  const setDepositPct = (pct: number) => setters.setDeposit(Math.round((price * Math.min(Math.max(pct, 0), 100)) / 100));

  const [offsetOn, setOffsetOn] = useState(inputs.offsetBalance > 0 || inputs.offsetContribution > 0);
  // Remember the offset figures while it's switched off, so switching back restores them.
  const saved = useRef({ balance: inputs.offsetBalance, contribution: inputs.offsetContribution });
  const setOffset = (on: boolean) => {
    setOffsetOn(on);
    if (on) {
      setters.setOffsetBalance(saved.current.balance);
      setters.setOffsetContribution(saved.current.contribution);
    } else {
      saved.current = { balance: inputs.offsetBalance, contribution: inputs.offsetContribution };
      setters.setOffsetBalance(0);
      setters.setOffsetContribution(0);
    }
  };

  return (
    <SectionCard flush title="Your loan" titleId={`${id}-title`} role="group" aria-labelledby={`${id}-title`}>
      <AmountSection id={`${id}-price`} label="Purchase price" value={price} onChange={setters.setPurchasePrice} inputStep={10_000} />
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
        accent={accent}
        markers={price > 0 ? [{ value: noLmiPct, label: `${noLmiPct}%`, title: `${noLmiPct}%: deposit needed to avoid LMI` }] : undefined}
        aside={price > 0 && <PercentChip id={`${id}-deposit-pct`} percent={depositPct} accent={accent} onCommit={setDepositPct} />}
      />

      <div className="flex flex-col gap-3 border-t border-border-subtle px-6 py-4">
        <Row id={`${id}-rate`} label="Interest rate">
          <UnitInput id={`${id}-rate`} unit="%" value={inputs.rate} onValueChange={setters.setRate} min={0.5} max={15} step={0.05} decimals={2} className={FIELD} />
        </Row>
        <Row id={`${id}-term`} label="Loan term">
          <UnitInput id={`${id}-term`} unit="yrs" value={inputs.years} onValueChange={setters.setYears} min={1} max={30} className={FIELD} />
        </Row>
      </div>

      <div className="flex flex-col gap-3 border-t border-border-subtle px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Label variant="bare" htmlFor={`${id}-offset-on`} className="text-[14px] font-semibold text-fg-primary">Offset account</Label>
          <Switch
            id={`${id}-offset-on`}
            variant="accent"
            checked={offsetOn}
            onCheckedChange={setOffset}
            style={{ "--switch-accent": "var(--color-data-positive)" } as React.CSSProperties}
          />
        </div>
        {offsetOn && (
          <>
            <Row id={`${id}-offset`} label="Balance" help={HELP.offset}>
              <MoneyInput id={`${id}-offset`} value={inputs.offsetBalance} onValueChange={setters.setOffsetBalance} className={FIELD} aria-describedby={`${id}-offset-help`} />
            </Row>
            <Row id={`${id}-contrib`} label={`Added a ${per}`} help={`What you put into the offset account each ${per}, on top of your repayment.`}>
              <MoneyInput id={`${id}-contrib`} value={inputs.offsetContribution} onValueChange={setters.setOffsetContribution} className={FIELD} aria-describedby={`${id}-contrib-help`} />
            </Row>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border-subtle px-6 py-4">
        <Row id={`${id}-growth`} label="Property growth a year" help={HELP.growth}>
          <UnitInput id={`${id}-growth`} unit="%" value={inputs.appreciation} onValueChange={setters.setAppreciation} min={0} max={15} step={0.5} decimals={1} className={FIELD} aria-describedby={`${id}-growth-help`} />
        </Row>
      </div>
    </SectionCard>
  );
}
