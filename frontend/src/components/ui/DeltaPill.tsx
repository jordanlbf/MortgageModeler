"use client";

interface Props {
  value: number;
  /**
   * Which direction is "good". `positive` (default) means up = green, down = red.
   * `negative` means down = green, up = red — e.g. for cost lines where a drop is a win.
   */
  direction?: "positive" | "negative";
  /** Fixed pill width in px. Default 52 keeps numeric columns aligned. */
  width?: number;
}

const pillClass = (value: number, direction: "positive" | "negative") => {
  if (value === 0) return "bg-surface-active text-fg-tertiary";
  const isGood = direction === "positive" ? value > 0 : value < 0;
  return isGood ? "bg-data-positive/10 text-data-positive" : "bg-data-negative/10 text-data-negative";
};

const formatDelta = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

export default function DeltaPill({ value, direction = "positive", width = 52 }: Props) {
  return (
    <span
      className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums text-center ${pillClass(value, direction)}`}
      style={{ width }}
    >
      {formatDelta(value)}
    </span>
  );
}
