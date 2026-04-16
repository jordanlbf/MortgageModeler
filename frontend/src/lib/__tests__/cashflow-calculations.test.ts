import { describe, it, expect } from "vitest";
import {
  getMarginalTaxRate,
  calculateIncomeTax,
  formatAbbreviated,
  formatChartLabel,
} from "@/lib/cashflow-calculations";

describe("getMarginalTaxRate", () => {
  it("returns 0 for income at or below tax-free threshold", () => {
    expect(getMarginalTaxRate(0)).toBe(0);
    expect(getMarginalTaxRate(18200)).toBe(0);
  });

  it("returns 0.19 for income in 18,201-45,000 bracket", () => {
    expect(getMarginalTaxRate(30000)).toBe(0.19);
    expect(getMarginalTaxRate(45000)).toBe(0.19);
  });

  it("returns 0.325 for income in 45,001-120,000 bracket", () => {
    expect(getMarginalTaxRate(50000)).toBe(0.325);
    expect(getMarginalTaxRate(120000)).toBe(0.325);
  });

  it("returns 0.37 for income in 120,001-180,000 bracket", () => {
    expect(getMarginalTaxRate(150000)).toBe(0.37);
    expect(getMarginalTaxRate(180000)).toBe(0.37);
  });

  it("returns 0.45 for income above 180,000", () => {
    expect(getMarginalTaxRate(200000)).toBe(0.45);
    expect(getMarginalTaxRate(1000000)).toBe(0.45);
  });
});

describe("calculateIncomeTax", () => {
  // Tax includes 2% Medicare levy throughout

  it("returns 0 for zero income", () => {
    expect(calculateIncomeTax(0)).toBe(0);
  });

  it("returns only Medicare levy for income at tax-free threshold", () => {
    // 18200 * 0.02 = 364
    expect(calculateIncomeTax(18200)).toBe(364);
  });

  it("calculates correctly for $50,000 income", () => {
    // income tax: 5092 + (50000 - 45000) * 0.325 = 5092 + 1625 = 6717
    // medicare: 50000 * 0.02 = 1000
    // total: 7717
    expect(calculateIncomeTax(50000)).toBe(7717);
  });

  it("calculates correctly for $120,000 income", () => {
    // income tax: 5092 + (120000 - 45000) * 0.325 = 5092 + 24375 = 29467
    // medicare: 120000 * 0.02 = 2400
    // total: 31867
    expect(calculateIncomeTax(120000)).toBe(31867);
  });

  it("calculates correctly for $200,000 income", () => {
    // income tax: 51667 + (200000 - 180000) * 0.45 = 51667 + 9000 = 60667
    // medicare: 200000 * 0.02 = 4000
    // total: 64667
    expect(calculateIncomeTax(200000)).toBe(64667);
  });
});

describe("formatAbbreviated", () => {
  it("formats millions with 2 decimal places", () => {
    expect(formatAbbreviated(1500000)).toBe("$1.50m");
  });

  it("formats thousands with k suffix", () => {
    expect(formatAbbreviated(50000)).toBe("$50k");
  });
});

describe("formatChartLabel", () => {
  it("formats positive millions", () => {
    expect(formatChartLabel(1500000)).toBe("$1.5m");
  });

  it("formats positive thousands", () => {
    expect(formatChartLabel(50000)).toBe("$50k");
  });

  it("formats negative with unicode minus", () => {
    expect(formatChartLabel(-50000)).toBe("\u2212$50k");
  });

  it("formats small values", () => {
    expect(formatChartLabel(500)).toBe("$500");
  });

  it("formats negative small values", () => {
    expect(formatChartLabel(-500)).toBe("\u2212$500");
  });
});
