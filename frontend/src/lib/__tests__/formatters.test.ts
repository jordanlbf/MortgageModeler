import { describe, it, expect } from "vitest";
import {
  parseCurrencyInput,
  formatDollars,
  formatDollarsSigned,
  formatCurrencyShort,
  formatCompact,
  formatCompactCurrency,
} from "@/lib/formatters";

describe("parseCurrencyInput", () => {
  it("parses '$1,234' to 1234", () => {
    expect(parseCurrencyInput("$1,234")).toBe(1234);
  });

  it("handles empty string as 0", () => {
    expect(parseCurrencyInput("")).toBe(0);
  });

  it("handles negative values", () => {
    expect(parseCurrencyInput("-$500")).toBe(-500);
  });

  it("handles non-numeric 'abc' as 0", () => {
    expect(parseCurrencyInput("abc")).toBe(0);
  });

  it("parses plain number string", () => {
    expect(parseCurrencyInput("42.5")).toBe(42.5);
  });
});

describe("formatDollars", () => {
  it("formats 1234 as '$1,234'", () => {
    expect(formatDollars(1234)).toBe("$1,234");
  });

  it("formats 0 as empty string", () => {
    expect(formatDollars(0)).toBe("");
  });

  it("formats negative as '-$1,234'", () => {
    expect(formatDollars(-1234)).toBe("-$1,234");
  });
});

describe("formatDollarsSigned", () => {
  it("formats positive as '$1,234'", () => {
    expect(formatDollarsSigned(1234)).toBe("$1,234");
  });

  it("formats negative with unicode minus '\u2212$1,234'", () => {
    expect(formatDollarsSigned(-1234)).toBe("\u2212$1,234");
  });

  it("formats zero as '$0'", () => {
    expect(formatDollarsSigned(0)).toBe("$0");
  });
});

describe("formatCurrencyShort", () => {
  it("formats with no decimal places", () => {
    const result = formatCurrencyShort(1234);
    // Intl en-AU uses $, no decimals
    expect(result).toMatch(/\$1,234/);
    expect(result).not.toContain(".");
  });

  it("formats 0", () => {
    const result = formatCurrencyShort(0);
    expect(result).toMatch(/\$0/);
  });
});

describe("formatCompact", () => {
  it("formats millions with 'm' suffix", () => {
    expect(formatCompact(1_500_000)).toBe("1.5m");
  });

  it("formats thousands with 'k' suffix", () => {
    expect(formatCompact(50_000)).toBe("50k");
  });

  it("formats small numbers as-is", () => {
    expect(formatCompact(500)).toBe("500");
  });

  it("formats exactly 1 million", () => {
    expect(formatCompact(1_000_000)).toBe("1.0m");
  });

  it("formats exactly 1 thousand", () => {
    expect(formatCompact(1_000)).toBe("1k");
  });
});

describe("formatCompactCurrency", () => {
  it("formats positive millions", () => {
    expect(formatCompactCurrency(1_500_000)).toBe("$1.5m");
  });

  it("formats positive thousands", () => {
    expect(formatCompactCurrency(50_000)).toBe("$50k");
  });

  it("formats small values", () => {
    expect(formatCompactCurrency(500)).toBe("$500");
  });

  it("formats negative with unicode minus", () => {
    expect(formatCompactCurrency(-50_000)).toBe("\u2212$50k");
  });

  it("formats negative small values", () => {
    expect(formatCompactCurrency(-500)).toBe("\u2212$500");
  });

  it("formats zero", () => {
    expect(formatCompactCurrency(0)).toBe("$0");
  });
});
