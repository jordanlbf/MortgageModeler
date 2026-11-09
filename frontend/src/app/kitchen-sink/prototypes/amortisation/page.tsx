"use client";

/*
 * Prototypes: how the Amortisation headline card could show what an offset
 * account saves (#124). Temporary: once one is chosen it moves into
 * AmortisationSummaryCard and this page goes. Built only from the design
 * system; sample data from screens-sample.ts.
 */

import { useAmortisationState, type AmortisationState } from "@/hooks/useAmortisationState";
import { FREQ_LABELS } from "@/lib/constants";
import { formatCurrency, formatDollars } from "@/lib/formatters";
import SectionCard from "@/components/patterns/cards/SectionCard";
import Stat from "@/components/patterns/blocks/Stat";
import InlineAlert from "@/components/patterns/blocks/InlineAlert";
import KeyValueList, { KeyValueRow } from "@/components/patterns/blocks/KeyValueList";
import SectionTitle from "@/components/patterns/blocks/SectionTitle";
import { AMORTISATION, AMORTISATION_OFFSET } from "../../sections/screens-sample";

const money = (n: number) => formatDollars(Math.round(n)) || "$0";
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;
/** 75 → "6 years 3 months". */
const span = (months: number) =>
  [Math.floor(months / 12) > 0 && plural(Math.floor(months / 12), "year"), months % 12 > 0 && plural(months % 12, "month")].filter(Boolean).join(" ") || "0 months";
const NO_OFFSET = "Add an offset balance to see how much interest it saves.";

/** The current card's figures, shared by every prototype. */
function Figures({ am, extra, cols = "sm:grid-cols-4" }: { am: AmortisationState; extra?: React.ReactNode; cols?: string }) {
  const s = am.summary!;
  return (
    <div className={`grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border-subtle pt-5 ${cols}`}>
      <Stat label="Loan amount" value={money(s.loanAmount)} size="sm">
        <span className="text-[12px] text-fg-tertiary tabular-nums">{(s.lvr * 100).toFixed(1)}% LVR</span>
      </Stat>
      <Stat label="Total interest" value={money(s.totalInterest)} size="sm" tone="negative" />
      <Stat label="Total repaid" value={money(s.totalRepaid)} size="sm" />
      <Stat label="Paid off in" value={span(s.payoffYears * 12 + s.payoffMonths)} size="sm" />
      {extra}
    </div>
  );
}

const Hero = ({ am }: { am: AmortisationState }) => (
  <Stat label={`Repayment a ${FREQ_LABELS[am.inputs.frequency]}`} value={formatCurrency(am.summary!.payment)} size="hero" />
);

/** 1. One more figure in the row. */
function ExtraFigure({ am }: { am: AmortisationState }) {
  const o = am.summary!.offset;
  return (
    <SectionCard title="Amortisation">
      <div className="flex flex-col gap-6">
        <Hero am={am} />
        <Figures
          am={am}
          cols="sm:grid-cols-3 lg:grid-cols-5"
          extra={
            <Stat label="Offset saves" value={o ? money(o.interestSaved) : "—"} size="sm" tone={o ? "positive" : "muted"}>
              <span className="text-[12px] text-fg-tertiary">{o ? `Paid off ${span(o.monthsSooner)} sooner` : "No offset yet"}</span>
            </Stat>
          }
        />
      </div>
    </SectionCard>
  );
}

/** 2. A one-line note under the repayment. */
function Banner({ am }: { am: AmortisationState }) {
  const o = am.summary!.offset;
  return (
    <SectionCard title="Amortisation">
      <div className="flex flex-col gap-6">
        <Hero am={am} />
        {o ? (
          <InlineAlert tone="success">
            Your offset saves <strong className="tabular-nums">{money(o.interestSaved)}</strong> in interest and pays the loan off{" "}
            <strong>{span(o.monthsSooner)}</strong> sooner.
          </InlineAlert>
        ) : (
          <InlineAlert tone="info">{NO_OFFSET}</InlineAlert>
        )}
        <Figures am={am} />
      </div>
    </SectionCard>
  );
}

