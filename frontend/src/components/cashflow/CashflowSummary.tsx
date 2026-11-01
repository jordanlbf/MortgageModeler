"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { useWizardSteps } from "@/components/domain/wizard";
import KeyValueList, { KeyValueRow } from "@/components/patterns/blocks/KeyValueList";
import type { CashflowState } from "@/hooks/useCashflowState";
import { paymentFromLoanAmount } from "@/lib/calculations";
import type { StepId } from "@/lib/cashflow-types";
import { formatDollars, formatDollarsSigned, parseCurrencyInput } from "@/lib/formatters";
import { lvrColor } from "@/lib/lvr";
import { cn } from "@/lib/utils";
import { getCashflowSteps } from "./cashflow-steps";

type Row = { label: string; value: string; accent?: string };
type Group = { title: string; stepId: StepId; rows: Row[] };

const money = (n: number) => (n > 0 ? formatDollars(n) : "—");
const percent = (lvr: number | null) => (lvr === null ? "—" : `${(lvr * 100).toFixed(1)}%`);

/**
 * Running figures for each step, as the form currently stands. A row is "—"
 * until everything it depends on has been entered (Loan and LVR need both the
 * price and the deposit), and "—" rows aren't shown.
 */
function summaryGroups(s: CashflowState): Group[] {
  const existing = s.purchaseMode === "existing";
  const value = parseCurrencyInput(existing ? s.currentValue : s.purchasePrice);
  const deposit = parseCurrencyInput(s.depositAmount);
  const balance = parseCurrencyInput(s.currentLoanBalance);
  const hasLoan = existing ? balance > 0 : value > 0 && deposit > 0;
  const loan = !hasLoan ? 0 : existing ? balance : Math.max(0, value - deposit);
  const lvr = hasLoan && value > 0 ? loan / value : null;
  const rate = parseFloat(s.interestRate) / 100 || 0;
  const years = parseFloat(s.loanTerm) || 30;
  const repayment = rate > 0 && loan > 0 ? Math.round(paymentFromLoanAmount(loan, rate, years, 12)) : 0;
  const costs =
    parseCurrencyInput(s.councilRates) +
    parseCurrencyInput(s.waterRates) +
    parseCurrencyInput(s.insurance) +
    (s.hasStrata ? parseCurrencyInput(s.strataFees) * 4 : 0);

  const groups: Group[] = [
    {
      title: "Property",
      stepId: "setup",
      rows: [
        { label: existing ? "Current value" : "Purchase price", value: money(value) },
        existing
          ? { label: "Equity", value: value > 0 && hasLoan ? formatDollarsSigned(value - loan) : "—" }
          : { label: "Deposit", value: money(deposit) },
        { label: "Loan", value: hasLoan ? formatDollars(loan) || "$0" : "—" },
        { label: "LVR", value: percent(lvr), accent: lvr === null ? undefined : lvrColor(lvr) },
      ],
    },
    {
      title: "Loan",
      stepId: "loan",
      rows: [
        { label: "Interest rate", value: s.interestRate ? `${s.interestRate}%` : "—" },
        { label: "Term", value: s.loanTerm ? `${s.loanTerm} years` : "—" },
        { label: "Repayment", value: repayment > 0 ? `${formatDollars(repayment)} / mo` : "—" },
      ],
    },
    { title: "Running costs", stepId: "costs", rows: [{ label: "Per year", value: money(costs) }] },
  ];
  if (s.isInvestment) {
    groups.push({ title: "Rental income", stepId: "rental", rows: [{ label: "Per week", value: money(parseCurrencyInput(s.weeklyRent)) }] });
  }
  groups.push({ title: "Income", stepId: "income", rows: [{ label: "Taxable income", value: money(parseCurrencyInput(s.taxableIncome)) }] });
  // Keep only the figures that are in; drop groups with none yet.
  return groups
    .map((g) => ({ ...g, rows: g.rows.filter((r) => r.value !== "—") }))
    .filter((g) => g.rows.length > 0);
}

/**
 * "Summary so far": the wizard's right-hand column. Figures appear one by one
 * as you enter them: the current step's group (highlighted) updates live, and
 * completed steps stay listed. Only on wide screens (2xl), where the step
 * still gets enough width beside it.
 */
export default function CashflowSummary({ s, currentStep }: { s: CashflowState; currentStep: StepId }) {
  const steps = useMemo(() => getCashflowSteps(s.isInvestment), [s.isInvestment]);
  const wizard = useWizardSteps(steps, s);
  // Completed steps, plus the one being filled in (live, as you type).
  const groups = summaryGroups(s).filter((g) => g.stepId === currentStep || wizard.isComplete(g.stepId));

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
              <KeyValueRow key={r.label} label={r.label} value={r.value} accent={r.accent} />
            ))}
          </KeyValueList>
        </div>
      ))}
    </section>
  );
}
