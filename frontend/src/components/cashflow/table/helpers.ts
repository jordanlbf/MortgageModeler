import { safeDiv } from "@/lib/formatters";

/** Safe YoY % change: ((current / previous) - 1) * 100, returns 0 when previous is 0. */
export const yoyPct = (current: number, previous: number) => previous === 0 ? 0 : (safeDiv(current, previous) - 1) * 100;

/** Format a YoY percentage for inline display: `+3.4%` / `−1.2%` / `0.0%`. */
export const fmtYoY = (pct: number) => {
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
};
