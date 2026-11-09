"use client";

import type { AmortisationState } from "@/hooks/useAmortisationState";
import { FREQ_LABELS } from "@/lib/constants";
import { formatCurrency, formatDollars } from "@/lib/formatters";
import SectionCard from "@/components/patterns/cards/SectionCard";
import Stat from "@/components/patterns/blocks/Stat";
import { Skeleton } from "@/components/ui/skeleton";

const money = (n: number) => formatDollars(Math.round(n)) || "$0";
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/** 246 → "20 years 6 months". */
function span(months: number) {
  const y = Math.floor(months / 12), m = months % 12;
  return [y > 0 && plural(y, "year"), m > 0 && plural(m, "month")].filter(Boolean).join(" ") || "0 months";
}

/**
 * The answer first: the repayment, and beside it what an offset account saves.
 * A bar shows when the loan is paid off within the term (early, with an
 * offset), then the figures: loan, interest and total repaid.
 */
export default function AmortisationSummaryCard({ am, className }: { am: AmortisationState; className?: string }) {
  const s = am.summary;
  const per = FREQ_LABELS[am.inputs.frequency];

  if (!s) {
    return (
      <SectionCard title="Amortisation" titleAs="h1" titleId="amortisation-title" className={className}>
        <div className="flex flex-col gap-6" aria-hidden="true">
          <Skeleton className="h-11 w-56" />
          <Skeleton className="h-2" />
          <div className="grid grid-cols-2 gap-6 border-t border-border-subtle pt-5 sm:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}
          </div>
        </div>
      </SectionCard>
    );
  }

  const o = s.offset;
  const months = s.payoffYears * 12 + s.payoffMonths;
  const term = am.inputs.years;
  const paidAt = Math.min(100, (months / (term * 12)) * 100);

  return (
    <SectionCard title="Amortisation" titleAs="h1" titleId="amortisation-title" className={className}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <Stat label={`Repayment a ${per}`} value={formatCurrency(s.payment)} size="hero" />
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

        {/* The term as a track: filled to when the loan is paid off, the rest is time the offset saves. */}
        <div className="flex flex-col gap-2">
          <div className="relative h-2 rounded-full bg-surface-subtle" role="img" aria-label={`Paid off after ${span(months)} of a ${term}-year term`}>
            <span className="absolute inset-y-0 left-0 rounded-full bg-brand transition-[width] duration-300" style={{ width: `${paidAt}%` }} />
            {o && o.monthsSooner > 0 && (
              <span className="absolute inset-y-0 right-0 rounded-r-full bg-data-positive/25 transition-[left] duration-300" style={{ left: `${paidAt}%` }} />
            )}
          </div>
          <div className="flex flex-wrap justify-between gap-x-4 text-[12px] text-fg-tertiary tabular-nums">
            <span>Paid off in <span className="font-semibold text-fg-secondary">{span(months)}</span></span>
            <span>
              {o && o.monthsSooner > 0 ? (
                <><span className="font-semibold text-data-positive">{span(o.monthsSooner)}</span> sooner with your offset</>
              ) : (
                `${term}-year term`
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border-subtle pt-5 sm:grid-cols-3">
          <Stat label="Loan amount" value={money(s.loanAmount)} size="sm">
            <span className="text-[12px] text-fg-tertiary tabular-nums">{(s.lvr * 100).toFixed(1)}% LVR</span>
          </Stat>
          <Stat label="Total interest" value={money(s.totalInterest)} size="sm" tone="negative" />
          <Stat label="Total repaid" value={money(s.totalRepaid)} size="sm" />
        </div>
      </div>
    </SectionCard>
  );
}
