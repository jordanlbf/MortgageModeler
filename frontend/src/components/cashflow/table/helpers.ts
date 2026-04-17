import { safeDiv } from "@/lib/formatters";

/** Safe YoY % change: ((current / previous) - 1) * 100, returns 0 when previous is 0. */
export const yoyPct = (current: number, previous: number) => previous === 0 ? 0 : (safeDiv(current, previous) - 1) * 100;

/** Safe growth % from base: ((current / base) - 1) * 100, returns 0 when base is 0. */
export const growthPct = (current: number, base: number) => base === 0 ? 0 : (safeDiv(current, base) - 1) * 100;

/** Pick YoY badge class: neutral for zero, otherwise positive/negative. */
export const yoyClass = (value: number, positiveWhen: "positive" | "negative" = "positive") =>
  value === 0 ? "bg-white/10 text-faint"
    : positiveWhen === "positive"
      ? (value > 0 ? "bg-accent/10 text-positive" : "bg-red-400/10 text-negative")
      : (value < 0 ? "bg-accent/10 text-positive" : "bg-red-400/10 text-negative");

/** Format a YoY badge string. */
export const fmtYoY = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

/** Determine value styling tier: result (teal), outflow (muted red), or neutral */
export const getValueClass = (value: number, isResult = false, isOutflow = false, isTaxSaved = false) => {
  if (isResult) return value < 0 ? "text-negative font-bold" : "text-accent font-bold";
  if (isTaxSaved && value > 0) return "text-accent font-bold";
  if (isOutflow) return "text-red-400/65";
  return "text-[#f0fdfa]";
};

/** LVR conditional styling */
export const getLvrClass = (lvr: number) => {
  if (lvr > 80) return "text-red-400";
  if (lvr > 60) return "text-amber-400";
  return "text-emerald-400";
};
