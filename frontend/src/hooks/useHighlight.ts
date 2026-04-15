import { useState, useCallback } from "react";

/**
 * Shared hover/pin/dim logic for interactive visualisations.
 *
 * - Hover sets the active key (cleared on mouse leave).
 * - Click pins a key (click again to unpin).
 * - While a key is pinned, hover is ignored.
 */
export function useHighlight() {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const activeKey = pinnedKey ?? hoveredKey;

  const onHover = useCallback(
    (key: string | null) => {
      setPinnedKey((p) => { if (p == null) setHoveredKey(key); return p; });
    },
    [],
  );

  const onClick = useCallback((key: string) => {
    setPinnedKey((prev) => (prev === key ? null : key));
  }, []);

  const isActive = useCallback((key: string) => activeKey === key, [activeKey]);
  const isDimmed = useCallback((key: string) => activeKey != null && activeKey !== key, [activeKey]);

  return { activeKey, onHover, onClick, isActive, isDimmed };
}
