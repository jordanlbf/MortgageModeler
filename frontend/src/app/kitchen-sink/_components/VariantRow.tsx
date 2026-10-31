/**
 * Label on the left, the variants on the right. Stacks on narrow screens.
 * `label` names what the row shows (e.g. `variant="cta"`), so it doubles as
 * the code to copy.
 */
export default function VariantRow({ label, children, wrap = true }: { label: string; children: React.ReactNode; wrap?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[200px_minmax(0,1fr)] md:gap-6">
      <div className="pt-1 font-sans text-[12px] break-words text-fg-tertiary tabular-nums">{label}</div>
      <div className={`flex min-w-0 items-center gap-3 ${wrap ? "flex-wrap" : ""}`}>{children}</div>
    </div>
  );
}
