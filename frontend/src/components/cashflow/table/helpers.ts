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

/** Compact dollar format for summary rows: $X.XXM, $XXXK, $XXX. No sign prefix. */
export const formatCompact = (v: number): string => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return "$" + (a / 1_000_000).toFixed(2) + "M";
  if (a >= 1_000) return "$" + Math.round(a / 1_000) + "K";
  return "$" + Math.round(a);
};

/** Compact dollar format with sign prefix: +$X.XXM, −$XXXK. For cashflow/delta values. */
export const formatCompactSigned = (v: number): string => {
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : v > 0 ? "+" : "";
  if (a >= 1_000_000) return sign + "$" + (a / 1_000_000).toFixed(2) + "M";
  if (a >= 1_000) return sign + "$" + Math.round(a / 1_000) + "K";
  return sign + "$" + Math.round(a);
};

/** Determine value styling tier: result (teal), outflow (red), or neutral */
export const getValueClass = (value: number, isResult = false, isOutflow = false, isTaxSaved = false) => {
  if (isResult) return value < 0 ? "text-negative font-bold" : "text-accent font-bold";
  if (isTaxSaved && value > 0) return "text-accent font-bold";
  if (isOutflow) return "text-negative";
  return "text-foreground";
};

/** LVR conditional styling */
export const getLvrClass = (lvr: number) => {
  if (lvr > 80) return "text-red-400";
  if (lvr > 60) return "text-amber-400";
  return "text-emerald-400";
};
