"use client";

import { useId, useState } from "react";
import { useAmortisationState, type AmortisationSource } from "@/hooks/useAmortisationState";
import type { Frequency } from "@/lib/types";
import { FREQ_OPTIONS } from "@/lib/constants";
import { lvrColor } from "@/lib/lvr";
import CalculatorLayout from "@/components/patterns/layouts/CalculatorLayout";
import SectionCard from "@/components/patterns/cards/SectionCard";
import InlineAlert from "@/components/patterns/blocks/InlineAlert";
import Stat from "@/components/patterns/blocks/Stat";
import ErrorBoundary from "@/components/domain/ErrorBoundary";
import SegmentToggle from "@/components/domain/SegmentToggle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ToggleLegendDot } from "@/components/ui/toggle";
import AmortisationInputPanel from "./AmortisationInputPanel";
import AmortisationTable from "./AmortisationTable";
import { BALANCE_SERIES, BalanceRaceChart, C, ClearedKey, DEFAULT_BALANCE_SERIES, LegendDot, YearlyBarsChart, lastYear, type BalanceSeriesKey } from "./charts";
import { money, spanTiny } from "./format";

/** Headline figures: two columns on phones; one row (each figure as wide as it needs) once the card fits them. */
const FIGURES = "grid grid-cols-2 gap-x-4 gap-y-5 @[30rem]:flex @[30rem]:justify-between";

/** The headline switch: the three real repayment frequencies, plus Yearly (a view of the same loan). */
type Per = Frequency | "yearly";
const PER_OPTIONS: { value: Per; label: string }[] = [...FREQ_OPTIONS, { value: "yearly", label: "Yearly" }];

/** Short period names for the repayment label. */
const PER_SHORT: Record<Per, string> = { weekly: "wk", fortnightly: "fn", monthly: "mth", yearly: "yr" };

/**
 * Amortisation: the loan card on the left; on the right the headline figures
 * then either one card with the balance and principal vs interest each year,
 * or the year-by-year table, switched at the card's bottom right.
 *
 * `source` is for the kitchen sink (sample data instead of the API).
 */
