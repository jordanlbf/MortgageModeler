import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import VariantRow from "../components/VariantRow";

const BARS = [38, 52, 44, 66, 58, 73, 61, 80, 69, 88];

export default function LoadingStatesSection() {
  return (
    <>
      <VariantRow label='Skeleton default / variant="inline"'>
        <Skeleton className="h-10 w-[180px] rounded-lg" />
        <span className="text-[14px] text-fg-secondary">
          Repayment <Skeleton variant="inline" width="90px" height="14px" /> per month
        </span>
      </VariantRow>
      <VariantRow label="KPI skeleton">
        {[0, 1, 2].map((i) => (
          <Card key={i} variant="panel" className="flex w-[200px] flex-col gap-2.5 rounded-2xl px-5 py-4">
            <Skeleton variant="inline" width="70px" height="10px" />
            <Skeleton variant="inline" width="140px" height="26px" />
            <Skeleton variant="inline" width="100px" height="10px" />
          </Card>
        ))}
      </VariantRow>
      <VariantRow label="table skeleton">
        <div className="flex w-full max-w-[560px] flex-col divide-y divide-border-subtle rounded-lg ring-1 ring-border-subtle">
          {[0, 1, 2, 3].map((r) => (
            <div key={r} className="flex items-center justify-between gap-4 px-4 py-3">
              <Skeleton variant="inline" width={`${180 + (r % 2) * 60}px`} height="12px" />
              <Skeleton variant="inline" width="80px" height="12px" />
            </div>
          ))}
        </div>
      </VariantRow>
      <VariantRow label="chart skeleton">
        <div className="flex h-[140px] w-full max-w-[560px] items-end gap-2 rounded-lg px-4 pb-4 ring-1 ring-border-subtle" aria-hidden="true">
          {BARS.map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-md rounded-b-none" style={{ height: `${h}%` }} />
          ))}
        </div>
      </VariantRow>
      <VariantRow label="spinner (lucide Loader2)">
        <Loader2 className="size-4 animate-spin text-fg-tertiary" aria-label="Loading" role="img" />
        <Loader2 className="size-6 animate-spin text-brand" aria-label="Loading" role="img" />
        <span className="flex items-center gap-2 text-[13px] text-fg-tertiary">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Updating estimate
        </span>
      </VariantRow>
      <VariantRow label='Progress default / bar / meter'>
        <div className="w-[180px]"><Progress value={42} aria-label="Upload progress" /></div>
        <div className="w-[180px]"><Progress variant="bar" value={66} aria-label="Wizard progress" /></div>
        <div className="w-[180px]"><Progress variant="meter" value={88} aria-label="Password strength" style={{ "--progress-accent": "var(--color-data-positive)" } as React.CSSProperties} /></div>
      </VariantRow>
    </>
  );
}
