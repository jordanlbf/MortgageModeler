"use client";

import { useEffect, useState } from "react";
import { formatDollars } from "@/lib/formatters";

/**
 * Phones and tablets only: a "Cash needed" bar pinned to the top of the
 * results once the hero card has scrolled up out of view.
 * Render it as the first child of the results column; it takes no space.
 */
export default function MobileSummaryBar({ target, total }: { target: React.RefObject<HTMLElement | null>; total: number | null }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <div className="sticky top-0 z-20 h-0 lg:hidden">
      <div
        className={`flex items-center justify-between rounded-xl border border-border-subtle bg-surface-raised/95 px-4 py-3 shadow-raised backdrop-blur-md transition-[opacity,translate] duration-200 ${
          show ? "translate-y-2 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
        aria-hidden={!show}
      >
        <span className="text-[13px] text-fg-secondary">Cash needed</span>
        <span className="text-[17px] font-semibold tabular-nums text-brand">{total === null ? "—" : formatDollars(total) || "$0"}</span>
      </div>
    </div>
  );
}
