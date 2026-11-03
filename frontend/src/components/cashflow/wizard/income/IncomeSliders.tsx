"use client";

import type { CashflowState } from "@/hooks/useCashflowState";
import { formatDollars } from "@/lib/formatters";
import { Section } from "../loan/parts";
import { currencyInput, InputField, SliderInputField } from "../shared";
import { DEFAULT_WAGE_GROWTH, growthChange, incomeModel } from "./model";

/** Income: salary, then how fast it grows. */
export default function IncomeSliders({ s }: { s: CashflowState }) {
  const m = incomeModel(s);
  return (
    <div className="@container flex flex-col">
      <Section first>
        <InputField
          label="Salary / wage"
          hint="Before tax, per year"
          value={s.taxableIncome}
          placeholder="$120,000"
          {...currencyInput(s.setTaxableIncome)}
        />
      </Section>
      <Section>
        <SliderInputField
          label="Wage growth"
          value={s.wageGrowth}
          onType={growthChange(s)}
          onSlide={(v) => s.setWageGrowth(String(v))}
          min={0}
          max={8}
          step={0.5}
          suffix="%"
          ticks={["0%", "2%", "4%", "6%", "8%"]}
          fallback={DEFAULT_WAGE_GROWTH}
          aside={
            m.income > 0 ? (
              <span className="text-[13px] text-fg-tertiary tabular-nums">
                {"→ "}
                {formatDollars(Math.round(m.inTenYears))} in 10 yrs
              </span>
            ) : null
          }
        />
      </Section>
    </div>
  );
}
