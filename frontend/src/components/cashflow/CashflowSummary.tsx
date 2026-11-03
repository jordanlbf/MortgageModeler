"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { useWizardSteps } from "@/components/domain/wizard";
import KeyValueList, { KeyValueRow } from "@/components/patterns/blocks/KeyValueList";
import type { CashflowState } from "@/hooks/useCashflowState";
import { CASHFLOW_FORM_DEFAULTS, type CashflowFormValues } from "@/hooks/useCashflowFormState";
import type { StepId } from "@/lib/cashflow-types";
import { formatDollars, formatDollarsSigned, parseCurrencyInput } from "@/lib/formatters";
import { lvrColor } from "@/lib/lvr";
import { cn } from "@/lib/utils";
import { getCashflowSteps } from "./cashflow-steps";
import { propertyDescription } from "./property-options";
import { costsModel } from "./wizard/costs/model";
import { incomeModel } from "./wizard/income/model";
import { loanModel } from "./wizard/loan/model";
import { rentalModel } from "./wizard/rental/model";

/**
 * `fields`: the form fields a row is built from. While its step is in
 * progress, the row only shows once one of them differs from its default,
 * so pre-filled values (rate, term, costs…) don't appear before the user
 * has touched them. Rows without `fields` have blank defaults anyway.
 */
type Row = {
  label: string;
  value: string;
  accent?: string;
  /** A second figure after the value ("$600,000 · 80.0%"), in its own colour. */
  extra?: { text: string; color?: string };
  fields?: (keyof CashflowFormValues)[];
};
type Group = { title: string; stepId: StepId; rows: Row[] };

const money = (n: number) => (n > 0 ? formatDollars(n) : "—");
const percent = (lvr: number | null) => (lvr === null ? "—" : `${(lvr * 100).toFixed(1)}%`);

/**
 * Running figures for each step, as the form currently stands. A row is "—"
 * until everything it depends on has been entered (Loan and LVR need both the
 * price and the deposit); the component drops "—" rows.
 */
function summaryGroups(s: CashflowState): Group[] {
  const existing = s.purchaseMode === "existing";
  const value = parseCurrencyInput(existing ? s.currentValue : s.purchasePrice);
  const deposit = parseCurrencyInput(s.depositAmount);
  const balance = parseCurrencyInput(s.currentLoanBalance);
  const hasLoan = existing ? balance > 0 : value > 0 && deposit > 0;
  const loan = !hasLoan ? 0 : existing ? balance : Math.max(0, value - deposit);
  const lvr = hasLoan && value > 0 ? loan / value : null;
  const original = parseCurrencyInput(s.originalPurchasePrice);
  const year = Number(s.purchaseYear);
  const thisYear = new Date().getFullYear();
  const yearsHeld = s.purchaseYear.length === 4 && year <= thisYear ? thisYear - year : null;
  // The steps' own models, so the summary and each step's figures agree.
  const lm = loanModel(s);
  const loanReady = hasLoan && lm.ready;
  const rental = rentalModel(s);
  const income = incomeModel(s);
  const RENT_FIELDS: (keyof CashflowFormValues)[] = ["weeklyRent", "vacancyRate", "usePropertyManager", "managementFee"];
  const LOAN_FIELDS: (keyof CashflowFormValues)[] = ["interestRate", "loanTerm", "hasOffset", "offsetBalance", "offsetMonthlyContribution", "extraRepayments"];

  const groups: Group[] = [
    {
      title: "Property",
      stepId: "setup",
      rows: [
        { label: "Type", value: propertyDescription(s) ?? "—" },
        { label: existing ? "Current value" : "Purchase price", value: money(value) },
        existing
          ? { label: "Equity", value: value > 0 && hasLoan ? formatDollarsSigned(value - loan) : "—" }
          : {
              label: "Deposit",
              value: value > 0 && deposit > 0 ? `${formatDollars(deposit)} · ${Math.round((deposit / value) * 100)}%` : money(deposit),
            },
        {
          label: "Loan · LVR",
          value: hasLoan ? formatDollars(loan) || "$0" : "—",
          extra: lvr === null ? undefined : { text: percent(lvr), color: lvrColor(lvr) },
        },
        ...(existing
          ? [
              { label: "Growth", value: original > 0 && value > 0 ? formatDollarsSigned(value - original) : "—" },
              { label: "Years held", value: yearsHeld === null ? "—" : String(yearsHeld) },
            ]
          : []),
      ],
    },
    {
      title: "Loan",
      stepId: "loan",
      rows: [
        { label: "Interest rate", value: s.interestRate ? `${s.interestRate}%` : "—", fields: ["interestRate"] },
        { label: "Term", value: s.loanTerm ? `${s.loanTerm} years` : "—", fields: ["loanTerm"] },
        { label: "Repayment", value: loanReady ? `${formatDollars(Math.round(lm.monthly))} / mo` : "—", fields: LOAN_FIELDS },
      ],
    },
    {
      title: "Running costs",
      stepId: "costs",
      rows: [{ label: "Per year", value: money(costsModel(s).annual), fields: ["councilRates", "waterRates", "insurance", "landlordInsurance", "maintenance", "strataFees"] }],
    },
  ];
  if (s.isInvestment) {
    groups.push({
      title: "Rental income",
      stepId: "rental",
      rows: [
        { label: "Per week", value: money(rental.weekly), fields: ["weeklyRent"] },
        { label: "Net / yr", value: rental.ready ? formatDollars(Math.round(rental.net)) || "$0" : "—", fields: RENT_FIELDS },
        { label: "Net yield", value: rental.netYield === null ? "—" : `${rental.netYield.toFixed(2)}%`, fields: RENT_FIELDS },
      ],
    });
  }
  groups.push({
    title: "Income",
    stepId: "income",
    rows: [
      { label: "Salary / wage", value: money(income.income), fields: ["taxableIncome"] },
      { label: "Wage growth", value: `${income.growth}% / yr`, fields: ["wageGrowth"] },
    ],
  });
  return groups;
}

