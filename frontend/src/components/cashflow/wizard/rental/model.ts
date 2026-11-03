import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput } from "@/lib/formatters";

/** Fallbacks match the calculation engine (useCashflowAPI). */
export const DEFAULT_VACANCY = 3.8;
export const DEFAULT_FEE = 7.5;
export const ESTIMATE_YIELD = 0.045;

/**
 * Rental income as the engine sees it (useCashflowAPI + compute): vacancy is
 * whole weeks off gross rent, and the management fee is charged on the rent
 * actually collected. An empty or zero vacancy or fee falls back to the
 * default, as it does in the calculation. The yield estimate is only a hint.
 */
export function rentalModel(s: CashflowState) {
  const value = parseCurrencyInput(s.isNewPurchase ? s.purchasePrice : s.currentValue);
  const estimateWeekly = value > 0 ? Math.round((value * ESTIMATE_YIELD) / 52 / 5) * 5 : 0;
  const weekly = parseCurrencyInput(s.weeklyRent);
  const vacancy = parseFloat(s.vacancyRate) || DEFAULT_VACANCY;
  const fee = s.usePropertyManager ? parseFloat(s.managementFee) || DEFAULT_FEE : 0;
  const weeksVacant = Math.round((vacancy / 100) * 52);

  const gross = weekly * 52;
  const vacancyLoss = weekly * weeksVacant;
  const collected = gross - vacancyLoss;
  const management = collected * (fee / 100);
  const net = collected - management;

  return {
    value,
    estimateWeekly,
    weekly,
    vacancy,
    fee,
    gross,
    vacancyLoss,
    collected,
    management,
    net,
    weeksVacant,
    grossYield: value > 0 && gross > 0 ? (gross / value) * 100 : null,
    netYield: value > 0 && net > 0 ? (net / value) * 100 : null,
    ready: weekly > 0,
  };
}

export type RentalModel = ReturnType<typeof rentalModel>;

export const percentChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
  setter(e.target.value.replace(/[^\d.]/g, "").slice(0, 4));

export function toggleManager(s: CashflowState, on: boolean) {
  s.setUsePropertyManager(on);
  if (on && !s.managementFee) s.setManagementFee(String(DEFAULT_FEE));
}
