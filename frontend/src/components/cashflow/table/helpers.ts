import { safeDiv } from "@/lib/formatters";

/** Safe YoY % change: ((current / previous) - 1) * 100, returns 0 when previous is 0. */
export const yoyPct = (current: number, previous: number) => previous === 0 ? 0 : (safeDiv(current, previous) - 1) * 100;

/** Format a YoY percentage for inline display: `+3.4%` / `−1.2%` / `0.0%`. */
export const fmtYoY = (pct: number) => {
  const sign = pct > 0 ? "+" : pct < 0 ? "\u2212" : "";
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
};

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

type ThVariant = "default" | "total" | "net";
type TdVariant = "default" | "out" | "total" | "totalOut" | "net";

const TH_BASE = "h-9 px-3.5 text-right align-middle text-[11.5px] font-medium border-b border-default whitespace-nowrap";
const TD_BASE = "px-3.5 text-right tracking-tight border-b border-subtle whitespace-nowrap";

export const thClass = (
  variant: ThVariant = "default",
  opts?: { groupStart?: boolean; first?: boolean },
) => {
  const { groupStart = false, first = false } = opts ?? {};
  if (first) return `${TH_BASE} text-left pl-0.5 text-fg-tertiary`;
  const color =
    variant === "total" ? "text-fg-secondary font-semibold"
    : variant === "net" ? "text-brand font-semibold"
    : "text-fg-tertiary";
  const group = groupStart ? "border-l border-default pl-5" : "";
  return `${TH_BASE} ${color} ${group}`.trim();
};

export const tdClass = (
  variant: TdVariant = "default",
  opts?: { isMs?: boolean; groupStart?: boolean; first?: boolean },
) => {
  const { isMs = false, groupStart = false, first = false } = opts ?? {};
  if (first) {
    const c = isMs ? "text-fg-primary font-medium" : "text-fg-tertiary";
    return `${TD_BASE} text-left pl-0.5 ${c}`;
  }
  let color: string;
  switch (variant) {
    case "out":
      color = isMs ? "text-data-negative font-medium" : "text-data-negative-dim";
      break;
    case "total":
      color = isMs ? "text-fg-primary font-semibold" : "text-fg-primary font-medium";
      break;
    case "totalOut":
      color = isMs ? "text-data-negative font-semibold" : "text-data-negative font-medium";
      break;
    case "net":
      color = isMs
        ? "text-data-positive font-bold text-[13.5px]"
        : "text-data-positive font-semibold text-[13.5px]";
      break;
    default:
      color = isMs ? "text-fg-primary font-medium" : "text-fg-secondary";
  }
  const group = groupStart ? "border-l border-subtle pl-5" : "";
  return `${TD_BASE} ${color} ${group}`.trim();
};

export const gainCls = "text-fg-muted text-[10px] font-normal ml-1.5";
