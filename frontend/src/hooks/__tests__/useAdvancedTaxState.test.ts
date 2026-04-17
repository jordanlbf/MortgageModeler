import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAdvancedTaxState } from "@/hooks/useAdvancedTaxState";
import type { TaxBreakdownResponse } from "@/lib/api";

// ── Mock @/lib/api ──────────────────────────────────────────────────────────

const mockFetchTaxBreakdown = vi.fn();

vi.mock("@/lib/api", () => ({
  fetchTaxBreakdown: (...args: unknown[]) => mockFetchTaxBreakdown(...args),
}));

const MOCK_RESPONSE: TaxBreakdownResponse = {
  assessable_income: 100_000,
  total_deductions: 0,
  taxable_income: 100_000,
  repayment_income: 100_000,
  mls_income: 100_000,
  net_investment_loss: 0,
  income_tax: 24_967,
  medicare_levy: 2_000,
  medicare_levy_surcharge: 0,
  hecs_repayment: 0,
  lito: 0,
  sapto_offset: 0,
  franking_offset: 0,
  total_offsets: 0,
  total_tax: 26_967,
  net_income: 73_033,
  marginal_rate: 0.325,
  effective_rate: 0.26967,
};

describe("useAdvancedTaxState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetchTaxBreakdown.mockResolvedValue(MOCK_RESPONSE);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("initial inputs match defaults", () => {
    const { result } = renderHook(() => useAdvancedTaxState());
    const { inputs } = result.current;

    expect(inputs.salary).toBe(100_000);
    expect(inputs.hecsBal).toBe(35_000);
    expect(inputs.rental).toBe(0);
    expect(inputs.interest).toBe(0);
    expect(inputs.dividend).toBe(0);
    expect(inputs.franking).toBe(0);
    expect(inputs.capitalGainShort).toBe(0);
    expect(inputs.capitalGainLong).toBe(0);
    expect(inputs.rentalDeductions).toBe(0);
    expect(inputs.workDeductions).toBe(0);
    expect(inputs.salSac).toBe(0);
    expect(inputs.rfb).toBe(0);
    expect(inputs.phi).toBe(false);
    expect(inputs.sapto).toBe(false);
  });

  it("setter dispatches update inputs", () => {
    const { result } = renderHook(() => useAdvancedTaxState());

    act(() => result.current.setters.setSalary(150_000));
    expect(result.current.inputs.salary).toBe(150_000);

    act(() => result.current.setters.setHecsBal(50_000));
    expect(result.current.inputs.hecsBal).toBe(50_000);

    act(() => result.current.setters.setPhi(true));
    expect(result.current.inputs.phi).toBe(true);
  });

  it("API is called with correct params after debounce", async () => {
    renderHook(() => useAdvancedTaxState());

    await act(async () => {
      vi.advanceTimersByTime(80);
    });

    expect(mockFetchTaxBreakdown).toHaveBeenCalledTimes(1);

    const call = mockFetchTaxBreakdown.mock.calls[0];
    const params = call[0];

    expect(params.income.salary).toBe(100_000);
    expect(params.adjustments.hecs_bal).toBe(35_000);
    expect(params.adjustments.phi).toBe(false);
    expect(params.adjustments.sapto).toBe(false);
    // Second arg is the AbortSignal
    expect(call[1]).toBeInstanceOf(AbortSignal);
  });

  it("error state is set on API failure", async () => {
    mockFetchTaxBreakdown.mockRejectedValue(new Error("Network failure"));

    const { result } = renderHook(() => useAdvancedTaxState());

    await act(async () => {
      vi.advanceTimersByTime(80);
    });

    expect(result.current.error).toBe("Network failure");
    expect(result.current.data).toBeNull();
  });
});
