import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useApiCall } from "@/hooks/useApiCall";

describe("useApiCall", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns { data: null, error: null, loading: true } initially when enabled", () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 1 });
    const { result } = renderHook(() => useApiCall(fetcher, [1]));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it("calls fetcher after debounce and sets data on success", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 42 });
    const { result } = renderHook(() => useApiCall(fetcher, [1]));

    // Fetcher not called yet (debounce pending)
    expect(fetcher).not.toHaveBeenCalled();

    // Advance past default debounce (80ms)
    await act(async () => {
      vi.advanceTimersByTime(80);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(result.current.data).toEqual({ value: 42 });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error on fetch failure (non-abort)", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Server error"));
    const { result } = renderHook(() => useApiCall(fetcher, [1]));

    await act(async () => {
      vi.advanceTimersByTime(80);
    });

    expect(result.current.error).toBe("Server error");
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("does not set error on AbortError", async () => {
    // The hook checks controller.signal.aborted in the catch block.
    // When a dep changes, the previous controller is aborted before the new
    // fetch starts, so any rejection from the old fetch is silently ignored.
    let resolvers: Array<{
      resolve: (v: unknown) => void;
      reject: (e: Error) => void;
      signal: AbortSignal;
    }> = [];

    const fetcher = vi.fn().mockImplementation((signal: AbortSignal) => {
      return new Promise((resolve, reject) => {
        resolvers.push({ resolve, reject, signal });
      });
    });

    const { result, rerender } = renderHook(
      ({ dep }) => useApiCall(fetcher, [dep], { debounce: 10 }),
      { initialProps: { dep: 1 } },
    );

    // Fire the first fetch
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);

    // Re-render with new dep -- this aborts the first controller
    rerender({ dep: 2 });

    // Now reject the first (aborted) fetch -- hook should ignore it
    await act(async () => {
      resolvers[0].reject(new Error("aborted"));
    });

    // Fire the second fetch
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Resolve the second fetch successfully
    await act(async () => {
      resolvers[1].resolve({ value: 2 });
    });

    // Error should be null (aborted rejection was ignored)
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({ value: 2 });
  });

  it("enabled: false skips fetch, data is null", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 1 });
    const { result } = renderHook(() =>
      useApiCall(fetcher, [1], { enabled: false }),
    );

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("re-render with new deps aborts previous fetch", async () => {
    let callCount = 0;
    const fetcher = vi.fn().mockImplementation((signal: AbortSignal) => {
      callCount++;
      const current = callCount;
      return new Promise((resolve) => {
        // Simulate async delay — resolve only if not aborted
        setTimeout(() => {
          if (!signal.aborted) resolve({ call: current });
        }, 50);
      });
    });

    const { result, rerender } = renderHook(
      ({ dep }) => useApiCall(fetcher, [dep], { debounce: 10 }),
      { initialProps: { dep: 1 } },
    );

    // Advance past debounce to trigger first fetch
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Re-render with new dep before first fetch resolves
    rerender({ dep: 2 });

    // Advance past debounce for second fetch
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Advance past the simulated async delay
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    // Only the second fetch's result should be set
    expect(result.current.data).toEqual({ call: 2 });
  });

  it("cleanup on unmount aborts pending fetch", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 1 });
    const { unmount } = renderHook(() => useApiCall(fetcher, [1]));

    // Unmount before debounce fires
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Fetcher should not have been called (timer was cleared)
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("custom debounce timing is respected", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 1 });
    renderHook(() => useApiCall(fetcher, [1], { debounce: 300 }));

    // Not called at default 80ms
    await act(async () => {
      vi.advanceTimersByTime(80);
    });
    expect(fetcher).not.toHaveBeenCalled();

    // Not called at 200ms
    await act(async () => {
      vi.advanceTimersByTime(120);
    });
    expect(fetcher).not.toHaveBeenCalled();

    // Called at 300ms
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
