"use client";

import { Line, LineChart } from "recharts";
import StatCard from "@/components/patterns/cards/StatCard";
import { StatDelta } from "@/components/patterns/blocks/Stat";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDollars, formatDollarsSigned } from "@/lib/formatters";
import VariantRow from "../_components/VariantRow";
import { MenuButton } from "./dummy";
import { MONEY, NULL_VALUE } from "./seed";

const SPARK = [612, 618, 640, 655, 649, 671, 690, 702, 715, 731, 748, 760].map((v, i) => ({ i, v }));
const W = "w-[220px]";

/** KPI cards: StatCard (cards/StatCard.tsx) = a Stat block in a compact SectionCard. */
export default function KpiCardsSection() {
  return (
    <>
      <VariantRow label="StatCard · tones · with action">
        <StatCard className={W} label="Positive" tone="positive" value={formatDollars(8_400)} delta={<StatDelta direction="up">4.2%</StatDelta>} />
        <StatCard className={W} label="Negative" tone="negative" value={`−${formatDollars(2_150)}`} delta={<StatDelta direction="down">1.8%</StatDelta>} />
        <StatCard className={W} label="With action" value={formatDollars(64_000)} action={<MenuButton />} />
      </VariantRow>
      <VariantRow label="StatCard · single value / large / zero">
        <StatCard className={W} label="Loan amount" value={formatDollars(712_400)} />
        <StatCard className={W} label="Portfolio value" value={formatDollars(Math.round(MONEY.large))} />
        <StatCard className={W} label="Grants" value="$0" tone="muted" />
      </VariantRow>
      <VariantRow label="with delta (up / down)">
        <StatCard className={W} label="Equity" value={formatDollars(372_600)} delta={<StatDelta direction="up">4.2%</StatDelta>} />
        <StatCard className={W} label="Net cashflow" value={formatDollarsSigned(MONEY.negative)} tone="negative" delta={<StatDelta direction="down">12.5%</StatDelta>} />
      </VariantRow>
      <VariantRow label="with subtitle · with sparkline">
        <StatCard className={W} label="Repayment" value={formatDollars(4_312)}>
          <span className="text-[12px] text-fg-tertiary">per month · 30 years at 6.14%</span>
        </StatCard>
        <StatCard className={W} label="Property value" value={formatDollars(760_000)}>
          <LineChart width={180} height={36} data={SPARK} aria-hidden="true">
            <Line type="monotone" dataKey="v" stroke="var(--color-brand)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </StatCard>
      </VariantRow>
      <VariantRow label="null · loading">
        <StatCard className={W} label="LVR" value={NULL_VALUE} tone="muted">
          <span className="text-[12px] text-fg-tertiary">Enter a purchase price</span>
        </StatCard>
        <StatCard className={W} label="Stamp duty" value={<Skeleton variant="inline" width="140px" height="28px" />}>
          <Skeleton variant="inline" width="100px" height="12px" />
        </StatCard>
      </VariantRow>
    </>
  );
}
