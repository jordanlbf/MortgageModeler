import type { CashflowState } from "@/hooks/useCashflowState";
import { currencyInput, InputField } from "./shared";

interface Props {
  s: CashflowState;
}

export default function IncomeStep({ s }: Props) {
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <InputField
        label="Taxable income (p.a.)"
        hint="Your salary/wages before tax"
        value={s.taxableIncome}
        {...currencyInput(s.setTaxableIncome)}
      />
      <InputField
        label="Capital growth assumption"
        hint="Expected annual property growth"
        value={s.capitalGrowth}
        onChange={(e) => s.setCapitalGrowth(e.target.value.replace(/[^\d.]/g, ""))}
        suffix="%"
        placeholder="5"
      />
    </div>
  );
}
