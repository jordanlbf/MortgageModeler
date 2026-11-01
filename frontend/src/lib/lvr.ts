import { LVR_COLORS } from "./theme";

/** Above this LVR, lenders charge mortgage insurance. */
export const LMI_THRESHOLD = 0.8;

/** LVR band colour; muted while there's no figure. */
export function lvrColor(lvr: number | null) {
  if (lvr === null) return "var(--color-fg-muted)";
  if (lvr <= LMI_THRESHOLD) return LVR_COLORS.safe;
  if (lvr <= 0.9) return LVR_COLORS.moderate;
  return LVR_COLORS.high;
}
