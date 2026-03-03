import { useState, useEffect } from "react";

/**
 * Measure the remaining viewport height below a ref element,
 * minus padding. Recalculates on window resize and whenever
 * the element's position changes in the layout.
 */
export function useFillHeight(
  ref: React.RefObject<HTMLDivElement | null>,
  padding = 105,
  min = 300,
  layoutKey?: unknown,
) {
  const [height, setHeight] = useState(min);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const top = el.getBoundingClientRect().top;
      setHeight(Math.max(window.innerHeight - top - padding, min));
    };

    update();
    window.addEventListener("resize", update);

    // Also observe the element's size/position changes
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);

    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [ref, padding, min, layoutKey]);

  return height;
}
