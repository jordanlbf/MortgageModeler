import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput } from "@/lib/formatters";

/** Engine fallback when the wage growth field is empty (useCashflowAPI). */
export const DEFAULT_WAGE_GROWTH = 3;

export function incomeModel(s: CashflowState) {
  const income = parseCurrencyInput(s.taxableIncome);
  const raw = parseFloat(s.wageGrowth);
  const growthSet = Number.isFinite(raw);
  const growth = growthSet ? raw : DEFAULT_WAGE_GROWTH;
  const inTenYears = income * Math.pow(1 + growth / 100, 10);
  return { income, growth, growthSet, inTenYears, perMonth: income / 12, perWeek: income / 52 };
}

export type IncomeModel = ReturnType<typeof incomeModel>;

export const growthChange = (s: CashflowState) => (e: React.ChangeEvent<HTMLInputElement>) =>
  s.setWageGrowth(e.target.value.replace(/[^\d.]/g, "").slice(0, 4));
