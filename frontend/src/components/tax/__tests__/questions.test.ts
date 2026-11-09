import { describe, expect, it } from "vitest";
import { EMPTY_TAX_INPUTS } from "@/hooks/useTaxState";
import { answerSummary, initialAnswers, TAX_QUESTIONS } from "../questions";

const all = (yes: string[] = []) => Object.fromEntries(TAX_QUESTIONS.map((q) => [q.id, yes.includes(q.id)]));

describe("initialAnswers", () => {
  it("asks everything when the inputs are blank", () => {
    expect(initialAnswers(EMPTY_TAX_INPUTS)).toEqual({});
  });

  it("answers everything for figures already filled in, yes where there's something", () => {
    const a = initialAnswers({ ...EMPTY_TAX_INPUTS, salary: 110_000, rental: 28_600, hecsBal: 35_000, phi: true });
    expect(a).toEqual(all(["property", "help", "phi"]));
  });
});

describe("answerSummary", () => {
  const q = (id: string) => TAX_QUESTIONS.find((x) => x.id === id)!;
  const i = { ...EMPTY_TAX_INPUTS, rental: 28_600, rentalDeductions: 34_500, hecsBal: 35_000 };

  it("folds a yes to what it adds up to", () => {
    expect(answerSummary(q("property"), true, i)).toBe("$5,900 loss");
    expect(answerSummary(q("help"), true, i)).toBe("$35,000");
    expect(answerSummary(q("phi"), true, i)).toBe("Yes");
  });

  it("says so when a yes has nothing entered yet, and folds a no to No", () => {
    expect(answerSummary(q("work"), true, i)).toBe("Yes, $0 so far");
    expect(answerSummary(q("savings"), false, i)).toBe("No");
  });
});
