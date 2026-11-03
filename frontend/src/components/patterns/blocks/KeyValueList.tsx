import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";

/**
 * Label / value rows: breakdowns, loan facts, year summaries. A `dl`, so
 * screen readers pair each label with its value.
 *
 * Edit this file to restyle every breakdown list in the app at once.
 */
export default function KeyValueList({
  divided = false,
  className,
  ...props
}: ComponentProps<"dl"> & {
  /** Hairlines between rows instead of a gap. */
  divided?: boolean;
}) {
  return (
    <dl
      data-pattern="key-value-list"
      className={cn(
        "flex flex-col",
        divided ? "divide-y divide-border-subtle *:py-2.5 *:first:pt-0 *:last:pb-0" : "gap-2.5",
        className,
      )}
      {...props}
    />
  );
}

const LABEL = {
  sm: "text-[12px] text-fg-tertiary",
  md: "text-[12.5px] text-fg-tertiary",
} as const;

const VALUE = {
  sm: "text-[12.5px] font-medium",
  md: "text-[14px] font-semibold",
} as const;

const TONE = {
  default: "text-fg-primary",
  positive: "text-data-positive",
  negative: "text-data-negative",
  muted: "text-fg-muted",
} as const;

/**
 * One row. `total` marks a summing row (semibold, primary label). `tone` colours
 * the value by meaning; `accent` takes any colour token for a series colour.
 */
export function KeyValueRow({
  label,
  value,
  size = "sm",
  tone = "default",
  accent,
  total = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  size?: keyof typeof LABEL;
  tone?: keyof typeof TONE;
  /** A CSS colour (e.g. `var(--color-series-equity)`); overrides `tone`. */
  accent?: string;
  total?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center justify-between gap-3", total && "pt-0.5", className)}>
      <dt className={cn("min-w-0", total ? "text-[13px] font-semibold text-fg-primary" : LABEL[size])}>{label}</dt>
      <dd
        className={cn(
          "shrink-0 tabular-nums",
          total ? "text-[13px] font-semibold" : VALUE[size],
          accent ? "text-[color:var(--kv-accent)]" : TONE[tone],
        )}
        style={accent ? ({ "--kv-accent": accent } as React.CSSProperties) : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
