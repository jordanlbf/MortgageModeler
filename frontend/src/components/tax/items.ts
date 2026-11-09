import type { TaxInputs, TaxResults } from "@/hooks/useTaxState";
import { workings } from "./model";
import { t, TAX_COLORS } from "@/lib/theme";
import { formatDollars } from "@/lib/formatters";

export const pct = (r: number, dp = 1) => `${(r * 100).toFixed(dp)}%`;

/** Whole dollars, "$0" rather than blank. */
export const money = (n: number) => formatDollars(Math.round(n)) || "$0";

/** A colour tinted towards transparent, for washes and borders in any theme. */
export const tint = (color: string, amount: number) => `color-mix(in oklab, ${color} ${amount}%, transparent)`;

export const KPI_COLORS = {
  taxable: t.data.primary,
  tax: TAX_COLORS.incomeTax,
  kept: TAX_COLORS.netIncome,
  rate: t.data.warning,
} as const;

export const PERIODS = [
  { value: "week", label: "Week", per: 52 },
  { value: "fortnight", label: "Fortnight", per: 26 },
  { value: "month", label: "Month", per: 12 },
  { value: "year", label: "Year", per: 1 },
] as const;
export type Period = (typeof PERIODS)[number]["value"];

export const perLabel = (unit: string) => `a ${unit}`;

export interface TaxItem {
  key: "incomeTax" | "offsets" | "medicare" | "mls" | "hecs";
  label: string;
  short: string;
  /** Signed: offsets are negative. */
  amount: number;
  color: string;
  note: string;
  /** Nothing to pay at this income. */
  muted: boolean;
}

/** Every tax item, gross income tax first, so offsets can be shown taking some back. */
export interface ItemSum {
  taxable: number;
  charged: TaxItem[];
  notCharged: TaxItem[];
  total: number;
  kept: number;
  topRate: number;
  avgRate: number;
}

export function itemSum(i: TaxInputs, r: TaxResults): ItemSum {
  const b = r.breakdown;
  // income_tax is after offsets; add them back to show the tax before they come off.
  const offsets = Math.max(0, b.total_offsets);
  const bracketTax = b.income_tax + offsets;
  const rows = workings(i, r).tax;
  const levy = (key: "medicare" | "mls" | "hecs", short: string): TaxItem => {
    const w = rows.find((x) => x.key === key);
    return {
      key,
      label: w?.label ?? short,
      short,
      amount: w?.amount ?? 0,
      color: w?.color ?? t.fg.tertiary,
      note: w?.note ?? "",
      muted: !w || w.amount === 0,
    };
  };

  const items: TaxItem[] = [
    {
      key: "incomeTax",
      label: "Income tax",
      short: "Income tax",
      amount: bracketTax,
      color: TAX_COLORS.incomeTax,
      note: `On ${money(b.taxable_income)}, top rate ${pct(b.marginal_rate, 0)}`,
      muted: bracketTax === 0,
    },
    {
      key: "offsets",
      label: "Tax offsets",
      short: "Offsets",
      amount: -offsets,
      color: t.data.positive,
      note:
        [b.lito > 0 && "Low income", b.sapto_offset > 0 && "Seniors", b.franking_offset > 0 && "Franking credits"].filter(Boolean).join(", ") ||
        "Taken off your income tax",
      muted: offsets === 0,
    },
    levy("medicare", "Medicare"),
    levy("mls", "Surcharge"),
    levy("hecs", "HELP"),
  ];

  return {
    taxable: b.taxable_income,
    charged: items.filter((x) => !x.muted),
    notCharged: items.filter((x) => x.muted && x.key !== "offsets"),
    total: b.total_tax,
    kept: b.net_income,
    topRate: b.marginal_rate,
    avgRate: b.taxable_income > 0 ? b.total_tax / b.taxable_income : 0,
  };
}

export interface Part {
  key: string;
  label: string;
  amount: number;
  color: string;
}

/** Taxable income split into take-home and each tax, with offsets netted into income tax so the parts add up. */
export function netParts(s: ItemSum): Part[] {
  const off = s.charged.find((x) => x.key === "offsets")?.amount ?? 0;
  const taxes = s.charged
    .filter((x) => x.amount > 0)
    .map((x) => ({ key: x.key, label: x.short, amount: x.key === "incomeTax" ? x.amount + off : x.amount, color: x.color }))
    .filter((x) => x.amount > 0);
  return [{ key: "kept", label: "Take-home", amount: Math.max(0, s.kept), color: KPI_COLORS.kept }, ...taxes];
}
