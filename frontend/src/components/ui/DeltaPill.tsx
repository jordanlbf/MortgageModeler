"use client";

/** Absolute YoY % above which the delta gets coloured instead of rendering as quiet metadata. */
export const YOY_OUTLIER_THRESHOLD = 5;

interface Props {
  value: number;
  /**
   * Which direction is "good". `positive` (default) means up = good.
   * `negative` means down = good — e.g. cost lines where a drop is a win.
   * Used to decide whether an outlier reads as positive or negative.
   */
  direction?: "positive" | "negative";
}

const formatDelta = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

export default function DeltaPill({ value, direction = "positive" }: Props) {
  const isOutlier = Math.abs(value) >= YOY_OUTLIER_THRESHOLD;
  const isGood = direction === "positive" ? value > 0 : value < 0;

  const cls = isOutlier
    ? `font-medium ${isGood ? "text-data-positive" : "text-data-negative"}`
    : "font-normal text-fg-tertiary";

  return (
    <span
      className={`inline-block ml-2.5 text-center tabular-nums text-[10.5px] align-middle ${cls}`}
      style={{ minWidth: 46 }}
    >
      {formatDelta(value)}
    </span>
  );
}
