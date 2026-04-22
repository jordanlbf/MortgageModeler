import { safeDiv } from "@/lib/formatters";

/** Safe YoY % change: ((current / previous) - 1) * 100, returns 0 when previous is 0. */
export const yoyPct = (current: number, previous: number) => previous === 0 ? 0 : (safeDiv(current, previous) - 1) * 100;

/** Safe growth % from base: ((current / base) - 1) * 100, returns 0 when base is 0. */
export const growthPct = (current: number, base: number) => base === 0 ? 0 : (safeDiv(current, base) - 1) * 100;

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
