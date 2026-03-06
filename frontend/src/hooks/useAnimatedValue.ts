import { useState, useEffect, useRef } from "react";

function easeOutCubic(p: number) {
  return 1 - Math.pow(1 - p, 3);
}

/**
 * Animate a number via React state (causes re-renders each frame).
 * Use only when the animated value must flow through props.
 */
export function useAnimatedValue(target: number, duration = 300) {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number>(0);
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    const delta = target - from;
    if (delta === 0) return;

    const start = performance.now();
    cancelAnimationFrame(raf.current);

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(from + delta * easeOutCubic(p));
      if (p < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}