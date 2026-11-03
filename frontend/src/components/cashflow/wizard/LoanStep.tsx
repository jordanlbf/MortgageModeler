"use client";

import { useState } from "react";
import type { CashflowState } from "@/hooks/useCashflowState";
import { formatDollars } from "@/lib/formatters";
import { FeatureToggle, Figures, SliderInputField } from "./shared";
import { loanModel, payoffYear } from "./loan/model";
import { ExtraFields, featureToggles, OffsetFields, PayoffNote, rateChange, Section, SectionLabel, termChange } from "./loan/parts";

/**
 * Loan Terms. Rate and term are sliders with an exact-value field beside
 * each; offset and extra repayments are chips that open their fields. The
 * figures sit last so they reflect every input above them, extras included.
 */
export default function LoanStep({ s }: { s: CashflowState }) {
  const [extraOn, setExtraOn] = useState(!!s.extraRepayments);
  const f = featureToggles(s, extraOn, setExtraOn);
  const m = loanModel(s);

  return (
    <div className="@container flex flex-col">
      <Section first>
        <div className="flex flex-col gap-6">
          <SliderInputField
            label="Interest rate"
            value={s.interestRate}
            onType={rateChange(s)}
            onSlide={(v) => s.setInterestRate(String(Math.round(v * 100) / 100))}
            min={2}
            max={10}
            step={0.05}
            suffix="%"
            ticks={["2%", "4%", "6%", "8%", "10%"]}
            fallback={6.5}
          />
          <SliderInputField
            label="Loan term"
            value={s.loanTerm}
            onType={termChange(s)}
            onSlide={(v) => s.setLoanTerm(String(v))}
            min={5}
            max={30}
            step={1}
            suffix="yrs"
            ticks={["5", "10", "15", "20", "25", "30"]}
            fallback={30}
          />
        </div>
      </Section>

      <Section>
        <SectionLabel>Add to your loan</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <FeatureToggle on={f.offsetOn} onChange={f.setOffset}>Offset account</FeatureToggle>
          <FeatureToggle on={f.extraOn} onChange={f.setExtra}>Extra repayments</FeatureToggle>
        </div>
        {(f.offsetOn || f.extraOn) && (
          <div className="mt-5 flex flex-col gap-4">
            {f.offsetOn && <OffsetFields s={s} />}
            {f.extraOn && <ExtraFields s={s} />}
            <PayoffNote m={m} />
          </div>
        )}
      </Section>

      <Figures
        items={[
          { label: "Repayment / mo", value: m.ready ? formatDollars(m.monthly) : "—" },
          // Extras are monthly; spread them over the year so both figures include them.
          { label: "Per week", value: m.ready ? formatDollars(m.repayment("weekly") + (m.monthly - m.repayment("monthly")) * 12 / 52) : "—" },
          { label: "Total interest", value: m.ready ? formatDollars(m.withExtras.totalInterest) : "—" },
          { label: "Debt-free", value: m.ready ? payoffYear(m.withExtras.months) : "—" },
        ]}
      />
    </div>
  );
}
