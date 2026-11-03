"use client";

import { useId, useState, type ReactNode } from "react";
import { Home, TrendingUp, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { CashflowState } from "@/hooks/useCashflowState";
import type { PropertyUse } from "@/lib/cashflow-types";
import { formatDollars, formatDollarsSigned, parseCurrencyInput } from "@/lib/formatters";
import { lvrColor } from "@/lib/lvr";
import {
  applyPurchaseMode,
  applyType,
  applyUse,
  asksNewBuild,
  NEW_BUILD,
  PROPERTY_TYPES,
  PURCHASE_MODES,
  setupAnswered,
} from "../property-options";
import { currencyInput, Figures, InputField, TileChoice } from "./shared";

interface Props {
  s: CashflowState;
}

const USES: { value: PropertyUse; title: string; Icon: LucideIcon }[] = [
  { value: "investment", title: "Investment", Icon: TrendingUp },
  { value: "ppor", title: "Home", Icon: Home },
];

type QuestionKey = "use" | "type" | "mode" | "build";

interface Question {
  key: QuestionKey;
  label: string;
  /** The chosen option's title, or null while unanswered. */
  answer: string | null;
  /** The question's tiles; `done` is called after a pick so the question can close. */
  tiles: (labelId: string, done: () => void) => ReactNode;
}

const titleOf = <T extends string>(options: { value: T; title: string }[], value: T | null) =>
  options.find((o) => o.value === value)?.title ?? null;

/**
 * The questions that apply so far, in order. Each appears once the one above
 * is answered. "New build?" is asked only when buying an investment building:
 * it only changes depreciation, but people expect to be asked it up front.
 */
function questions(s: CashflowState): Question[] {
  const list: Question[] = [
    {
      key: "use",
      label: "What are you modelling?",
      answer: titleOf(USES, s.propertyUse),
      tiles: (id, done) => (
        <TileChoice labelId={id} label="What are you modelling?" value={s.propertyUse} options={USES} onPick={(v) => { applyUse(s, v); done(); }} />
      ),
    },
  ];
  if (!s.propertyUse) return list;
  list.push({
    key: "type",
    label: "What type of property?",
    answer: titleOf(PROPERTY_TYPES, s.propertyType),
    tiles: (id, done) => (
      <TileChoice labelId={id} label="What type of property?" value={s.propertyType} options={PROPERTY_TYPES} onPick={(v) => { applyType(s, v); done(); }} />
    ),
  });
  if (!s.propertyType) return list;
  list.push({
    key: "mode",
    label: "Buying or already own?",
    answer: titleOf(PURCHASE_MODES, s.purchaseMode),
    tiles: (id, done) => (
      <TileChoice labelId={id} label="Buying or already own?" value={s.purchaseMode} options={PURCHASE_MODES} onPick={(v) => { applyPurchaseMode(s, v); done(); }} />
    ),
  });
  if (asksNewBuild(s)) {
    const value = s.newBuild === null ? null : s.newBuild ? "yes" : "no";
    list.push({
      key: "build",
      label: "New build?",
      answer: titleOf(NEW_BUILD, value),
      tiles: (id, done) => (
        <TileChoice labelId={id} label="New build?" value={value} options={NEW_BUILD} onPick={(v) => { s.setNewBuild(v === "yes"); done(); }} />
      ),
    });
  }
  return list;
}

/**
 * Step 1, one question at a time: only the current question shows its tiles;
 * answered ones fold into one-line rows with "Change", so the amounts stay
 * near the top. Then the amounts in boxed fields and a row of key figures.
 * Rendered in a `flush` WizardShell, so each section sets its own padding.
 */
export default function SetupStep({ s }: Props) {
  const id = useId();
  const [editing, setEditing] = useState<QuestionKey | null>(null);
  const list = questions(s);
  // The question being changed, else the first unanswered one (none once all are answered).
  const current = list.some((q) => q.key === editing) ? editing : (list.find((q) => q.answer === null)?.key ?? null);
  const selected = setupAnswered(s);

  return (
    // Container queries: the grids follow the step's own width, which depends on
    // the step list and summary columns beside it, not on the screen size.
    <div className="@container flex flex-col">
      <div className="flex flex-col px-6 pb-5">
        {list.map((q) =>
          q.key === current ? (
            <div key={q.key} className="py-3 first:pt-0">
              {q.tiles(`${id}-${q.key}`, () => setEditing(null))}
            </div>
          ) : (
            <div key={q.key} className="flex min-h-11 items-center justify-between gap-3 border-b border-border-subtle py-2 last:border-b-0">
              <Label variant="caps" asChild><span>{q.label}</span></Label>
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-semibold text-fg-primary">{q.answer}</span>
                <Button
                  type="button"
                  variant="link-quiet"
                  className="text-[12px] hover:text-brand"
                  aria-label={`Change: ${q.label}`}
                  onClick={() => setEditing(q.key)}
                >
                  Change
                </Button>
              </div>
            </div>
          ),
        )}
      </div>

      {selected && (s.purchaseMode === "existing" ? <ExistingProperty s={s} /> : <NewPurchase s={s} />)}
    </div>
  );
}

const percent = (lvr: number | null) => (lvr === null ? "—" : `${(lvr * 100).toFixed(1)}%`);

/** Purchase price and deposit, in the same boxed fields as an existing property. */
function NewPurchase({ s }: Props) {
  const price = parseCurrencyInput(s.purchasePrice);
  const deposit = parseCurrencyInput(s.depositAmount);
  // Loan, LVR and deposit % all need both amounts (a price alone would read as a 100% LVR).
  const both = price > 0 && deposit > 0;
  const loan = Math.max(0, price - deposit);
  const lvr = both ? loan / price : null;

  return (
    <>
      <div className="grid gap-4 border-t border-border-subtle px-6 py-5 @min-[26rem]:grid-cols-2">
        <InputField caps label="Purchase price" inputMode="numeric" value={s.purchasePrice} {...currencyInput(s.setPurchasePrice)} placeholder="$750,000" />
        <InputField caps label="Deposit" inputMode="numeric" value={s.depositAmount} {...currencyInput(s.setDepositAmount)} placeholder="$150,000" />
      </div>
      <Figures
        items={[
          { label: "Loan", value: both ? formatDollars(loan) || "$0" : "—" },
          { label: "LVR", value: percent(lvr), accent: lvr === null ? undefined : lvrColor(lvr) },
          { label: "Deposit", value: both ? `${Math.round((deposit / price) * 100)}%` : "—" },
        ]}
      />
    </>
  );
}

function ExistingProperty({ s }: Props) {
  const value = parseCurrencyInput(s.currentValue);
  const balance = parseCurrencyInput(s.currentLoanBalance);
  const original = parseCurrencyInput(s.originalPurchasePrice);
  // Equity and LVR need both the value and the balance, as in the summary.
  const both = value > 0 && balance > 0;
  const lvr = both ? balance / value : null;
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
          { label: "Equity", value: both ? formatDollarsSigned(value - balance) : "—" },
          { label: "LVR", value: percent(lvr), accent: lvr === null ? undefined : lvrColor(lvr) },
          { label: "Growth", value: growth === null ? "—" : formatDollarsSigned(growth) },
          { label: "Years held", value: yearsHeld === null ? "—" : String(yearsHeld) },
        ]}
      />
    </>
  );
}
