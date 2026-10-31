import Link from "next/link";
import { PAGES, type SinkPageDef } from "../sections";
import SinkNav from "./SinkNav";
import SinkSection from "./SinkSection";

/**
 * One kitchen-sink page: Primitives / Components switcher, sticky section nav
 * and the page's sections.
 */
export default function SinkPage({ page }: { page: SinkPageDef }) {
  const nav = page.sections.map(({ id, title }) => ({ id, title }));
  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:px-8">
      <aside className="hidden lg:block">
        <SinkNav sections={nav} />
      </aside>
      <main className="min-w-0">
        <h1 className="sr-only">Kitchen sink: {page.title}</h1>
        <nav aria-label="Kitchen sink pages" className="mb-8 flex w-fit gap-1 rounded-lg bg-surface-raised p-1">
          {PAGES.map((p) => (
            <Link
              key={p.key}
              href={p.href}
              aria-current={p.key === page.key ? "page" : undefined}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-fg-tertiary transition-colors hover:text-fg-secondary aria-[current=page]:bg-surface-active aria-[current=page]:text-fg-primary"
            >
              {p.title}
            </Link>
          ))}
        </nav>
        {page.sections.map(({ id, title, Component }) => (
          <SinkSection key={id} id={id} title={title}>
            <Component />
          </SinkSection>
        ))}
      </main>
    </div>
  );
}
