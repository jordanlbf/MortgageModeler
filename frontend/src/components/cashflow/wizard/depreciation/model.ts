import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput } from "@/lib/formatters";
import { depreciationKind, generateDepreciationEstimate } from "@/lib/depreciation-estimate";

export type Building = CashflowState["depBuildings"][number];
export type Asset = CashflowState["depAssets"][number];

export const DIV43_RATE = 0.025;

const dvRate = (a: Asset) => Math.min(1, 2 / (a.effective_life_years || 10));
const assetBase = (a: Asset) => a.written_down_value || a.cost;

export const assetYear1 = (a: Asset) => assetBase(a) * dvRate(a);
export const buildingYear1 = (b: Building) => b.construction_cost * DIV43_RATE;

/** Same anchoring as useCashflowAPI: price and year at time of purchase. */
export function depreciationModel(s: CashflowState) {
  const anchorPrice = s.isNewPurchase
    ? parseCurrencyInput(s.purchasePrice || "")
    : parseCurrencyInput(s.originalPurchasePrice || "");
  const estYear = s.isNewPurchase ? new Date().getFullYear() : parseInt(s.purchaseYear) || new Date().getFullYear();
  const estimate = generateDepreciationEstimate(anchorPrice, depreciationKind(s), estYear);

  const isEstimate = s.depreciationMode === "estimate";
  const buildings = isEstimate ? estimate.buildings : s.depBuildings;
  const assets = isEstimate ? estimate.assets : s.depAssets;

  const div43 = buildings.reduce((sum, b) => sum + buildingYear1(b), 0);
  const div40 = assets.reduce((sum, a) => sum + assetYear1(a), 0);
  const annual = div43 + div40;

  /** Deduction in year k (0 = this year). Div 40 declines; Div 43 is flat. */
  const yearAt = (k: number) =>
    div43 + assets.reduce((sum, a) => sum + assetYear1(a) * Math.pow(1 - dvRate(a), k), 0);

  return {
    anchorPrice,
    estYear,
    isEstimate,
    buildings,
    assets,
    estimate,
    div43,
    div40,
    annual,
    taxBack: annual * s.marginalRate,
    marginalRate: s.marginalRate,
    yearAt,
  };
}

export type DepModel = ReturnType<typeof depreciationModel>;

export function switchToEstimate(s: CashflowState) {
  s.setDepreciationMode("estimate");
}

export const ASSET_PRESETS = [
  { name: "Air conditioning", life: 10 },
  { name: "Carpet", life: 8 },
  { name: "Blinds & curtains", life: 6 },
  { name: "Hot water system", life: 12 },
  { name: "Dishwasher", life: 8 },
  { name: "Cooktop & oven", life: 12 },
  { name: "Light fittings", life: 5 },
  { name: "Smoke detectors", life: 6 },
];
