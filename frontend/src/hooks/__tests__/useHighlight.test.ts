import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useHighlight } from "@/hooks/useHighlight";

describe("useHighlight", () => {
  it("initial state: activeKey is null", () => {
    const { result } = renderHook(() => useHighlight());
    expect(result.current.activeKey).toBeNull();
  });

  it("initial state: isDimmed returns false for any key", () => {
    const { result } = renderHook(() => useHighlight());
    expect(result.current.isDimmed("foo")).toBe(false);
  });

  it("initial state: isActive returns false for any key", () => {
    const { result } = renderHook(() => useHighlight());
    expect(result.current.isActive("foo")).toBe(false);
  });

  it("onHover sets activeKey", () => {
    const { result } = renderHook(() => useHighlight());
    act(() => result.current.onHover("bar"));
    expect(result.current.activeKey).toBe("bar");
  });

  it("onHover(null) clears activeKey", () => {
    const { result } = renderHook(() => useHighlight());
    act(() => result.current.onHover("bar"));
    expect(result.current.activeKey).toBe("bar");
    act(() => result.current.onHover(null));
    expect(result.current.activeKey).toBeNull();
  });

  it("onClick pins a key that persists after onHover(null)", () => {
    const { result } = renderHook(() => useHighlight());
    act(() => result.current.onClick("pinned"));
    expect(result.current.activeKey).toBe("pinned");

    act(() => result.current.onHover(null));
    expect(result.current.activeKey).toBe("pinned");
  });

  it("onClick same key unpins", () => {
    const { result } = renderHook(() => useHighlight());
    act(() => result.current.onClick("pinned"));
    expect(result.current.activeKey).toBe("pinned");

    act(() => result.current.onClick("pinned"));
    expect(result.current.activeKey).toBeNull();
  });

  it("while pinned, onHover is ignored", () => {
    const { result } = renderHook(() => useHighlight());
    act(() => result.current.onClick("pinned"));

    act(() => result.current.onHover("other"));
    expect(result.current.activeKey).toBe("pinned");

    act(() => result.current.onHover(null));
    expect(result.current.activeKey).toBe("pinned");
  });

  it("isDimmed returns true for non-active keys when one is active", () => {
    const { result } = renderHook(() => useHighlight());
    act(() => result.current.onHover("active"));

    expect(result.current.isDimmed("other")).toBe(true);
    expect(result.current.isDimmed("active")).toBe(false);
  });

  it("isActive returns true only for the active key", () => {
    const { result } = renderHook(() => useHighlight());
    act(() => result.current.onHover("active"));

    expect(result.current.isActive("active")).toBe(true);
    expect(result.current.isActive("other")).toBe(false);
  });
});
