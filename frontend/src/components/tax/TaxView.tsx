"use client";

import { useState } from "react";
import { useTaxState, type TaxSource } from "@/hooks/useTaxState";
import CalculatorLayout from "@/components/patterns/layouts/CalculatorLayout";
import InlineAlert from "@/components/patterns/blocks/InlineAlert";
import { Button } from "@/components/ui/button";
import TaxInputPanel from "./TaxInputPanel";
import TaxTakeHomeCard from "./TaxTakeHomeCard";
import TaxPayCard from "./TaxPayCard";
import { itemSum, PERIODS, type Period } from "./items";

/**
 * Tax calculator: the input card on the left; on the right what you keep
 * against what you pay, then your pay less each tax. Both cards follow the
 * same pay period, which starts at a year.
 *
 * `source` is for the kitchen sink (sample data instead of the API).
 */
export default function TaxView({ source }: { source?: TaxSource } = {}) {
  const tax = useTaxState(source);
  const [period, setPeriod] = useState<Period>("year");
  const p = PERIODS.find((x) => x.value === period)!;
  const unit = p.label.toLowerCase();
  const s = tax.results ? itemSum(tax.inputs, tax.results) : null;
  const fade = `transition-opacity duration-200 ${tax.loading && tax.results ? "opacity-60" : ""}`;

  return (
    <CalculatorLayout inputs={<TaxInputPanel tax={tax} />} aria-labelledby="tax-title" aria-busy={tax.loading}>
      {tax.error && (
        <InlineAlert>
          {tax.error}
          <Button type="button" variant="link-muted" className="ml-2 font-semibold text-status-error underline underline-offset-2 hover:text-status-error" onClick={tax.retry}>
            Try again
          </Button>
        </InlineAlert>
      )}
      <TaxTakeHomeCard tax={tax} s={s} period={period} onPeriodChange={setPeriod} per={p.per} unit={unit} className={fade} />
      {s && <TaxPayCard s={s} per={p.per} unit={unit} className={fade} />}
    </CalculatorLayout>
  );
}
