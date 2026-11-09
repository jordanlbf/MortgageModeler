import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAmortisationState } from "@/hooks/useAmortisationState";
import type { ScheduleResponse } from "@/lib/api";

// ── Mock @/lib/api ──────────────────────────────────────────────────────────

const mockFetchSchedule = vi.fn();

vi.mock("@/lib/api", () => ({
  fetchSchedule: (...args: unknown[]) => mockFetchSchedule(...args),
}));

const MOCK_RESPONSE: ScheduleResponse = {
  summary: {
    purchase_price: 600_000,
    deposit: 100_000,
    loan_amount: 500_000,
    lvr: 0.8333,
    annual_appreciation: 0,
  },
  payment: 592.5,
  total_interest: 1_041_000,
  total_periods: 1560,
  rows: Array.from({ length: 1560 }, (_, i) => ({
    period: i + 1,
    opening_balance: 500_000 - i * 300,
    interest: 50,
    principal_paid: 10,
    extra_paid: 0,
    closing_balance: 500_000 - (i + 1) * 300,
    annual_rate: 0.062,
    scheduled_repayment: 592.5,
    offset_balance: 0,
  })),
  chart_data: [
    { year: 1, balance: 495_000, total_interest: 30_000, property_value: 600_000, equity: 105_000, offset_balance: 0 },
    { year: 2, balance: 489_000, total_interest: 59_500, property_value: 600_000, equity: 111_000, offset_balance: 0 },
  ],
};

