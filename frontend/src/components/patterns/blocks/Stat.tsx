import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "cn";
import { Label } from "@/components/ui/label";

/** Value sizes, smallest to largest. `hero` is the one number a page is about. */
const SIZE = {
  sm: "text-[18px] tracking-[-0.01em]",
  md: "text-[22px] tracking-[-0.01em]",
  lg: "text-[28px] tracking-[-0.02em]",
  hero: "text-[44px] tracking-[-0.03em]",
} as const;

const TONE = {
  default: "text-fg-primary",
  positive: "text-data-positive",
  negative: "text-data-negative",
  muted: "text-fg-muted",
} as const;

export type StatTone = keyof typeof TONE;

/**
 * A change next to a number: arrow plus value. Up reads as good and down as
 * bad unless `tone` says otherwise (e.g. a loan going down is good).
 */
export function StatDelta({
  direction,
  tone = direction === "up" ? "positive" : "negative",
  children,
}: {
  direction: "up" | "down";
  tone?: StatTone;
  children: ReactNode;
}) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-0.5 text-[12px] font-medium tabular-nums", TONE[tone])}>
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * A labelled number: caps caption, then the value, then anything extra
 * (`children`: a subtitle, progress bar, legend…). `action` sits right of the
 * caption; `delta` sits right of the value.
 *
 * The caption is `Label variant="caps"`, so caption styling is shared with form
 * field captions. Edit this file to restyle every KPI / headline number.
 */
export default function Stat({
  label,
  labelAs = "span",
  labelId,
  value,
  size = "lg",
  tone = "default",
  delta,
  action,
  className,
  children,
}: {
  label: ReactNode;
  /** Use a heading when the number titles a region. */
  labelAs?: "span" | "h2" | "h3";
  labelId?: string;
  value: ReactNode;
  size?: keyof typeof SIZE;
  tone?: StatTone;
  delta?: ReactNode;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const Tag = labelAs;
  return (
    <div data-pattern="stat" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex min-h-5 items-center justify-between gap-3">
        <Label variant="caps" asChild>
          <Tag id={labelId}>{label}</Tag>
        </Label>
        {action}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("leading-none font-semibold tabular-nums", SIZE[size], TONE[tone])}>{value}</span>
        {delta}
      </div>
      {children}
    </div>
  );
}
