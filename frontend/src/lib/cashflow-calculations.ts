import { TAX_BRACKET_COLORS } from "./theme";

/** Stage 3 tax brackets (effective 1 July 2024). */
export function getMarginalTaxRate(income: number): number {
  if (income <= 18200) return 0;
  if (income <= 45000) return 0.16;
  if (income <= 135000) return 0.30;
  if (income <= 190000) return 0.37;
  return 0.45;
}

/** Severity colour for a marginal tax rate, matching the bracket ramp. */
export function getBracketColor(rate: number): string {
  if (rate <= 0) return TAX_BRACKET_COLORS.zero;
  if (rate <= 0.16) return TAX_BRACKET_COLORS.low;
  if (rate <= 0.30) return TAX_BRACKET_COLORS.medium;
  if (rate <= 0.37) return TAX_BRACKET_COLORS.high;
  return TAX_BRACKET_COLORS.top;
}