/** 3. The loan with and without the offset, side by side. */
function WithWithout({ am }: { am: AmortisationState }) {
  const s = am.summary!;
  const o = s.offset;
  const months = s.payoffYears * 12 + s.payoffMonths;
  return (
    <SectionCard title="Amortisation">
      <div className="flex flex-col gap-6">
        <Hero am={am} />
        <Figures am={am} />
        <div className="flex flex-col gap-3 border-t border-border-subtle pt-5">
          <SectionTitle as="h3" className="text-[15px]">Your offset account</SectionTitle>
          {o ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <KeyValueList divided>
                <KeyValueRow label="Interest without it" value={money(o.interestWithout)} size="md" tone="muted" />
                <KeyValueRow label="Interest with it" value={money(s.totalInterest)} size="md" />
                <KeyValueRow label="You save" value={money(o.interestSaved)} size="md" tone="positive" total />
              </KeyValueList>
              <KeyValueList divided>
                <KeyValueRow label="Paid off without it" value={span(o.monthsWithout)} size="md" tone="muted" />
                <KeyValueRow label="Paid off with it" value={span(months)} size="md" />
                <KeyValueRow label="Sooner by" value={span(o.monthsSooner)} size="md" tone="positive" total />
              </KeyValueList>
            </div>
          ) : (
            <p className="text-[13px] text-fg-tertiary">{NO_OFFSET}</p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

/** 4. The saving beside the repayment, with the payoff shown on a timeline of the term. */
function SavingHero({ am }: { am: AmortisationState }) {
  const s = am.summary!;
  const o = s.offset;
  const months = s.payoffYears * 12 + s.payoffMonths;
  const term = am.inputs.years * 12;
  const at = Math.min(100, (months / term) * 100);
  return (
    <SectionCard title="Amortisation">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <Hero am={am} />
          <Stat
            label="Your offset saves"
            value={o ? money(o.interestSaved) : "—"}
            size="lg"
            tone={o ? "positive" : "muted"}
            className="items-end text-right"
          >
            <span className="text-[12px] text-fg-tertiary">{o ? "in interest over the loan" : "No offset yet"}</span>
          </Stat>
        </div>
        <div className="flex flex-col gap-2">
          <div className="relative h-2 rounded-full bg-surface-subtle" role="img" aria-label={`Paid off after ${span(months)} of a ${am.inputs.years}-year term`}>
            <span className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${at}%` }} />
            {o && <span className="absolute inset-y-0 rounded-r-full bg-data-positive/25" style={{ left: `${at}%`, right: 0 }} />}
          </div>
          <div className="flex justify-between text-[12px] text-fg-tertiary tabular-nums">
            <span>Paid off in <span className="font-semibold text-fg-secondary">{span(months)}</span></span>
            <span>{o ? <><span className="font-semibold text-data-positive">{span(o.monthsSooner)}</span> sooner than the {am.inputs.years}-year term</> : `${am.inputs.years}-year term`}</span>
          </div>
        </div>
        <Figures am={am} />
      </div>
    </SectionCard>
  );
}

const PROTOTYPES = [
  { name: "1 · Extra figure", idea: "\"Offset saves\" joins the row of figures. Smallest change; easy to miss.", Card: ExtraFigure },
  { name: "2 · Banner", idea: "A success note under the repayment says what the offset saves, in a sentence.", Card: Banner },
  { name: "3 · With vs without", idea: "A small comparison: interest and payoff time with and without the offset.", Card: WithWithout },
  { name: "4 · Saving as a hero", idea: "The saving sits beside the repayment, and a timeline shows the loan ending early.", Card: SavingHero },
];

export default function AmortisationPrototypesPage() {
  const withOffset = useAmortisationState(AMORTISATION_OFFSET);
  const without = useAmortisationState(AMORTISATION);
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-12 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-2">
        <SectionTitle as="h1">Amortisation · offset saving prototypes</SectionTitle>
        <p className="text-[13px] text-fg-tertiary">
          Sample: $400k at 6% over 30 years, monthly. Left: $50k in the offset plus $500 a month. Right: no offset.
        </p>
      </header>
      {PROTOTYPES.map(({ name, idea, Card }) => (
        <section key={name} className="flex flex-col gap-4" aria-label={name}>
          <div className="flex flex-col gap-1">
            <SectionTitle as="h2" className="text-[17px]">{name}</SectionTitle>
            <p className="text-[13px] text-fg-tertiary">{idea}</p>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card am={withOffset} />
            <Card am={without} />
          </div>
        </section>
      ))}
    </main>
  );
}
