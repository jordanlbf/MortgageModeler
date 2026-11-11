import { describe, expect, it } from "vitest";
import { bracketBands } from "@/lib/tax-brackets";

describe("bracketBands", () => {
  it("splits $100k across the brackets and matches the engine's raw tax", () => {
    const bands = bracketBands(100_000);
    expect(bands.map((b) => b.income)).toEqual([18_200, 26_800, 55_000, 0, 0]);
    // compute (2026-27): 4,020 + (100,000 − 45,000) × 0.30 = 20,520
    expect(bands.reduce((a, b) => a + b.tax, 0)).toBeCloseTo(20_520);
    expect(bands.map((b) => b.current)).toEqual([false, false, true, false, false]);
  });

  it("fills full bands and part of the current one", () => {
    const [zero, low, mid] = bracketBands(90_000);
    expect(zero.fill).toBe(1);
    expect(low.fill).toBe(1);
    expect(mid.fill).toBeCloseTo(0.5);
  });

  it("puts nothing in any band at $0", () => {
    const bands = bracketBands(0);
    expect(bands.every((b) => b.income === 0 && !b.current)).toBe(true);
  });

  it("fills the open top band gradually", () => {
    const top = bracketBands(300_000)[4];
    expect(top.current).toBe(true);
    expect(top.fill).toBeGreaterThan(0);
    expect(top.fill).toBeLessThan(1);
  });
});
