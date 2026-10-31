import SinkNav from "./components/SinkNav";
import SinkSection from "./components/SinkSection";
import { SECTIONS } from "./sections";

/**
 * Internal component gallery: every design-system primitive and its variants
 * on one page. Dense and label-first on purpose. Gated in production by
 * src/proxy.ts; see docs/KITCHEN_SINK.md.
 */
export default function KitchenSinkPage() {
  const nav = SECTIONS.map(({ id, title }) => ({ id, title }));
  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:px-8">
      <aside className="hidden lg:block">
        <SinkNav sections={nav} />
      </aside>
      <main className="min-w-0">
        <h1 className="sr-only">Kitchen sink</h1>
        {SECTIONS.map(({ id, title, Component }) => (
          <SinkSection key={id} id={id} title={title}>
            <Component />
          </SinkSection>
        ))}
      </main>
    </div>
  );
}
