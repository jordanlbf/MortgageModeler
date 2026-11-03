"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import type { CashflowState } from "@/hooks/useCashflowState";
import { formatDollars } from "@/lib/formatters";
import { lvrColor } from "@/lib/lvr";
import { cn } from "@/lib/utils";
import { currencyInput, InputField } from "../shared";
import { formatMonths, type LoanModel } from "./model";

/** One edge-to-edge band of the flush step, divided like Property setup. */
export function Section({ children, first, className }: { children: ReactNode; first?: boolean; className?: string }) {
  return (
    <section className={cn("px-6", first ? "pb-5" : "border-t border-border-subtle py-5", className)}>{children}</section>
  );
}

/** The loan carried over from Property setup; sits beside the Loan step title. */
export function BorrowingLine({ m }: { m: LoanModel }) {
  return (
    <p className="text-[13px] text-fg-tertiary">
      Borrowing <span className="font-semibold text-fg-primary tabular-nums">{formatDollars(m.principal) || "$0"}</span>
      {m.lvr !== null && (
        <>
          {" "}at{" "}
          <span className="font-semibold tabular-nums" style={{ color: lvrColor(m.lvr) }}>
            {(m.lvr * 100).toFixed(1)}% LVR
          </span>
        </>
      )}
    </p>
  );
}

export const rateChange = (s: CashflowState) => (e: React.ChangeEvent<HTMLInputElement>) =>
  s.setInterestRate(e.target.value.replace(/[^\d.]/g, "").slice(0, 5));
export const termChange = (s: CashflowState) => (e: React.ChangeEvent<HTMLInputElement>) =>
  s.setLoanTerm(e.target.value.replace(/\D/g, "").slice(0, 2));

/** Feature on/off, clearing its values when switched off (as the current step does). */
export function featureToggles(s: CashflowState, extraOn: boolean, setExtraOn: (v: boolean) => void) {
  return {
    offsetOn: s.hasOffset,
    extraOn,
    setOffset(on: boolean) {
      s.setHasOffset(on);
      if (!on) {
        s.setOffsetBalance("");
        s.setOffsetMonthlyContribution("");
      }
    },
    setExtra(on: boolean) {
      setExtraOn(on);
      if (!on) s.setExtraRepayments("");
    },
  };
}

export function OffsetFields({ s }: { s: CashflowState }) {
  return (
    <div className="grid gap-4 @min-[26rem]:grid-cols-2">
      <InputField caps label="Offset balance" inputMode="numeric" value={s.offsetBalance} {...currencyInput(s.setOffsetBalance)} placeholder="$50,000" />
      <InputField caps label="Added monthly" inputMode="numeric" value={s.offsetMonthlyContribution} {...currencyInput(s.setOffsetMonthlyContribution)} placeholder="$500" />
    </div>
  );
}

export function ExtraFields({ s }: { s: CashflowState }) {
  return (
    <div className="grid gap-4 @min-[26rem]:grid-cols-2">
      <InputField caps label="Extra per month" inputMode="numeric" value={s.extraRepayments} {...currencyInput(s.setExtraRepayments)} placeholder="$200" />
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Label variant="caps" asChild className="mb-3">
      <h3>{children}</h3>
    </Label>
  );
}

/** What the offset / extra repayments buy: "Paid off in 25 yrs 3 mo · Saves $84k". */
export function PayoffNote({ m }: { m: LoanModel }) {
  if (!m.ready || m.interestSaved < 1) return null;
  const saved = m.interestSaved >= 10000 ? `$${Math.round(m.interestSaved / 1000)}k` : formatDollars(Math.round(m.interestSaved));
  return (
    <p className="text-[13px] text-fg-tertiary tabular-nums">
      Paid off in <span className="font-semibold text-fg-primary">{formatMonths(m.withExtras.months)}</span>
      <span aria-hidden="true"> · </span>
      <span className="sr-only">, </span>
      <span className="font-semibold text-brand">Saves {saved}</span>
    </p>
  );
}
