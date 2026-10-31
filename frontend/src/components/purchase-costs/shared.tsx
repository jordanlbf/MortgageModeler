"use client";

import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { formatDollars } from "@/lib/formatters";
import { LVR_COLORS } from "@/lib/theme";

/** Above this LVR, lenders charge mortgage insurance. */
export const LMI_THRESHOLD = 0.8;

/** LVR band colour; muted while there's no figure. */
export function lvrColor(lvr: number | null) {
  if (lvr === null) return "var(--color-fg-muted)";
  if (lvr <= LMI_THRESHOLD) return LVR_COLORS.safe;
  if (lvr <= 0.9) return LVR_COLORS.moderate;
  return LVR_COLORS.high;
}

/** Dollar figure that tweens to its new value; "—" for null. */
export function Money({ value }: { value: number | null }) {
  const v = useAnimatedValue(value ?? 0, 400);
  if (value === null) return <span className="text-fg-muted">—</span>;
  return <>{formatDollars(Math.round(v)) || "$0"}</>;
}
