"use client";

import { useEffect, useState } from "react";

/**
 * Sticky section nav (desktop only). Scroll-spy via IntersectionObserver: the
 * active section is the top-most one crossing the upper part of the viewport.
 */
export default function SinkNav({ sections }: { sections: { id: string; title: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const first = sections.find((s) => visible.has(s.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "0px 0px -60% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Kitchen sink sections" className="sticky top-6 hidden max-h-[calc(100dvh-3rem)] overflow-y-auto lg:block">
      <ul className="flex flex-col gap-0.5">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "location" : undefined}
              className="block rounded-md px-3 py-1.5 text-[13px] text-fg-tertiary transition-colors hover:bg-surface-hover hover:text-fg-secondary aria-[current=location]:bg-surface-hover aria-[current=location]:text-brand"
            >
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
