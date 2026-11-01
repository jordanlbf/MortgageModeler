"use client";

import { useId } from "react";
import { Building2, DoorOpen, Home, KeyRound, type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Stat from "@/components/patterns/blocks/Stat";
import type { CashflowState } from "@/hooks/useCashflowState";
import type { PropertyUse, PurchaseMode } from "@/lib/cashflow-types";
import { formatDollars, formatDollarsSigned, parseCurrencyInput } from "@/lib/formatters";
import { LMI_THRESHOLD, lvrColor } from "@/lib/lvr";
import { currencyInput, InputField } from "./shared";

interface Props {
  s: CashflowState;
}

/** The four things you can model: property use × purchase status, as one choice. */
const KINDS: { use: PropertyUse; mode: PurchaseMode; title: string; body: string; Icon: LucideIcon }[] = [
  { use: "investment", mode: "new", title: "New investment", body: "A rental you're about to buy", Icon: Building2 },
  { use: "investment", mode: "existing", title: "Existing investment", body: "A rental you already own", Icon: KeyRound },
  { use: "ppor", mode: "new", title: "New home", body: "A home you're buying to live in", Icon: Home },
  { use: "ppor", mode: "existing", title: "Current home", body: "The home you live in now", Icon: DoorOpen },
];

/**
 * Step 1. One tile picks both property use and purchase status; then the
 * amounts (price and deposit for a new purchase, four fields for one you own)
 * in the same boxed fields, and a row of key figures. Rendered in a `flush` WizardShell, so each section
 * sets its own padding.
 */
export default function SetupStep({ s }: Props) {
  const id = useId();
  const selected = s.propertyUse && s.purchaseMode ? `${s.propertyUse}:${s.purchaseMode}` : "";

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 px-6 pb-6">
        <Label variant="caps" id={`${id}-kind`}>What are you modelling?</Label>
        {/* Click handlers live on the items (not onValueChange) so re-clicking
            the active tile re-applies the choice and never deselects it. */}
        <ToggleGroup
          type="single"
          variant="tile"
          value={selected}
          aria-labelledby={`${id}-kind`}
          className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4"
        >
          {KINDS.map((k) => (
            <ToggleGroupItem
              key={`${k.use}:${k.mode}`}
              value={`${k.use}:${k.mode}`}
              onClick={() => { s.setPropertyUse(k.use); s.setPurchaseMode(k.mode); }}
            >
              <span className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface-hover text-fg-tertiary transition-colors group-data-[state=on]/toggle:bg-brand/15 group-data-[state=on]/toggle:text-brand">
                  <k.Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                </span>
                {/* Radio dot: filled brand ring when chosen. */}
                <span
                  aria-hidden="true"
                  className="size-4 rounded-full border-2 border-border-default transition-colors group-data-[state=on]/toggle:border-brand group-data-[state=on]/toggle:bg-brand group-data-[state=on]/toggle:shadow-[inset_0_0_0_2px_var(--color-surface-raised)]"
                />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-fg-primary">{k.title}</span>
                <span className="text-[12px] text-fg-tertiary">{k.body}</span>
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
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
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border-subtle px-6 py-5 sm:grid-cols-4">
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
  const lmi = lvr === null ? "Add a price" : lvr > LMI_THRESHOLD ? "LMI applies" : "No LMI";

  return (
    <>
      <div className="grid gap-4 border-t border-border-subtle px-6 py-5 sm:grid-cols-2">
        <InputField caps label="Purchase price" inputMode="numeric" value={s.purchasePrice} {...currencyInput(s.setPurchasePrice)} placeholder="$750,000" />
        <InputField caps label="Deposit" inputMode="numeric" value={s.depositAmount} {...currencyInput(s.setDepositAmount)} placeholder="$150,000" />
      </div>
      <Figures
        items={[
          { label: "Loan amount", value: money(loan) },
          { label: "Loan to value", value: percent(lvr), accent: lvr === null ? undefined : lvrColor(lvr) },
          { label: "Deposit", value: price > 0 ? `${Math.round(depositPct)}%` : "—" },
          { label: "Mortgage insurance", value: lmi, accent: lvr === null ? undefined : lvrColor(lvr) },
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
      <div className="grid gap-4 border-t border-border-subtle px-6 py-5 sm:grid-cols-2">
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
          { label: "Loan to value", value: percent(lvr), accent: lvr === null ? undefined : lvrColor(lvr) },
          { label: "Growth", value: growth === null ? "—" : formatDollarsSigned(growth) },
          { label: "Years held", value: yearsHeld === null ? "—" : String(yearsHeld) },
        ]}
      />
    </>
  );
}
