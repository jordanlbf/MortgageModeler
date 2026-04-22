import { safeDiv } from "@/lib/formatters";

/** Safe YoY % change: ((current / previous) - 1) * 100, returns 0 when previous is 0. */
export const yoyPct = (current: number, previous: number) => previous === 0 ? 0 : (safeDiv(current, previous) - 1) * 100;

/** Safe growth % from base: ((current / base) - 1) * 100, returns 0 when base is 0. */
export const growthPct = (current: number, base: number) => base === 0 ? 0 : (safeDiv(current, base) - 1) * 100;

/** Pick YoY badge class: neutral for zero, otherwise positive/negative. */
export const yoyClass = (value: number, positiveWhen: "positive" | "negative" = "positive") =>
  value === 0 ? "bg-white/10 text-fg-tertiary"
    : positiveWhen === "positive"
      ? (value > 0 ? "bg-data-positive/10 text-data-positive" : "bg-data-negative/10 text-data-negative")
      : (value < 0 ? "bg-data-positive/10 text-data-positive" : "bg-data-negative/10 text-data-negative");

/** Format a YoY badge string. */
export const fmtYoY = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

/** Determine value styling tier: result (positive/negative), outflow (negative), or neutral */
export const getValueClass = (value: number, isResult = false, isOutflow = false, isTaxSaved = false) => {
  if (isResult) return value < 0 ? "text-data-negative font-bold" : "text-data-positive font-bold";
  if (isTaxSaved && value > 0) return "text-data-positive font-bold";
  if (isOutflow) return "text-data-negative";
  return "text-fg-primary";
};

/** LVR conditional styling */
export const getLvrClass = (lvr: number) => {
  if (lvr > 80) return "text-data-negative";
  if (lvr > 60) return "text-data-warning";
  return "text-data-positive";
};