/** True once the user has changed one of the row's fields from its default. */
function edited(s: CashflowState, r: Row): boolean {
  return !r.fields || r.fields.some((f) => s[f] !== CASHFLOW_FORM_DEFAULTS[f]);
}

/**
 * "Summary so far": the wizard's right-hand column. Figures appear one by one
 * as you enter them: the current step's group (highlighted) updates live, and
 * completed steps stay listed. Only on wide screens (2xl), where the step
 * still gets enough width beside it.
 */
export default function CashflowSummary({ s, currentStep }: { s: CashflowState; currentStep: StepId }) {
  const steps = useMemo(() => getCashflowSteps(s.isInvestment, s.isLand), [s.isInvestment, s.isLand]);
  const wizard = useWizardSteps(steps, s);
  // Completed steps show every figure that's in (accepted defaults included).
  // The step being filled in shows only what the user has entered so far, live.
  // Later steps stay hidden. Groups with nothing to show are dropped.
  const groups = summaryGroups(s)
    .map((g) => {
      const complete = wizard.isComplete(g.stepId);
      if (!complete && g.stepId !== currentStep) return null;
      const rows = g.rows.filter((r) => r.value !== "—" && (complete || edited(s, r)));
      return rows.length > 0 ? { ...g, rows } : null;
    })
    .filter((g): g is Group => g !== null);

  return (
    // A labelled section, not <aside>: the wizard sits inside the page's <main>.
    <section
      aria-label="Summary so far"
      className="hidden w-[248px] shrink-0 flex-col gap-5 overflow-y-auto border-l border-border-subtle bg-surface-subtle px-6 py-7 2xl:flex"
    >
      <Label variant="caps" asChild><h2>Summary so far</h2></Label>
      {groups.length === 0 && (
        <p className="text-[12px] leading-relaxed text-fg-tertiary">Figures fill in here as you go.</p>
      )}
      {groups.map((g) => (
        <div key={g.stepId} className={cn("flex flex-col gap-2 transition-opacity duration-200", g.stepId !== currentStep && "opacity-70")}>
          <span className={cn("text-[12px] font-medium", g.stepId === currentStep ? "text-brand" : "text-fg-secondary")}>{g.title}</span>
          <KeyValueList>
            {g.rows.map((r) => (
              <KeyValueRow
                key={r.label}
                label={r.label}
                accent={r.accent}
                value={
                  r.extra ? (
                    <>
                      {r.value}
                      <span className="text-fg-tertiary"> · </span>
                      <span style={r.extra.color ? { color: r.extra.color } : undefined}>{r.extra.text}</span>
                    </>
                  ) : (
                    r.value
                  )
                }
              />
            ))}
          </KeyValueList>
        </div>
      ))}
    </section>
  );
}
