import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TaxBreakdownRequest, TaxBreakdownResponse } from "@/lib/api";
import { useTaxState } from "@/hooks/useTaxState";

const mockFetch = vi.fn();
vi.mock("@/lib/api", () => ({ fetchTaxBreakdown: (...args: unknown[]) => mockFetch(...args) }));

/** A fake engine: 30% of salary minus work deductions, plus 20% of property net. */
function fakeTax(req: TaxBreakdownRequest): TaxBreakdownResponse {
  const i = req.income, d = req.deductions;
  const total = 0.3 * (i.salary - d.work_deductions) + 0.2 * (i.rental - d.rental_deductions);
  return { total_tax: total } as TaxBreakdownResponse;
}

const flush = async () => {
  await act(async () => { vi.advanceTimersByTime(200); });
  await act(async () => { await Promise.resolve(); });
};

describe("useTaxState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (req: TaxBreakdownRequest) => fakeTax(req));
  });
  afterEach(() => vi.useRealTimers());

  it("starts blank and makes no request until there's income", async () => {
    const { result } = renderHook(() => useTaxState());
    await flush();
    expect(result.current.inputs.salary).toBe(0);
    expect(result.current.results).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("works out the extra-$1,000 figures from the same endpoint", async () => {
    const { result } = renderHook(() => useTaxState());
    act(() => result.current.set("salary", 100_000));
    await flush();
    // Base, +$1,000 salary, +$1,000 deduction; no property, so no fourth call.
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result.current.results?.keepPer1000).toBeCloseTo(700);
    expect(result.current.results?.claimSaves).toBeCloseTo(300);
    expect(result.current.results?.property).toBeNull();
  });

  it("says what the property does to your tax", async () => {
    const { result } = renderHook(() => useTaxState());
    act(() => {
      result.current.set("salary", 100_000);
      result.current.set("rental", 20_000);
      result.current.set("rentalDeductions", 25_000);
    });
    await flush();
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(result.current.results?.property).toEqual({ net: -5_000, taxChange: -1_000 });
  });

  it("shows a plain error and retries on request", async () => {
    mockFetch.mockRejectedValue(new Error("API error: 500"));
    const { result } = renderHook(() => useTaxState());
    act(() => result.current.set("salary", 80_000));
    await flush();
    expect(result.current.error).toBe("Couldn't calculate your tax. Check your connection.");

    mockFetch.mockImplementation(async (req: TaxBreakdownRequest) => fakeTax(req));
    act(() => result.current.retry());
    await flush();
    expect(result.current.error).toBeNull();
    expect(result.current.results).not.toBeNull();
  });

  it("uses sample results without calling the API", async () => {
    const sample = { breakdown: { total_tax: 1 } as TaxBreakdownResponse, keepPer1000: 1, claimSaves: 1, property: null };
    const { result } = renderHook(() => useTaxState({ inputs: { salary: 50_000 }, results: sample }));
    await flush();
    expect(result.current.results).toBe(sample);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
