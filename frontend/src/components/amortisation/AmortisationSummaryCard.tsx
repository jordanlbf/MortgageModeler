"use client";

import type { AmortisationState } from "@/hooks/useAmortisationState";
import { FREQ_LABELS } from "@/lib/constants";
import { formatCurrency, formatDollars } from "@/lib/formatters";
import SectionCard from "@/components/patterns/cards/SectionCard";
import Stat from "@/components/patterns/blocks/Stat";
import { Skeleton } from "@/components/ui/skeleton";

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/** "30 years", "24 years 3 months". */
function duration(years: number, months: number) {
  return [years > 0 && plural(years, "year"), months > 0 && plural(months, "month")].filter(Boolean).join(" ") || "0 months";
}

/** The answer first: the repayment, then what the loan costs and how long it runs. */
export default function AmortisationSummaryCard({ am, className }: { am: AmortisationState; className?: string }) {
  const s = am.summary;
  const per = FREQ_LABELS[am.inputs.frequency];

  return (
    <SectionCard title="Amortisation" titleAs="h1" titleId="amortisation-title" className={className}>
      {s ? (
        <div className="flex flex-col gap-6">
          <Stat label={`Repayment a ${per}`} value={formatCurrency(s.payment)} size="hero" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border-subtle pt-5 sm:grid-cols-4">
            <Stat label="Loan amount" value={formatDollars(s.loanAmount) || "$0"} size="sm">
              <span className="text-[12px] text-fg-tertiary tabular-nums">{(s.lvr * 100).toFixed(1)}% LVR</span>
            </Stat>
            <Stat label="Total interest" value={formatDollars(Math.round(s.totalInterest)) || "$0"} size="sm" tone="negative" />
            <Stat label="Total repaid" value={formatDollars(Math.round(s.totalRepaid)) || "$0"} size="sm" />
            <Stat label="Paid off in" value={duration(s.payoffYears, s.payoffMonths)} size="sm" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6" aria-hidden="true">
          <Skeleton className="h-11 w-56" />
          <div className="grid grid-cols-2 gap-6 border-t border-border-subtle pt-5 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
