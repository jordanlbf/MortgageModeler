/**
 * Resident income tax brackets for the year the compute service uses.
 * Mirrors `TAX_BRACKETS` in compute/app/config/tax.py: update both together.
 * Only used to draw the bracket chart; every tax figure comes from the API.
 */
export const TAX_YEAR = "2026–27";

export interface TaxBracket {
  /** Income above this is in the bracket. */
  from: number;
  /** Top of the bracket (inclusive); Infinity for the last one. */
  to: number;
  rate: number;
}

export const TAX_BRACKETS: readonly TaxBracket[] = [
  { from: 0, to: 18_200, rate: 0 },
  { from: 18_200, to: 45_000, rate: 0.15 },
  { from: 45_000, to: 135_000, rate: 0.3 },
  { from: 135_000, to: 190_000, rate: 0.37 },
  { from: 190_000, to: Infinity, rate: 0.45 },
];

export interface BracketBand extends TaxBracket {
  /** Taxable income that falls in this bracket. */
  income: number;
  /** Tax on that income, before offsets. */
  tax: number;
  /** How full the band is drawn, 0–1. The top band fills against `scaleTop`. */
  fill: number;
  /** The bracket the taxable income ends in. */
  current: boolean;
}

/**
 * Splits taxable income across the brackets. The open-ended top bracket is
 * drawn as if it ended at `scaleTop` (a bit beyond the income), so it fills
 * gradually rather than jumping to full.
 */
export function bracketBands(taxable: number): BracketBand[] {
  const scaleTop = Math.max(260_000, taxable * 1.2);
  return TAX_BRACKETS.map((b) => {
    const income = Math.max(0, Math.min(taxable, b.to) - b.from);
    const span = Math.min(b.to, scaleTop) - b.from;
    return {
      ...b,
      income,
      tax: income * b.rate,
      fill: Math.min(1, income / span),
      current: taxable > b.from && taxable <= b.to,
    };
  });
}