export default function AmortisationView({ source }: { source?: AmortisationSource } = {}) {
  const am = useAmortisationState(source);
  const titleId = useId();
  const { inputs, summary: s } = am;
  const months = s ? s.payoffYears * 12 + s.payoffMonths : 0;
  const o = s?.offset;
  const [visible, setVisible] = useState<ReadonlySet<BalanceSeriesKey>>(DEFAULT_BALANCE_SERIES);
  const [view, setView] = useState<"chart" | "table">("chart");
  // Yearly isn't a way to repay a loan: the loan keeps its last real frequency and the figure shows a year of it.
  const [yearly, setYearly] = useState(false);
  const per: Per = yearly ? "yearly" : inputs.frequency;
  const last = lastYear(am.chartData, am.baselineChartData);
  const cleared = am.baselineChartData.length > 0 && visible.has("bal");

  // Series chips, beside the Balance heading (they wrap under it when narrow).
  const legend = (
    <ToggleGroup
      type="multiple"
      variant="legend"
      aria-label="Chart series"
      value={BALANCE_SERIES.filter(({ key }) => visible.has(key)).map(({ key }) => key)}
      onValueChange={(next) => {
        // Keep at least one series on the chart.
        if (next.length > 0) setVisible(new Set(next as BalanceSeriesKey[]));
      }}
      className="flex flex-wrap gap-1"
    >
      {BALANCE_SERIES.map(({ key, label, color }) => (
        <ToggleGroupItem key={key} value={key} className="shrink-0 px-2 text-[12px]" style={{ "--legend-accent": color } as React.CSSProperties}>
          <ToggleLegendDot />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );

  // Top right of the headline: how often you repay, which every figure there follows.
  const frequency = (
    <SegmentToggle
      aria-label="Repayments"
      value={per}
      onChange={(v) => {
        setYearly(v === "yearly");
        if (v !== "yearly") am.setters.setFrequency(v);
      }}
      options={PER_OPTIONS}
    />
  );

  // Top right of the chart card (under its title when narrow): the charts or the year-by-year table.
  const viewToggle = (
    <SegmentToggle
      aria-label="Show as"
      value={view}
      onChange={setView}
      options={[
        { value: "chart", label: "Chart" },
        { value: "table", label: "Table" },
      ]}
    />
  );

  // Short, so the headline fits on one row: "Repay/wk", "Repay/fn", "Repay/mth", "Repay/yr".
  const repaymentLabel = `Repay/${PER_SHORT[per]}`;

  // Not filled in yet, or the calculation failed with nothing to show.
  const empty = am.waiting || (!!am.error && !am.data);

  // Before there's a loan to work out, say what's needed.
  const prompt = !am.waiting
    ? undefined
    : inputs.purchasePrice > 0
      ? "Your deposit covers the price, so there's no loan to repay."
      : "Enter a purchase price to see your repayments.";

  const viewAction = <div className="hidden @[26rem]:block">{viewToggle}</div>;
  const viewBelow = <div className="-mt-2 px-6 pb-4 @[26rem]:hidden">{viewToggle}</div>;

  return (
    <div>
      {am.error && (
        <InlineAlert className="mb-6">
          {am.error}
          <Button type="button" variant="link-muted" className="ml-2 font-semibold text-status-error underline underline-offset-2 hover:text-status-error" onClick={am.retry}>
            Try again
          </Button>
        </InlineAlert>
      )}
      <CalculatorLayout
        inputs={<AmortisationInputPanel am={am} />}
        aria-labelledby={titleId}
        aria-busy={am.loading}
        // Recalculating: dim the results only, so the inputs stay crisp while typing.
        data-refreshing={am.loading && !!am.data}
        className="[&>section]:transition-opacity [&>section]:duration-200 [&>section[data-refreshing=true]]:opacity-60"
      >
        <SectionCard
          title="Amortisation"
          titleAs="h1"
          titleId={titleId}
          description={prompt}
          className="@container"
          action={<div className="hidden @[27rem]:block">{frequency}</div>}
        >
          {/* Too narrow to sit beside the title: under it instead. */}
          <div className="-mt-2 @[27rem]:hidden">{frequency}</div>
          {s ? (
            <div className={FIGURES}>
              <Stat label={repaymentLabel} value={money(yearly ? s.yearlyRepayment : s.payment)} size="md" />
              {/* Without an offset the payoff is just the term, so show the loan instead. */}
              {!o && <Stat label="Loan amount" value={money(s.loanAmount)} size="md" />}
              {/* Coloured like the deposit slider: green with no LMI, amber, then red. */}
              <Stat label="LVR" value={<span style={{ color: lvrColor(s.lvr) }}>{Math.round(s.lvr * 100)}%</span>} size="md" />
              <Stat label="Interest" value={money(s.totalInterest)} size="md" tone="negative" />
              {o && <Stat label="Paid off" value={spanTiny(months)} size="md" />}
              {o && <Stat label="Offset saves" value={money(o.interestSaved)} size="md" tone="positive" />}
            </div>
          ) : empty ? (
            // Nothing to show (not filled in yet, or it failed): the same figures, empty, so the layout doesn't jump.
            <div className={FIGURES}>
              {[repaymentLabel, "Loan amount", "LVR", "Interest"].map((label) => (
                <Stat key={label} label={label} value="—" size="md" tone="muted" />
              ))}
            </div>
          ) : (
            <Skeleton className="h-16" aria-hidden="true" />
          )}
        </SectionCard>

        {empty ? (
          <SectionCard flush title="Over the life of the loan" className="@container" action={viewAction}>
            {viewBelow}
            <div className="mx-6 mb-6 flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border-subtle px-6 text-center text-[13px] text-fg-tertiary">
              {am.waiting ? "Your balance and repayments over the life of the loan appear here." : "Nothing to show until your repayments can be worked out."}
            </div>
          </SectionCard>
        ) : view === "chart" ? (
          <SectionCard flush title="Over the life of the loan" className="@container" action={viewAction}>
            {viewBelow}
            <div className="flex flex-col gap-5 px-6 pb-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div className="flex items-center gap-3">
                    <Label variant="caps" asChild><h3>Balance</h3></Label>
                    {cleared && <ClearedKey />}
                  </div>
                  {legend}
                </div>
                {am.data ? (
                  <ErrorBoundary>
                    <BalanceRaceChart data={am.chartData} baseline={am.baselineChartData} last={last} height={240} visible={visible} />
                  </ErrorBoundary>
                ) : (
                  <Skeleton className="h-[240px]" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col gap-3 border-t border-border-subtle pt-5">
                <div className="flex items-center justify-between gap-4">
                  <Label variant="caps" asChild><h3>Each year</h3></Label>
                  <div className="flex items-center gap-4">
                    <LegendDot color={C.principal} label="Principal" />
                    <LegendDot color={C.interest} label="Interest" />
                  </div>
                </div>
                {am.data ? (
                  <ErrorBoundary>
                    <YearlyBarsChart data={am.chartData} last={last} height={180} />
                  </ErrorBoundary>
                ) : (
                  <Skeleton className="h-[180px]" aria-hidden="true" />
                )}
              </div>
            </div>
          </SectionCard>
        ) : (
          <SectionCard flush title="Over the life of the loan" className="@container" action={viewAction}>
            {viewBelow}
            {am.data ? (
              <div className="border-t border-border-subtle">
                <AmortisationTable rows={am.tableRows} frequency={inputs.frequency} height={400} />
              </div>
            ) : (
              <Skeleton className="mx-6 mb-6 h-[400px]" aria-hidden="true" />
            )}
          </SectionCard>
        )}
      </CalculatorLayout>
    </div>
  );
}
