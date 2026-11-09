import { describe, expect, it } from "vitest";
import { EMPTY_TAX_INPUTS, type TaxResults } from "@/hooks/useTaxState";
import type { TaxBreakdownResponse } from "@/lib/api";
import { effectiveRate, propertyFigure, shareLabel, splitSegments, workings } from "../model";

const BASE: TaxBreakdownResponse = {
  assessable_income: 138_600,
  total_deductions: 34_500,
  taxable_income: 104_100,
  repayment_income: 110_000,
  mls_income: 110_000,
  net_investment_loss: 5_900,
  income_tax: 22_018,
  medicare_levy: 2_082,
  medicare_levy_surcharge: 0,
  hecs_repayment: 6_450,
  lito: 0,
  sapto_offset: 0,
  franking_offset: 0,
  total_offsets: 0,
  total_tax: 30_550,
  net_income: 73_550,
  marginal_rate: 0.3,
  effective_rate: 0.22,
};
const results = (b: Partial<TaxBreakdownResponse> = {}): TaxResults => ({
  breakdown: { ...BASE, ...b },
  keepPer1000: 530,
  claimSaves: 470,
  property: null,
});
const INVESTOR = { ...EMPTY_TAX_INPUTS, salary: 110_000, rental: 28_600, rentalDeductions: 34_500, hecsBal: 35_000, phi: true };

describe("splitSegments", () => {
  it("splits taxable income into what you keep and each tax, dropping zeros", () => {
    const s = splitSegments(results());
    expect(s.map((x) => x.key)).toEqual(["kept", "incomeTax", "medicare", "hecs"]);
    expect(s.reduce((a, x) => a + x.amount, 0)).toBe(104_100);
  });

  it("leaves a refund out of the bar, so the parts still add up to taxable income", () => {
    const s = splitSegments(results({ taxable_income: 28_571, income_tax: -8_571, medicare_levy: 135, hecs_repayment: 0, total_tax: -8_436, net_income: 37_007 }));
    expect(s.map((x) => x.key)).toEqual(["kept", "medicare"]);
    expect(s[0].amount).toBe(28_436);
  });
});

describe("effectiveRate", () => {
  it("is over taxable income, the same base as the bar", () => {
    expect(effectiveRate(results())).toBeCloseTo(30_550 / 104_100);
  });
  it("is 0% with a refund", () => {
    expect(effectiveRate(results({ total_tax: -7_880 }))).toBe(0);
  });
});

describe("shareLabel", () => {
  it("rounds, but never shows a sliver as 0%", () => {
    expect(shareLabel(21, 100)).toBe("21%");
    expect(shareLabel(135, 28_571)).toBe("<1%");
    expect(shareLabel(0, 100)).toBe("0%");
  });
});

describe("propertyFigure", () => {
  it("leads with what a loss costs after tax", () => {
    expect(propertyFigure({ net: -5_900, taxChange: -1_888 })).toEqual({
      value: "Costs $4,012",
      note: "A year, after tax. Its $5,900 loss cuts your tax by $1,888.",
    });
  });
  it("says when a loss doesn't lower your tax", () => {
    expect(propertyFigure({ net: -3_000, taxChange: 0 }).note).toMatch(/doesn't lower your tax/);
  });
  it("leads with what a profit earns after tax", () => {
    expect(propertyFigure({ net: 8_000, taxChange: 2_560 }).value).toBe("Earns $5,440");
  });
});

describe("workings", () => {
  it("explains the income, deductions and HELP lines", () => {
    const w = workings(INVESTOR, results());
    expect(w.income[0].note).toBe("Salary $110,000 · Rent $28,600");
    expect(w.income[1]).toMatchObject({ amount: -34_500, note: "Property $34,500" });
    expect(w.tax.find((r) => r.key === "hecs")?.note).toMatch(/adds back property losses/);
    expect(w.tax.find((r) => r.key === "mls")?.note).toBe("None: you have hospital cover");
  });

  it("shows a franking refund as money back", () => {
    const w = workings(
      { ...EMPTY_TAX_INPUTS, dividend: 20_000, franking: 8_571 },
      results({ income_tax: -8_571, franking_offset: 8_571, total_tax: -7_880 }),
    );
    const it = w.tax.find((r) => r.key === "incomeTax");
    expect(it).toMatchObject({ label: "Income tax refund", amount: 8_571, refund: true });
    expect(w.tax.find((r) => r.key === "total")).toMatchObject({ label: "Tax refund", amount: 7_880, refund: true });
    expect(w.income[0].note).toContain("Dividends with franking $28,571");
  });

  it("counts long-term gains at half and says so", () => {
    const w = workings({ ...EMPTY_TAX_INPUTS, salary: 100_000, capitalGainLong: 40_000 }, results());
    expect(w.income[0].note).toBe("Salary $100,000 · Capital gains $20,000, gains held a year or more count at half");
  });
});
