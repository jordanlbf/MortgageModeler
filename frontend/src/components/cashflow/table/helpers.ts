import { safeDiv } from "@/lib/formatters";
import { t } from "@/lib/theme";

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
  return "";
};

/** LVR conditional styling */
export const getLvrClass = (lvr: number) => {
  if (lvr > 80) return "text-data-negative";
  if (lvr > 60) return "text-data-warning";
  return "text-data-positive";
};

/** Get inline color style for LVR */
export const getLvrColor = (lvr: number) => {
  if (lvr > 80) return t.data.negative;
  if (lvr > 60) return t.data.warning;
  return t.data.positive;
};

type ThVariant = "default" | "total" | "net";
type TdVariant = "default" | "out" | "total" | "totalOut" | "net";

// Data Dense style: cleaner, more compact, using theme tokens
const TH_BASE = "px-3 py-2 text-right text-[11px] font-medium whitespace-nowrap uppercase tracking-wider";
const TD_BASE = "px-3 py-2 text-right text-[12px] tabular-nums whitespace-nowrap border-t border-border-subtle";

export const thClass = (
  variant: ThVariant = "default",
  opts?: { groupStart?: boolean; first?: boolean },
) => {
  const { groupStart = false, first = false } = opts ?? {};
  const base = TH_BASE;
  const group = groupStart ? "border-l border-border-subtle pl-4" : "";

  if (first) return `${base} text-left sticky left-0 z-[1] ${group}`.trim();

  return `${base} ${group}`.trim();
};

export const thStyle = (
  variant: ThVariant = "default",
  opts?: { first?: boolean },
) => {
  const { first = false } = opts ?? {};
  const baseStyle: React.CSSProperties = {
    color: t.fg.tertiary,
    backgroundColor: t.surface.sunken,
  };

  if (first) {
    return baseStyle;
  }

  if (variant === "total") {
    return { ...baseStyle, color: t.fg.secondary, fontWeight: 600 };
  }
  if (variant === "net") {
    return { ...baseStyle, color: t.brand.default, fontWeight: 600 };
  }

  return baseStyle;
};

export const tdClass = (
  variant: TdVariant = "default",
  opts?: { isMs?: boolean; groupStart?: boolean; first?: boolean; isSelected?: boolean },
) => {
  const { groupStart = false, first = false, isSelected = false } = opts ?? {};
  const base = TD_BASE;
  const group = groupStart ? "border-l border-border-subtle pl-4" : "";
  const selected = isSelected ? "bg-surface-hover" : "";

  if (first) {
    return `${base} text-left sticky left-0 z-[1] font-medium ${group} ${selected}`.trim();
  }

  return `${base} ${group} ${selected}`.trim();
};

export const tdStyle = (
  variant: TdVariant = "default",
  opts?: { isMs?: boolean; isSelected?: boolean; first?: boolean },
): React.CSSProperties => {
  const { isMs = false, isSelected = false, first = false } = opts ?? {};

  const bgColor = isSelected ? t.surface.hover : t.card;

  if (first) {
    return {
      color: t.fg.primary,
      backgroundColor: bgColor,
    };
  }

  switch (variant) {
    case "out":
      return {
        color: t.data.negative,
        fontWeight: isMs ? 500 : 400,
      };
    case "total":
      return {
        color: t.fg.primary,
        fontWeight: isMs ? 600 : 500,
      };
    case "totalOut":
      return { 
        color: t.data.negative,
        fontWeight: isMs ? 600 : 500,
      };
    case "net":
      return {
        color: t.data.positive,
        fontWeight: isMs ? 700 : 600,
        fontSize: "13px",
      };
    default:
      return {
        color: isMs ? t.fg.primary : t.fg.secondary,
        fontWeight: isMs ? 500 : 400,
      };
  }
};

export const gainCls = "text-[10px] font-normal ml-1.5";
export const gainStyle: React.CSSProperties = { color: t.fg.muted };
