"use client";

import { useState, useEffect, useCallback } from "react";
import type { RefObject } from "react";

interface UseFocusModeOpts {
  cardRef: RefObject<HTMLDivElement | null>;
  controlsRef: RefObject<HTMLDivElement | null>;
  normalHeight: number;
}

export function useFocusMode({ cardRef, controlsRef, normalHeight }: UseFocusModeOpts) {
  const [focused, setFocused] = useState(false);
  const [focusedChartHeight, setFocusedChartHeight] = useState(0);

  const handleFocusToggle = useCallback(() => {
    if (!focused) {
      const delta = controlsRef.current?.offsetHeight ?? 0;
      setFocusedChartHeight(normalHeight + delta);
    }
    setFocused((f) => !f);
  }, [focused, normalHeight, controlsRef]);

  // Escape + click-outside to exit focus
  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleFocusToggle();
    };
    const onClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) handleFocusToggle();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [focused, handleFocusToggle, cardRef]);

  const chartHeight = focused ? focusedChartHeight : normalHeight;

  return { focused, chartHeight, handleFocusToggle };
}
