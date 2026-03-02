import { useState, useEffect } from "react";

/**
 * Measure the remaining viewport height below a ref element,
 * minus padding. Useful for filling a chart or scrollable
 * area to the bottom of the screen.
 */
export function useFillHeight(
  ref: React.RefObject<HTMLDivElement | null>,
  padding = 105,
  min = 300,
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
    return () => window.removeEventListener("resize", update);
  }, [ref, padding, min]);

  return height;
}
