"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Line, LineChart } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDollars, formatDollarsSigned } from "@/lib/formatters";
import VariantRow from "../components/VariantRow";
import { MONEY, NULL_VALUE } from "./seed";

const SPARK = [612, 618, 640, 655, 649, 671, 690, 702, 715, 731, 748, 760].map((v, i) => ({ i, v }));

/** KPI card pattern: caption, value, then optional delta / subtitle / sparkline. */
function Kpi({ label, value, tone, children }: { label: string; value: React.ReactNode; tone?: "negative" | "muted"; children?: React.ReactNode }) {
  const color = tone === "negative" ? "text-data-negative" : tone === "muted" ? "text-fg-muted" : "text-fg-primary";
  return (
    <Card variant="panel" className="flex w-[220px] flex-col gap-1.5 rounded-2xl px-5 py-4">
      <span className="text-[11px] font-semibold tracking-widest text-fg-tertiary uppercase">{label}</span>
      <span className={`text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums ${color}`}>{value}</span>
      {children}
    </Card>
  );
}

function Delta({ value, up }: { value: string; up: boolean }) {
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`flex items-center gap-1 text-[12px] font-medium tabular-nums ${up ? "text-data-positive" : "text-data-negative"}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {value} vs last year
    </span>
  );
}

export default function KpisSection() {
  return (
    <>
      <VariantRow label="single value · large · zero">
        <Kpi label="Loan amount" value={formatDollars(712_400)} />
        <Kpi label="Portfolio value" value={formatDollars(Math.round(MONEY.large))} />
        <Kpi label="Grants" value="$0" tone="muted" />
      </VariantRow>
      <VariantRow label="with delta (up / down)">
        <Kpi label="Equity" value={formatDollars(372_600)}>
          <Delta value="4.2%" up />
        </Kpi>
        <Kpi label="Net cashflow" value={formatDollarsSigned(MONEY.negative)} tone="negative">
          <Delta value="12.5%" up={false} />
        </Kpi>
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
        <Kpi label="Stamp duty" value={<Skeleton variant="inline" width="140px" height="26px" />}>
          <Skeleton variant="inline" width="100px" height="12px" />
        </Kpi>
      </VariantRow>
    </>
  );
}
