import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { grantKind, useGrantsState } from "@/hooks/useGrantsState";
import type { GrantSchemeWithEligibility } from "@/lib/api";

const mockFetch = vi.fn();

vi.mock("@/lib/api", () => ({
  fetchGrantsEligibility: (...args: unknown[]) => mockFetch(...args),
}));

function scheme(id: string, category: string, eligible: boolean): GrantSchemeWithEligibility {
  return {
    scheme: {
      id, name: id, level: "State", state: "QLD", category, benefit_pill: "", theme: "",
      meta: { deposit: "", lmi: "", buyer: "" }, benefits: [], eligibility: [], summary: "",
      details: null, rules: null, valid_from: null, valid_to: null,
    },
    result: { eligible, reasons: eligible ? [] : ["No"], blockers: eligible ? [] : [{ kind: "first_home" }] },
    value: { amount: 0, share: null },
  };
}

const SCHEMES = [
  scheme("grant", "grant", true),
  scheme("duty", "concession", true),
  scheme("equity", "equity", true),
  scheme("super", "super", false),
];

/** Runs the debounce and lets the request resolve. */
async function flush() {
  await act(async () => { await vi.advanceTimersByTimeAsync(400); });
}

describe("useGrantsState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ schemes: SCHEMES });
  });
  afterEach(() => vi.useRealTimers());

  it("starts with nothing picked: federal schemes only, no property type, every switch off", async () => {
    const { result } = renderHook(() => useGrantsState());
    await flush();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toMatchObject({
      states: ["Federal"],
      property_type: null,
      buyer_type: "individual",
      first_home_buyer: false,
      owner_occupier: false,
      single_parent: false,
      off_the_plan: false,
      owned_property_in_last_2_years: null,
    });

    act(() => result.current.set("state", "QLD"));
    await flush();
    expect(mockFetch.mock.lastCall![0]).toMatchObject({ states: ["Federal", "QLD"] });
  });

  it("counts the purchase as described once state, property type and price are all in", async () => {
    const { result } = renderHook(() => useGrantsState());
    act(() => {
      result.current.set("state", "QLD");
      result.current.set("propertyType", "new");
      result.current.set("firstHome", true);
    });
    expect(result.current.described).toBe(false);
    act(() => result.current.set("price", 600_000));
    expect(result.current.described).toBe(true);
    act(() => result.current.set("propertyType", null));
    expect(result.current.described).toBe(false);
    await flush();
  });

  it("sends off the plan as a new home, and partner income only for a couple", async () => {
    const { result } = renderHook(() => useGrantsState());
    act(() => {
      result.current.set("propertyType", "off-the-plan");
      result.current.set("partnerIncome", 80_000);
    });
    await flush();
    expect(mockFetch.mock.lastCall![0]).toMatchObject({ property_type: "new", off_the_plan: true, partner_income: 0 });

    act(() => result.current.set("couple", true));
    await flush();
    expect(mockFetch.mock.lastCall![0]).toMatchObject({ buyer_type: "couple", partner_income: 80_000 });
  });

  it("asks about owning property recently only in the ACT", async () => {
    const { result } = renderHook(() => useGrantsState());
    act(() => result.current.set("state", "ACT"));
    await flush();
    expect(mockFetch.mock.lastCall![0]).toMatchObject({ states: ["Federal", "ACT"], owned_property_in_last_2_years: false });
  });

  it("splits the schemes and counts what you qualify for by kind", async () => {
    const { result } = renderHook(() => useGrantsState());
    await flush();
    expect(result.current.eligible.map((s) => s.scheme.id)).toEqual(["grant", "duty", "equity"]);
    expect(result.current.ineligible.map((s) => s.scheme.id)).toEqual(["super"]);
    expect(result.current.counts).toEqual({ grant: 1, duty: 1, deposit: 1 });
  });

  it("uses sample data without calling the API", async () => {
    const { result } = renderHook(() => useGrantsState({ schemes: SCHEMES }));
    await flush();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.eligible).toHaveLength(3);
  });
});

describe("grantKind", () => {
  it("groups the API's categories", () => {
    expect(["grant", "concession", "guarantee", "equity", "super"].map(grantKind)).toEqual(["grant", "duty", "deposit", "deposit", "deposit"]);
  });
});
