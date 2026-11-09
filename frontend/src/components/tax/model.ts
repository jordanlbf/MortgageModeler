import type { TaxInputs, TaxResults } from "@/hooks/useTaxState";
import { formatDollars } from "@/lib/formatters";
import { TAX_COLORS } from "@/lib/theme";

export interface Segment {
  key: "kept" | "incomeTax" | "medicare" | "mls" | "hecs";
  label: string;
  amount: number;
  color: string;
}

/**
 * Taxable income split into what you keep and each tax. Zero parts are dropped.
 * A refund isn't part of taxable income, so "You keep" is what's left after the
 * taxes you pay; the parts always add up to taxable income.
 */
export function splitSegments(r: TaxResults): Segment[] {
  const b = r.breakdown;
  const taxes: Segment[] = [
    { key: "incomeTax", label: "Income tax", amount: Math.max(0, b.income_tax), color: TAX_COLORS.incomeTax },
    { key: "medicare", label: "Medicare", amount: b.medicare_levy, color: TAX_COLORS.medicare },
    { key: "mls", label: "Surcharge", amount: b.medicare_levy_surcharge, color: TAX_COLORS.mls },
    { key: "hecs", label: "HELP", amount: b.hecs_repayment, color: TAX_COLORS.hecs },
  ];
  const paid = taxes.reduce((a, s) => a + s.amount, 0);
  const kept: Segment = { key: "kept", label: "You keep", amount: Math.max(0, b.taxable_income - paid), color: TAX_COLORS.netIncome };
  return [kept, ...taxes].filter((s) => s.amount > 0);
}

/** A part's share for the legend; a sliver shows as "<1%", not "0%". */
export function shareLabel(part: number, whole: number): string {
  const p = whole > 0 ? (part / whole) * 100 : 0;
  return p > 0 && p < 0.5 ? "<1%" : `${Math.round(p)}%`;
}

/**
 * Total tax as a share of taxable income, the same base as the split bar, so
 * the rate and the bar's tax parts always add up. (The engine's own
 * `effective_rate` is over total income, before deductions.) A refund counts as 0%.
 */
export function effectiveRate(r: TaxResults): number {
  const b = r.breakdown;
  return b.taxable_income > 0 ? Math.max(0, b.total_tax) / b.taxable_income : 0;
}

/** What the property is worth to you after tax: its loss or profit, net of the tax it changes. */
export function propertyFigure({ net, taxChange }: { net: number; taxChange: number }): { value: string; note: string } {
  const afterTax = net - taxChange;
  const tax = formatDollars(Math.abs(taxChange)) || "$0";
  if (net < 0) {
    return {
      value: `Costs ${formatDollars(-afterTax) || "$0"}`,
      note: taxChange < 0
        ? `A year, after tax. Its ${formatDollars(-net)} loss cuts your tax by ${tax}.`
        : `A year. Its ${formatDollars(-net)} loss doesn't lower your tax at this income.`,
    };
  }
  if (net > 0) {
    return {
      value: `Earns ${formatDollars(afterTax) || "$0"}`,
      note: `A year, after tax. Its ${formatDollars(net)} profit adds ${tax} to your tax.`,
    };
  }
  return { value: "Breaks even", note: "It doesn't change your tax." };
}

export interface WorkingRow {
  key: string;
  label: string;
  /** Signed amount; deductions are negative. */
  amount: number;
  note?: string;
  color?: string;
  /** A subtotal or the result: semibold with a stronger rule above. */
  total?: boolean;
  /** Nothing to pay: shown faded so the line is still explained. */
  muted?: boolean;
  /** Money back (a negative tax): shown as a positive figure in the positive colour. */
  refund?: boolean;
}

const list = (parts: [string, number][]) =>
  parts.filter(([, v]) => v > 0).map(([l, v]) => `${l} ${formatDollars(v)}`).join(" · ");

/** "How it's worked out": income down to taxable income, then each tax, then what's left. */
export function workings(i: TaxInputs, r: TaxResults): { income: WorkingRow[]; tax: WorkingRow[] } {
  const b = r.breakdown;
  const capitalGains = i.capitalGainShort + i.capitalGainLong / 2;
  const incomeNote = list([
    ["Salary", i.salary],
    ["Rent", i.rental],
    ["Interest", i.interest],
    ["Dividends with franking", i.dividend + i.franking],
    ["Capital gains", capitalGains],
  ]);
  const notes = [
    incomeNote,
    i.capitalGainLong > 0 && "gains held a year or more count at half",
  ].filter(Boolean);

  const offsets = b.lito + b.sapto_offset;
  const reducedMedicare = b.medicare_levy > 0 && b.medicare_levy < b.taxable_income * 0.02 - 1;
  const refund = b.income_tax < 0;

  return {
    income: [
      { key: "income", label: "Total income", amount: b.assessable_income, note: notes.join(", ") },
      {
        key: "deductions",
        label: "Deductions",
        amount: -b.total_deductions,
        muted: b.total_deductions === 0,
        note: b.total_deductions > 0 ? list([["Property", i.rentalDeductions], ["Work", i.workDeductions]]) : "None entered",
      },
      { key: "taxable", label: "Taxable income", amount: b.taxable_income, total: true },
    ],
    tax: [
      {
        key: "incomeTax",
        label: refund ? "Income tax refund" : "Income tax",
        amount: refund ? -b.income_tax : b.income_tax,
        refund,
        color: TAX_COLORS.incomeTax,
        note: [
          `Top rate ${Math.round(b.marginal_rate * 100)}%`,
          offsets > 0 && `less ${formatDollars(offsets)} in offsets`,
          b.franking_offset > 0 && `less ${formatDollars(b.franking_offset)} franking credits`,
        ].filter(Boolean).join(", "),
      },
      {
        key: "medicare",
        label: "Medicare levy",
        amount: b.medicare_levy,
        color: TAX_COLORS.medicare,
        muted: b.medicare_levy === 0,
        note: b.medicare_levy === 0 ? "None at this income" : reducedMedicare ? "Reduced at this income" : "2% of taxable income",
      },
      {
        key: "mls",
        label: "Medicare levy surcharge",
        amount: b.medicare_levy_surcharge,
        color: TAX_COLORS.mls,
        muted: b.medicare_levy_surcharge === 0,
        note: b.medicare_levy_surcharge > 0
          ? "Private hospital cover would avoid this"
          : i.phi ? "None: you have hospital cover" : "None at this income",
      },
      {
        key: "hecs",
        label: "HELP repayment",
        amount: b.hecs_repayment,
        color: TAX_COLORS.hecs,
        muted: b.hecs_repayment === 0,
        note: i.hecsBal === 0
          ? "No HELP debt entered"
          : b.hecs_repayment > 0
            ? `On repayment income of ${formatDollars(b.repayment_income)}${b.net_investment_loss > 0 ? ", which adds back property losses" : ""}`
            : "None at this income",
      },
      b.total_tax < 0
        ? { key: "total", label: "Tax refund", amount: -b.total_tax, total: true, refund: true }
        : { key: "total", label: "Total tax", amount: b.total_tax, total: true },
      { key: "kept", label: "After-tax income", amount: b.net_income, total: true, color: TAX_COLORS.netIncome },
    ],
  };
}
