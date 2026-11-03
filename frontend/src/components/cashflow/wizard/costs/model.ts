import type { CashflowState } from "@/hooks/useCashflowState";
import type { PropertyType } from "@/lib/cashflow-types";
import { parseCurrencyInput } from "@/lib/formatters";

export type CostKind = "currency" | "percent" | "quarterly";

export interface CostLine {
  key: "council" | "water" | "building" | "landlord" | "maintenance" | "strata";
  label: string;
  /** What's in the field ("" when cleared). */
  entered: string;
  set: (v: string) => void;
  kind: CostKind;
  /** Typical figure in the field's own unit ($/yr, %, or $/quarter), shown as the placeholder. */
  estimate: number;
  /** Annual dollars, counted the way the calculation counts them. */
  annual: number;
}

/** The calculation's fallback when the growth field is empty (useCashflowAPI). */
export const DEFAULT_GROWTH = 3;

const roundTo50 = (n: number) => Math.round(n / 50) * 50;
/** A share of the property's value, kept within a sensible range. */
const shareOfValue = (value: number, rate: number, min: number, max: number) =>
  roundTo50(Math.min(max, Math.max(min, value * rate)));

/**
 * Typical yearly running costs for a property of this type and value: rough
 * Australian rules of thumb, not quotes. Used by the Costs step's Estimate
 * buttons. 0 means no estimate (the line has no button).
 * - Units: the strata levy covers building insurance and most upkeep.
 * - Townhouses: a smaller levy; owners usually insure and maintain their own.
 * - Land: council and water service charges only.
 * Strata is a quarterly levy, like its field.
 */
export function estimateCosts(value: number, isInvestment: boolean, type: PropertyType | null): Record<CostLine["key"], number> {
  const council = shareOfValue(value, 0.0025, 1200, 4500); // ~0.25% of value
  if (type === "land") {
    return { council, water: 400, building: 0, landlord: 0, maintenance: 0, strata: 0 };
  }
  const apartment = type === "apartment";
  const townhouse = type === "townhouse";
  return {
    council,
    water: 1200, // service charges; mostly fixed
    building: apartment ? 0 : shareOfValue(value, townhouse ? 0.0015 : 0.0025, 1000, 4000),
    landlord: isInvestment ? 500 : 0,
    maintenance: apartment ? 0.3 : townhouse ? 0.4 : 0.5, // % of value
    strata: apartment
      ? shareOfValue(value / 4, 0.006, 700, 2500) // ~0.6% of value a year
      : townhouse
        ? shareOfValue(value / 4, 0.003, 400, 1500) // ~0.3% of value a year
        : 0,
  };
}

/** Lines that don't apply to vacant land (no building). Also zeroed in useCashflowAPI. */
export const BUILDING_ONLY: CostLine["key"][] = ["building", "landlord", "maintenance", "strata"];

/**
 * Every running cost as one line, totalled exactly as useCashflowAPI sends
 * them: an empty field counts as nothing, and strata is its quarterly fee
 * times four. The typical figures are placeholders only.
 */
export function costsModel(s: CashflowState) {
  const value = parseCurrencyInput((s.isNewPurchase ? s.purchasePrice : s.currentValue) || "");

  const est = estimateCosts(value, s.isInvestment, s.propertyType);

  const line = (
    key: CostLine["key"],
    label: string,
    entered: string,
    set: (v: string) => void,
    kind: CostKind,
    show: boolean,
  ): CostLine & { show: boolean } => {
    const estimate = est[key];
    const raw = kind === "percent" ? parseFloat(entered) || 0 : parseCurrencyInput(entered);
    const annual = kind === "percent" ? Math.round(value * (raw / 100)) : kind === "quarterly" ? raw * 4 : raw;
    return { key, label, entered, set, kind, estimate, annual, show };
  };

  const all = [
    line("council", "Council rates", s.councilRates, s.setCouncilRates, "currency", true),
    line("water", "Water rates", s.waterRates, s.setWaterRates, "currency", true),
    line("building", "Building insurance", s.insurance, s.setInsurance, "currency", true),
    line("landlord", "Landlord insurance", s.landlordInsurance, s.setLandlordInsurance, "currency", s.isInvestment),
    line("maintenance", "Maintenance", s.maintenance, s.setMaintenance, "percent", true),
    line("strata", "Strata / body corp", s.strataFees, s.setStrataFees, "quarterly", true),
  ];

  const lines: CostLine[] = all.filter((l) => l.show && !(s.isLand && BUILDING_ONLY.includes(l.key)));
  const annual = lines.reduce((sum, l) => sum + l.annual, 0);
  const growth = parseFloat(s.annualCostGrowthRate || "") || DEFAULT_GROWTH;

  return {
    value,
    lines,
    line: (key: CostLine["key"]) => lines.find((l) => l.key === key),
    annual,
    monthly: annual / 12,
    weekly: annual / 52,
    /** Running costs as a share of the property's value. */
    pctOfValue: value > 0 && annual > 0 ? (annual / value) * 100 : null,
    growth,
    /** Annual cost in ten years at the growth rate. */
    inTenYears: annual * Math.pow(1 + growth / 100, 10),
  };
}

/** A line's estimate as the field would show it ("$1,900", "0.5"). */
export const estimateText = (l: CostLine) =>
  l.kind === "percent" ? String(l.estimate) : `$${l.estimate.toLocaleString("en-AU")}`;

/** True when the line has an estimate it doesn't already hold. */
export const canEstimate = (l: CostLine) => l.estimate > 0 && l.entered !== estimateText(l);

/** Puts the estimate in one line, replacing what's there (the user asked for it). */
export function applyEstimate(l: CostLine) {
  if (l.estimate > 0) l.set(estimateText(l));
}

/** "Estimate all": fills every blank line; lines the user has entered are kept. */
export function fillEstimates(lines: CostLine[]) {
  for (const l of lines) if (!l.entered) applyEstimate(l);
}

/** Input change handler matching a line's unit. */
export function lineChange(l: CostLine) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (l.kind === "percent") return l.set(raw.replace(/[^\d.]/g, "").slice(0, 4));
    const digits = raw.replace(/\D/g, "");
    l.set(digits ? `$${Number(digits).toLocaleString("en-AU")}` : "");
  };
}

export const linePlaceholder = estimateText;
