/** A kitchen-sink section: anchor id, header and consistent vertical rhythm. */
export default function SinkSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 border-t border-border-subtle py-8 first:border-t-0 first:pt-0">
      <h2 id={`${id}-title`} className="mb-5 text-[13px] font-semibold tracking-widest text-fg-tertiary uppercase">
        {title}
      </h2>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}
