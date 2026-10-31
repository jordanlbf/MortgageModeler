"use client";

import { Line, LineChart } from "recharts";
import SectionCard from "@/components/patterns/SectionCard";
import Stat, { StatDelta, type StatTone } from "@/components/patterns/Stat";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDollars, formatDollarsSigned } from "@/lib/formatters";
import VariantRow from "../_components/VariantRow";
import { MenuButton } from "./dummy";
import { MONEY, NULL_VALUE } from "./seed";

const SPARK = [612, 618, 640, 655, 649, 671, 690, 702, 715, 731, 748, 760].map((v, i) => ({ i, v }));

/** KPI card: the shared SectionCard + Stat patterns, so tuning those restyles these too. */
function Kpi({ label, value, tone, delta, children }: { label: string; value: React.ReactNode; tone?: StatTone; delta?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <SectionCard size="sm" className="w-[220px]">
      <Stat label={label} value={value} tone={tone} delta={delta} className="gap-1.5">
        {children}
      </Stat>
    </SectionCard>
  );
}

export default function StatsSection() {
  return (
    <>
      <VariantRow label='Stat size="sm" / "md" / "lg" / "hero"'>
        <div className="flex flex-wrap items-end gap-10">
          <Stat label="Small" size="sm" value={formatDollars(1_250)} />
          <Stat label="Medium" size="md" value={formatDollars(12_500)} />
          <Stat label="Large" size="lg" value={formatDollars(125_000)} />
          <Stat label="Hero" size="hero" value={formatDollars(1_250_000)} />
        </div>
      </VariantRow>
      <VariantRow label="Stat tone · positive / negative / muted · with action">
        <Kpi label="Positive" tone="positive" value={formatDollars(8_400)} delta={<StatDelta direction="up">4.2%</StatDelta>} />
        <Kpi label="Negative" tone="negative" value={`−${formatDollars(2_150)}`} delta={<StatDelta direction="down">1.8%</StatDelta>} />
        <Kpi label="Muted" tone="muted" value={NULL_VALUE}>
          <span className="text-[12px] text-fg-tertiary">No value yet</span>
        </Kpi>
        <SectionCard size="sm" className="w-[220px]">
          <Stat label="With action" value={formatDollars(64_000)} action={<MenuButton />} className="gap-1.5" />
        </SectionCard>
      </VariantRow>
      <VariantRow label="KPI card · single value / large / zero">
        <Kpi label="Loan amount" value={formatDollars(712_400)} />
        <Kpi label="Portfolio value" value={formatDollars(Math.round(MONEY.large))} />
        <Kpi label="Grants" value="$0" tone="muted" />
      </VariantRow>
      <VariantRow label="with delta (up / down)">
        <Kpi label="Equity" value={formatDollars(372_600)} delta={<StatDelta direction="up">4.2%</StatDelta>} />
        <Kpi label="Net cashflow" value={formatDollarsSigned(MONEY.negative)} tone="negative" delta={<StatDelta direction="down">12.5%</StatDelta>} />
      </VariantRow>
      <VariantRow label="with subtitle · with sparkline">
        <Kpi label="Repayment" value={formatDollars(4_312)}>
          <span className="text-[12px] text-fg-tertiary">per month · 30 years at 6.14%</span>
        </Kpi>
        <Kpi label="Property value" value={formatDollars(760_000)}>
          <LineChart width={180} height={36} data={SPARK} aria-hidden="true">
            <Line type="monotone" dataKey="v" stroke="var(--color-brand)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </Kpi>
      </VariantRow>
      <VariantRow label="null · loading">
        <Kpi label="LVR" value={NULL_VALUE} tone="muted">
          <span className="text-[12px] text-fg-tertiary">Enter a purchase price</span>
        </Kpi>
        <Kpi label="Stamp duty" value={<Skeleton variant="inline" width="140px" height="28px" />}>
          <Skeleton variant="inline" width="100px" height="12px" />
        </Kpi>
      </VariantRow>
    </>
  );
}
