"use client";

import { useState, useEffect, useRef } from "react";

interface UseApiCallOptions {
  /** Debounce delay in ms before firing the request. Default: 80. */
  debounce?: number;
  /** When false, the fetch is skipped and data is cleared. Default: true. */
  enabled?: boolean;
}

interface UseApiCallResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Shared hook for debounced API calls with AbortController cleanup.
 *
 * @param fetcher — async function that receives an AbortSignal and returns data.
 *   Called on every dependency change (after debounce). Return `null` to skip.
 * @param deps — dependency array that triggers a new fetch when changed.
 * @param options — debounce timing and enabled flag.
 */
export function useApiCall<T>(
  fetcher: (signal: AbortSignal) => Promise<T | null>,
  deps: React.DependencyList,
  options: UseApiCallOptions = {},
): UseApiCallResult<T> {
  const { debounce = 80, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Clean up previous
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setError(null);

      try {
        const result = await fetcher(controller.signal);
        if (!controller.signal.aborted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Request failed");
        setLoading(false);
      }
    }, debounce);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}
