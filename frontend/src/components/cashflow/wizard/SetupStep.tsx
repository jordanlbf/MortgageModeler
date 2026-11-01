"use client";

import { useId } from "react";
import { Building2, Home, KeyRound, Plus, type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Stat from "@/components/patterns/blocks/Stat";
import type { CashflowState } from "@/hooks/useCashflowState";
import type { PropertyUse, PurchaseMode } from "@/lib/cashflow-types";
import { formatDollars, formatDollarsSigned, parseCurrencyInput } from "@/lib/formatters";
import { lvrColor } from "@/lib/lvr";
import { cn } from "@/lib/utils";
import { currencyInput, InputField } from "./shared";

interface Props {
  s: CashflowState;
}

const USES: { value: PropertyUse; title: string; Icon: LucideIcon }[] = [
  { value: "investment", title: "Investment", Icon: Building2 },
  { value: "ppor", title: "Home", Icon: Home },
];

const MODES: { value: PurchaseMode; title: string; Icon: LucideIcon }[] = [
  { value: "new", title: "New purchase", Icon: Plus },
  { value: "existing", title: "Already own", Icon: KeyRound },
];

/** One row of tiles: icon, title, selection dot. */
function TileChoice<T extends string>({
  labelId,
  label,
  value,
  options,
  onPick,
}: {
  labelId: string;
  label: string;
  value: T | null;
  options: { value: T; title: string; Icon: LucideIcon }[];
  onPick: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Label variant="caps" id={labelId}>{label}</Label>
      {/* Click handlers live on the items (not onValueChange) so re-clicking
          the active tile re-applies the choice and never deselects it. */}
      <ToggleGroup
        type="single"
        variant="tile"
        value={value ?? ""}
        aria-labelledby={labelId}
        className="grid grid-cols-1 gap-2.5 @min-[26rem]:grid-cols-2"
      >
        {options.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value} onClick={() => onPick(o.value)}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-fg-tertiary transition-colors group-data-[state=on]/toggle:bg-brand/15 group-data-[state=on]/toggle:text-brand">
              <o.Icon size={16} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-fg-primary">{o.title}</span>
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded-full border-2 border-border-default transition-colors group-data-[state=on]/toggle:border-brand group-data-[state=on]/toggle:bg-brand group-data-[state=on]/toggle:shadow-[inset_0_0_0_2px_var(--color-surface-raised)]"
            />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

/**
 * Step 1, one decision at a time: property use (Investment / Home), then,
 * once that's picked, purchase status (New purchase / Already own). Then the
 * amounts in boxed fields and a row of key figures. Rendered in a `flush`
 * WizardShell, so each section sets its own padding.
 */
export default function SetupStep({ s }: Props) {
  const id = useId();
  const selected = !!s.propertyUse && !!s.purchaseMode;

  return (
    // Container queries: the grids follow the step's own width, which depends on
    // the step list and summary columns beside it, not on the screen size.
    <div className="@container flex flex-col">
      <div className="flex flex-col gap-6 px-6 pb-6">
        <TileChoice
          labelId={`${id}-use`}
          label="What are you modelling?"
          value={s.propertyUse}
          options={USES}
          onPick={s.setPropertyUse}
        />
        {s.propertyUse && (
          <TileChoice
            labelId={`${id}-mode`}
            label="Buying or already own?"
            value={s.purchaseMode}
            options={MODES}
            onPick={s.setPurchaseMode}
          />
        )}
      </div>

      {selected && (s.purchaseMode === "new" ? <NewPurchase s={s} /> : <ExistingProperty s={s} />)}
    </div>
  );
}

const money = (n: number) => (n > 0 ? formatDollars(n) : "—");
const percent = (lvr: number | null) => (lvr === null ? "—" : `${(lvr * 100).toFixed(1)}%`);

type Figure = { label: string; value: string; accent?: string };

/** The step's key figures, in one row under the amounts. */
function Figures({ items }: { items: Figure[] }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border-subtle px-6 py-5",
        items.length === 3 ? "@min-[30rem]:grid-cols-3" : "@min-[30rem]:grid-cols-4",
      )}
    >
      {items.map((f) => (
        <Stat
          key={f.label}
          size="sm"
          label={f.label}
          value={<span style={f.accent ? { color: f.accent } : undefined}>{f.value}</span>}
        />
      ))}
    </div>
  );
}

/** Purchase price and deposit, in the same boxed fields as an existing property. */
function NewPurchase({ s }: Props) {
  const price = parseCurrencyInput(s.purchasePrice);
  const deposit = parseCurrencyInput(s.depositAmount);
  const loan = Math.max(0, price - deposit);
  const lvr = price > 0 ? loan / price : null;
  const depositPct = price > 0 ? (deposit / price) * 100 : 0;

  return (
    <>
      <div className="grid gap-4 border-t border-border-subtle px-6 py-5 @min-[26rem]:grid-cols-2">
        <InputField caps label="Purchase price" inputMode="numeric" value={s.purchasePrice} {...currencyInput(s.setPurchasePrice)} placeholder="$750,000" />
        <InputField caps label="Deposit" inputMode="numeric" value={s.depositAmount} {...currencyInput(s.setDepositAmount)} placeholder="$150,000" />
      </div>
      <Figures
        items={[
          { label: "Loan", value: money(loan) },
          { label: "LVR", value: percent(lvr), accent: lvr === null ? undefined : lvrColor(lvr) },
          { label: "Deposit", value: price > 0 ? `${Math.round(depositPct)}%` : "—" },
        ]}
      />
    </>
  );
}

function ExistingProperty({ s }: Props) {
  const value = parseCurrencyInput(s.currentValue);
  const balance = parseCurrencyInput(s.currentLoanBalance);
  const original = parseCurrencyInput(s.originalPurchasePrice);
  const lvr = value > 0 ? balance / value : null;
  const growth = original > 0 && value > 0 ? value - original : null;
  const year = Number(s.purchaseYear);
  const thisYear = new Date().getFullYear();
  const yearsHeld = s.purchaseYear.length === 4 && year <= thisYear ? thisYear - year : null;

  return (
    <>
      <div className="grid gap-4 border-t border-border-subtle px-6 py-5 @min-[26rem]:grid-cols-2">
        <InputField caps label="Current value" inputMode="numeric" value={s.currentValue} {...currencyInput(s.setCurrentValue)} placeholder="$850,000" />
        <InputField caps label="Loan balance" inputMode="numeric" value={s.currentLoanBalance} {...currencyInput(s.setCurrentLoanBalance)} placeholder="$480,000" />
        <InputField caps label="Original price" inputMode="numeric" value={s.originalPurchasePrice} {...currencyInput(s.setOriginalPurchasePrice)} placeholder="$650,000" />
        <InputField
          caps
          label="Year purchased"
          inputMode="numeric"
          value={s.purchaseYear}
          onChange={(e) => s.setPurchaseYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="2021"
        />
      </div>
      <Figures
        items={[
          { label: "Equity", value: value > 0 ? formatDollarsSigned(value - balance) : "—" },
          { label: "LVR", value: percent(lvr), accent: lvr === null ? undefined : lvrColor(lvr) },
          { label: "Growth", value: growth === null ? "—" : formatDollarsSigned(growth) },
          { label: "Years held", value: yearsHeld === null ? "—" : String(yearsHeld) },
        ]}
      />
    </>
  );
}
