import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useCashflowFormState } from "@/hooks/useCashflowFormState";

describe("useCashflowFormState", () => {
  it("initial form values match defaults", () => {
    const { result } = renderHook(() => useCashflowFormState());
    const { form } = result.current;

    expect(form.taxableIncome).toBe("$120,000");
    expect(form.purchasePrice).toBe("");
    expect(form.depositAmount).toBe("");
    expect(form.interestRate).toBe("6.5");
    expect(form.loanTerm).toBe("30");
    expect(form.hasOffset).toBe(false);
    expect(form.weeklyRent).toBe("$650");
    expect(form.propertyUse).toBeNull();
    expect(form.purchaseMode).toBeNull();
    expect(form.setupComplete).toBe(false);
    expect(form.propertyComplete).toBe(false);
    expect(form.viewMode).toBe("summary");
    expect(form.depreciationMode).toBe("estimate");
  });

  it("setters update individual fields", () => {
    const { result } = renderHook(() => useCashflowFormState());

    act(() => result.current.setters.setPurchasePrice("500000"));
    expect(result.current.form.purchasePrice).toBe("500000");

    act(() => result.current.setters.setInterestRate("5.5"));
    expect(result.current.form.interestRate).toBe("5.5");

    act(() => result.current.setters.setHasOffset(true));
    expect(result.current.form.hasOffset).toBe(true);
  });

  it("setter object has referential stability across renders", () => {
    const { result, rerender } = renderHook(() => useCashflowFormState());
    const settersBefore = result.current.setters;

    rerender();
    expect(result.current.setters).toBe(settersBefore);
  });

  it('RESET_SECTION "property" cascades to reset propertyComplete, loanComplete, costsComplete, rentalComplete, taxComplete', () => {
    const { result } = renderHook(() => useCashflowFormState());

    // Set all completion flags to true first
    act(() => {
      result.current.setters.setPropertyComplete(true);
      result.current.setters.setLoanComplete(true);
      result.current.setters.setCostsComplete(true);
      result.current.setters.setRentalComplete(true);
      result.current.setters.setTaxComplete(true);
    });

    expect(result.current.form.propertyComplete).toBe(true);
    expect(result.current.form.loanComplete).toBe(true);
    expect(result.current.form.costsComplete).toBe(true);
    expect(result.current.form.rentalComplete).toBe(true);
    expect(result.current.form.taxComplete).toBe(true);

    act(() => result.current.resetSection("property"));

    expect(result.current.form.propertyComplete).toBe(false);
    expect(result.current.form.loanComplete).toBe(false);
    expect(result.current.form.costsComplete).toBe(false);
    expect(result.current.form.rentalComplete).toBe(false);
    expect(result.current.form.taxComplete).toBe(false);
  });

  it('RESET_SECTION "tax" only resets taxComplete', () => {
    const { result } = renderHook(() => useCashflowFormState());

    act(() => {
      result.current.setters.setPropertyComplete(true);
      result.current.setters.setLoanComplete(true);
      result.current.setters.setTaxComplete(true);
    });

    act(() => result.current.resetSection("tax"));

    expect(result.current.form.taxComplete).toBe(false);
    // Others remain true
    expect(result.current.form.propertyComplete).toBe(true);
    expect(result.current.form.loanComplete).toBe(true);
  });

  it("toggleSection adds and removes from expandedSections set", () => {
    const { result } = renderHook(() => useCashflowFormState());

    // "propertyUse" is in the initial set
    expect(result.current.expandedSections.has("propertyUse")).toBe(true);

    // Toggle it off
    act(() => result.current.toggleSection("propertyUse"));
    expect(result.current.expandedSections.has("propertyUse")).toBe(false);

    // Toggle it back on
    act(() => result.current.toggleSection("propertyUse"));
    expect(result.current.expandedSections.has("propertyUse")).toBe(true);

    // Toggle a new section on
    act(() => result.current.toggleSection("loan"));
    expect(result.current.expandedSections.has("loan")).toBe(true);
  });

  it("resetSection adds section to expandedSections", () => {
    const { result } = renderHook(() => useCashflowFormState());

    expect(result.current.expandedSections.has("property")).toBe(false);

    act(() => result.current.resetSection("property"));
    expect(result.current.expandedSections.has("property")).toBe(true);
  });
});
