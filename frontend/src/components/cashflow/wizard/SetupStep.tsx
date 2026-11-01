"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AmountSection, PercentChip } from "@/components/domain/AmountSection";
import KeyValueList, { KeyValueRow } from "@/components/patterns/blocks/KeyValueList";
import type { CashflowState } from "@/hooks/useCashflowState";
import { formatDollars, formatDollarsSigned, parseCurrencyInput } from "@/lib/formatters";
import { LMI_THRESHOLD, lvrColor } from "@/lib/lvr";
import { currencyInput, InputField } from "./shared";

interface Props {
  s: CashflowState;
}

/**
 * Step 1, laid out like the Purchase Costs input card: the two choices, then
 * (once both are picked) edge-to-edge amount sections and a summary list.
 * Rendered in a `flush` WizardShell, so each section sets its own padding.
 */
export default function SetupStep({ s }: Props) {
  const id = useId();
  const showInputs = s.propertyUse && s.purchaseMode;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-5 px-6 pb-6">
        <div className="flex flex-col gap-2.5">
          <Label variant="caps" id={`${id}-use`}>Property type</Label>
          {/* Click handlers live on the items (not onValueChange) so re-clicking
              the active option re-applies the choice and never deselects it. */}
          <ToggleGroup
            type="single"
            variant="choice"
            value={s.propertyUse ?? ""}
            aria-labelledby={`${id}-use`}
            className="flex gap-2"
          >
            <ToggleGroupItem
              value="investment"
              onClick={() => { s.setPropertyUse("investment"); s.setPurchaseMode(null); }}
            >
              Investment
            </ToggleGroupItem>
            <ToggleGroupItem
              value="ppor"
              onClick={() => { s.setPropertyUse("ppor"); s.setPurchaseMode(null); }}
            >
              Owner-occupied
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className={`flex flex-col gap-2.5 transition-opacity duration-200 ${!s.propertyUse ? "opacity-30 pointer-events-none" : ""}`}>
          <Label variant="caps" id={`${id}-mode`}>Purchase status</Label>
          <ToggleGroup
            type="single"
            variant="choice"
            value={s.purchaseMode ?? ""}
            disabled={!s.propertyUse}
            aria-labelledby={`${id}-mode`}
            className="flex gap-2"
          >
            <ToggleGroupItem value="new" onClick={() => s.setPurchaseMode("new")}>
              New purchase
            </ToggleGroupItem>
            <ToggleGroupItem value="existing" onClick={() => s.setPurchaseMode("existing")}>
              Existing property
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {showInputs && (s.purchaseMode === "new" ? <NewPurchase s={s} /> : <ExistingProperty s={s} />)}
    </div>
  );
}

/** Stores a typed amount in the hook's "$750,000" string form. */
const toMoney = (set: (v: string) => void) => (n: number) => set(n > 0 ? formatDollarsSigned(n) : "");

const percent = (lvr: number | null) => (lvr === null ? "—" : `${(lvr * 100).toFixed(1)}%`);

function NewPurchase({ s }: Props) {
  const id = useId();
  const price = parseCurrencyInput(s.purchasePrice);
  const deposit = parseCurrencyInput(s.depositAmount);
  const loan = Math.max(0, price - deposit);
  const lvr = price > 0 ? loan / price : null;
  const depositPct = price > 0 ? (deposit / price) * 100 : 0;
  const overPrice = price > 0 && deposit > price;
  const noLmiPct = Math.round((1 - LMI_THRESHOLD) * 100);
  const setDepositPct = (pct: number) => toMoney(s.setDepositAmount)(Math.round((price * pct) / 100));

  return (
    <>
      <AmountSection
        id={`${id}-price`}
        label="Purchase price"
        value={price}
        onChange={toMoney(s.setPurchasePrice)}
        inputStep={10_000}
      />
      <AmountSection
        id={`${id}-deposit`}
        label="Deposit"
        value={deposit}
        onChange={toMoney(s.setDepositAmount)}
        inputStep={5_000}
        percentOf={price}
        disabled={price <= 0}
        accent={lvr === null ? undefined : lvrColor(lvr)}
        scale={{
          value: depositPct,
          min: 0,
          max: 100,
          step: 1,
          onChange: setDepositPct,
          tick: (n) => `${n}%`,
          valueText: `${formatDollars(deposit) || "$0"}, ${Math.round(depositPct)}% of the price`,
        }}
        markers={price > 0 ? [{ value: noLmiPct, label: `${noLmiPct}%`, title: `${noLmiPct}%: deposit needed to avoid LMI` }] : undefined}
        aside={
          price > 0 && (
            <PercentChip
              id={`${id}-deposit-pct`}
              percent={depositPct}
              accent={overPrice ? "var(--color-data-negative)" : lvrColor(lvr)}
              onCommit={setDepositPct}
            />
          )
        }
      />
      <div className="border-t border-border-subtle px-6 py-5">
        <KeyValueList divided>
          <KeyValueRow size="md" label="Loan amount" value={formatDollars(loan) || "$0"} />
          <KeyValueRow size="md" label="Loan to value" value={percent(lvr)} accent={lvrColor(lvr)} />
        </KeyValueList>
      </div>
    </>
  );
}

function ExistingProperty({ s }: Props) {
  const id = useId();
  const value = parseCurrencyInput(s.currentValue);
  const balance = parseCurrencyInput(s.currentLoanBalance);
  const original = parseCurrencyInput(s.originalPurchasePrice);
  const lvr = value > 0 ? balance / value : null;
  const equity = value - balance;
  const growth = original > 0 ? value - original : null;

  return (
    <>
      <AmountSection
        id={`${id}-value`}
        label="Current value"
        value={value}
        onChange={toMoney(s.setCurrentValue)}
        inputStep={10_000}
      />
      <AmountSection
        id={`${id}-balance`}
        label="Loan balance"
        value={balance}
        onChange={toMoney(s.setCurrentLoanBalance)}
        inputStep={5_000}
      />
      <div className="grid grid-cols-2 gap-4 border-t border-border-subtle px-6 py-5">
        <InputField
          caps
          label="Original price"
          value={s.originalPurchasePrice}
          {...currencyInput(s.setOriginalPurchasePrice)}
          placeholder="$650,000"
        />
        <InputField
          caps
          label="Year purchased"
          inputMode="numeric"
          value={s.purchaseYear}
          onChange={(e) => s.setPurchaseYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="2021"
        />
      </div>
      <div className="border-t border-border-subtle px-6 py-5">
        <KeyValueList divided>
          <KeyValueRow size="md" label="Equity" value={formatDollarsSigned(equity)} tone={equity < 0 ? "negative" : "default"} />
          <KeyValueRow size="md" label="Loan to value" value={percent(lvr)} accent={lvrColor(lvr)} />
          <KeyValueRow
            size="md"
            label="Growth since purchase"
            value={growth === null ? "—" : formatDollarsSigned(growth)}
            tone={growth !== null && growth < 0 ? "negative" : "default"}
          />
        </KeyValueList>
      </div>
    </>
  );
}
