/** Stage 3 tax brackets (effective 1 July 2024). */
export function getMarginalTaxRate(income: number): number {
  if (income <= 18200) return 0;
  if (income <= 45000) return 0.16;
  if (income <= 135000) return 0.30;
  if (income <= 190000) return 0.37;
  return 0.45;
}