describe("useAmortisationState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetchSchedule.mockResolvedValue(MOCK_RESPONSE);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("initial inputs match defaults", () => {
    const { result } = renderHook(() => useAmortisationState());
    const { inputs } = result.current;

    expect(inputs.purchasePrice).toBe(600_000);
    expect(inputs.deposit).toBe(100_000);
    expect(inputs.rate).toBe(6.2);
    expect(inputs.years).toBe(30);
    expect(inputs.appreciation).toBe(0);
    expect(inputs.offsetBalance).toBe(0);
    expect(inputs.offsetContribution).toBe(0);
    expect(inputs.frequency).toBe("weekly");
  });

  it("frequency change adjusts offsetContribution proportionally", () => {
    const { result } = renderHook(() => useAmortisationState());

    // Set an offset contribution first
    act(() => result.current.setters.setOffsetContribution(520));

    // Change from weekly (52) to monthly (12) => 520 * 12/52 = 120, but hook does prev / ratio
    // ratio = PERIODS_PER_YEAR[next] / PERIODS_PER_YEAR[current] = 12 / 52
    // contribution = Math.round(520 / (12/52)) = Math.round(520 * 52/12) = Math.round(2253.33) = 2253
    // Wait, re-reading the hook: ratio = PERIODS_PER_YEAR[next] / PERIODS_PER_YEAR[frequency]
    // setOffsetContribution(prev => Math.round(prev / ratio))
    // ratio = 12/52 = 0.2307...
    // 520 / 0.2307 = 2253.33 => 2253
    // Actually that's wrong - if going weekly->monthly the per-period amount should increase
    // weekly $520 => monthly should be 520 * (52/12) = 2253
    // The formula: prev / (next_ppy / curr_ppy) = prev * curr_ppy / next_ppy = 520 * 52/12 = 2253
    act(() => result.current.setters.setFrequency("monthly"));
    expect(result.current.inputs.offsetContribution).toBe(2253);
    expect(result.current.inputs.frequency).toBe("monthly");

    // Change from monthly (12) to fortnightly (26)
    // ratio = 26/12 = 2.1667
    // 2253 / 2.1667 = 1039.85 => 1040
    act(() => result.current.setters.setFrequency("fortnightly"));
    expect(result.current.inputs.offsetContribution).toBe(1040);
  });

  it("API is called via useApiCall after render", async () => {
    renderHook(() => useAmortisationState());

    await act(async () => {
      vi.advanceTimersByTime(80);
    });

    expect(mockFetchSchedule).toHaveBeenCalledTimes(1);
    const call = mockFetchSchedule.mock.calls[0];
    const params = call[0];

    expect(params.purchase_price).toBe(600_000);
    expect(params.deposit).toBe(100_000);
    expect(params.annual_rate).toBeCloseTo(0.062);
    expect(params.loan_term_years).toBe(30);
    expect(params.frequency).toBe("weekly");
    expect(params.annual_appreciation).toBe(0);
    expect(params.offset_balance).toBe(0);
    expect(params.offset_contribution).toBe(0);
    // Signal is the second argument
    expect(call[1]).toBeInstanceOf(AbortSignal);
  });

  it("chartData derives correctly from mock response", async () => {
    const { result } = renderHook(() => useAmortisationState());

    await act(async () => {
      vi.advanceTimersByTime(80);
    });

    const { chartData } = result.current;
    expect(chartData).toHaveLength(2);

    const first = chartData[0];
    expect(first.y).toBe(1);
    expect(first.bal).toBe(495_000);
    expect(first.int).toBe(30_000);
    expect(first.eq).toBe(105_000);
    // paid = total_interest + (loan_amount - balance) = 30000 + (500000 - 495000) = 35000
    expect(first.paid).toBe(35_000);
    // lvr = (balance / property_value) * 100 = (495000/600000)*100 = 82.5
    expect(first.lvr).toBe(82.5);
    expect(first.offset).toBe(0);
  });

  it("tableRows filters to yearly rows from mock response", async () => {
    const { result } = renderHook(() => useAmortisationState());

    await act(async () => {
      vi.advanceTimersByTime(80);
    });

    const { tableRows } = result.current;
    // frequency is "weekly" => PERIODS_PER_YEAR = 52
    // Filter: every 52nd row (index % 52 === 0) plus the last row
    // 1560 rows: indices 0, 52, 104, ..., 1508 = 30 rows, plus last row (index 1559)
    // index 1508 = 29*52 = last multiple, plus index 1559 => 31 rows total
    expect(tableRows.length).toBe(31);
    // First row is period 1 (index 0)
    expect(tableRows[0].period).toBe(1);
    // Last row is the final period
    expect(tableRows[tableRows.length - 1].period).toBe(1560);
  });

  it("summary gives the headline figures, with the payoff time in years and months", async () => {
    const { result } = renderHook(() => useAmortisationState());

    await act(async () => {
      vi.advanceTimersByTime(80);
    });

    const { summary } = result.current;
    expect(summary).not.toBeNull();
    expect(summary!.payment).toBe(592.5);
    expect(summary!.loanAmount).toBe(500_000);
    expect(summary!.totalInterest).toBe(1_041_000);
    expect(summary!.totalRepaid).toBe(1_541_000);
    // 1560 weekly periods = 30 years exactly
    expect(summary!.payoffYears).toBe(30);
    expect(summary!.payoffMonths).toBe(0);
  });

  it("a source supplies the inputs and schedule without calling the API", async () => {
    mockFetchSchedule.mockClear();
    const { result } = renderHook(() =>
      useAmortisationState({ inputs: { purchasePrice: 500_000, frequency: "monthly" }, data: { ...MOCK_RESPONSE, total_periods: 291 } }),
    );

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(mockFetchSchedule).not.toHaveBeenCalled();
    expect(result.current.inputs.purchasePrice).toBe(500_000);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    // 291 monthly periods = 24 years 3 months
    expect(result.current.summary!.payoffYears).toBe(24);
    expect(result.current.summary!.payoffMonths).toBe(3);
  });

  it("with an offset, fetches the loan without it and reports what the offset saves", async () => {
    mockFetchSchedule.mockClear();
    mockFetchSchedule.mockImplementation((params: { offset_balance: number }) =>
      Promise.resolve(
        params.offset_balance > 0
          ? { ...MOCK_RESPONSE, total_interest: 800_000, total_periods: 1300 }
          : MOCK_RESPONSE,
      ),
    );
    const { result } = renderHook(() => useAmortisationState());

    act(() => result.current.setters.setOffsetBalance(50_000));
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // One call with the offset, one without it
    const balances = mockFetchSchedule.mock.calls.map((c) => c[0].offset_balance);
    expect(balances).toContain(50_000);
    expect(balances).toContain(0);

    const offset = result.current.summary!.offset!;
    expect(offset.interestSaved).toBe(241_000);
    // 1560 vs 1300 weekly periods = 360 vs 300 months
    expect(offset.monthsSooner).toBe(60);
  });

  it("without an offset, there's no saving and no second call", async () => {
    mockFetchSchedule.mockClear();
    const { result } = renderHook(() => useAmortisationState());
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(mockFetchSchedule).toHaveBeenCalledTimes(1);
    expect(result.current.summary!.offset).toBeNull();
  });
});
