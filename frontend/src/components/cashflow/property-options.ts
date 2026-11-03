import { Building, Building2, Check, House, KeyRound, LandPlot, Plus, X, type LucideIcon } from "lucide-react";
import type { CashflowState } from "@/hooks/useCashflowState";
import type { PropertyType, PropertyUse, PurchaseMode } from "@/lib/cashflow-types";

export const PROPERTY_TYPES: { value: PropertyType; title: string; Icon: LucideIcon }[] = [
  { value: "house", title: "House", Icon: House },
  { value: "townhouse", title: "Townhouse", Icon: Building },
  { value: "apartment", title: "Apartment", Icon: Building2 },
  { value: "land", title: "Land", Icon: LandPlot },
];

export const propertyTypeTitle = (t: PropertyType | null) => PROPERTY_TYPES.find((o) => o.value === t)?.title ?? null;

/** Third question: buying (`purchaseMode` "new") or already own ("existing"). */
export const PURCHASE_MODES: { value: PurchaseMode; title: string; Icon: LucideIcon }[] = [
  { value: "new", title: "Buying", Icon: Plus },
  { value: "existing", title: "Already own", Icon: KeyRound },
];

/** Fourth question, "New build?", stored in `newBuild`. */
export const NEW_BUILD: { value: "yes" | "no"; title: string; Icon: LucideIcon }[] = [
  { value: "yes", title: "Yes", Icon: Check },
  { value: "no", title: "No", Icon: X },
];

type SetupFields = Pick<CashflowState, "propertyUse" | "propertyType" | "purchaseMode" | "newBuild">;

/**
 * New build or not only changes depreciation, so it's asked only when buying
 * an investment building. Homes, land and properties already owned skip it.
 */
export const asksNewBuild = (s: SetupFields) =>
  s.propertyUse === "investment" && s.propertyType !== "land" && s.purchaseMode === "new";

/** True once every setup question that applies has an answer. */
export const setupAnswered = (s: SetupFields) =>
  !!s.propertyUse && !!s.propertyType && !!s.purchaseMode && (!asksNewBuild(s) || s.newBuild !== null);

/**
 * `newBuild` only means something while the question is asked; it's cleared
 * whenever an answer above makes the question go away, so it's asked again.
 */
function clearNewBuild(s: CashflowState, next: SetupFields) {
  if (!asksNewBuild(next) && s.newBuild !== null) s.setNewBuild(null);
}

export function applyUse(s: CashflowState, use: PropertyUse) {
  clearNewBuild(s, { ...s, propertyUse: use });
  s.setPropertyUse(use);
}

export function applyType(s: CashflowState, type: PropertyType) {
  clearNewBuild(s, { ...s, propertyType: type });
  s.setPropertyType(type);
}

export function applyPurchaseMode(s: CashflowState, mode: PurchaseMode) {
  clearNewBuild(s, { ...s, purchaseMode: mode });
  s.setPurchaseMode(mode);
}

/** Short description for summaries: "New build house", "Established apartment", "Land". */
export function propertyDescription(s: SetupFields): string | null {
  const type = propertyTypeTitle(s.propertyType);
  if (!type || !s.purchaseMode) return null;
  if (asksNewBuild(s) && s.newBuild !== null) return `${s.newBuild ? "New build" : "Established"} ${type.toLowerCase()}`;
  return type;
}
