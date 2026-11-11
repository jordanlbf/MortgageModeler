import { TAX_BRACKETS } from "./tax-brackets";
import { TAX_BRACKET_COLORS } from "./theme";

/** The marginal rate on taxable income, from the same brackets the compute service uses. */
export function getMarginalTaxRate(income: number): number {
  return TAX_BRACKETS.find((b) => income <= b.to)?.rate ?? 0;
}

/** Severity colour for a marginal tax rate, matching the bracket ramp. */
export function getBracketColor(rate: number): string {
  if (rate <= 0) return TAX_BRACKET_COLORS.zero;
  if (rate < 0.3) return TAX_BRACKET_COLORS.low;
  if (rate <= 0.30) return TAX_BRACKET_COLORS.medium;
  if (rate <= 0.37) return TAX_BRACKET_COLORS.high;
  return TAX_BRACKET_COLORS.top;
}
