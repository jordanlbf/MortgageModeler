"use client";

import { useAmortisationState, type AmortisationSource } from "@/hooks/useAmortisationState";
import CalculatorLayout from "@/components/patterns/layouts/CalculatorLayout";
import InlineAlert from "@/components/patterns/blocks/InlineAlert";
import { Button } from "@/components/ui/button";
import AmortisationInputPanel from "./AmortisationInputPanel";
import AmortisationSummaryCard from "./AmortisationSummaryCard";
import AmortisationChartCard from "./AmortisationChartCard";

/**
 * Amortisation, laid out like Purchase Costs and Tax: the loan card on the
 * left; on the right the repayment and what the loan costs, then the loan
 * over its life as a chart or table.
 *
 * `source` is for the kitchen sink (sample data instead of the API).
 */
export default function AmortisationView({ source }: { source?: AmortisationSource } = {}) {
  const am = useAmortisationState(source);
  const fade = `transition-opacity duration-200 ${am.loading && am.data ? "opacity-60" : ""}`;

  return (
    <CalculatorLayout inputs={<AmortisationInputPanel am={am} />} aria-labelledby="amortisation-title" aria-busy={am.loading}>
      {am.error && (
        <InlineAlert>
          {am.error}
          <Button type="button" variant="link-muted" className="ml-2 font-semibold text-status-error underline underline-offset-2 hover:text-status-error" onClick={am.retry}>
            Try again
          </Button>
        </InlineAlert>
      )}
      <AmortisationSummaryCard am={am} className={fade} />
      <AmortisationChartCard am={am} className={fade} />
    </CalculatorLayout>
  );
}
