import { describe, it, expect } from "vitest";
import {
  getMarginalTaxRate,
  formatAbbreviated,
  formatChartLabel,
} from "@/lib/cashflow-calculations";

describe("getMarginalTaxRate (Stage 3 — effective 1 July 2024)", () => {
  it("returns 0 for income at or below tax-free threshold", () => {
    expect(getMarginalTaxRate(0)).toBe(0);
    expect(getMarginalTaxRate(18200)).toBe(0);
  });

  it("returns 0.16 for income in 18,201-45,000 bracket", () => {
    expect(getMarginalTaxRate(30000)).toBe(0.16);
    expect(getMarginalTaxRate(45000)).toBe(0.16);
  });

  it("returns 0.30 for income in 45,001-135,000 bracket", () => {
    expect(getMarginalTaxRate(50000)).toBe(0.30);
    expect(getMarginalTaxRate(135000)).toBe(0.30);
  });

  it("returns 0.37 for income in 135,001-190,000 bracket", () => {
    expect(getMarginalTaxRate(150000)).toBe(0.37);
    expect(getMarginalTaxRate(190000)).toBe(0.37);
  });

  it("returns 0.45 for income above 190,000", () => {
    expect(getMarginalTaxRate(200000)).toBe(0.45);
    expect(getMarginalTaxRate(1000000)).toBe(0.45);
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
