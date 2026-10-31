import VariantRow from "../_components/VariantRow";

/** Token groups from globals.css. Swatches read the CSS variable, so they always match the theme. */
const GROUPS: { label: string; tokens: string[] }[] = [
  { label: "Foreground", tokens: ["fg-primary", "fg-secondary", "fg-tertiary", "fg-muted", "fg-disabled"] },
  { label: "Brand", tokens: ["brand", "brand-hover", "brand-subtle", "brand-border", "brand-contrast"] },
  { label: "Data", tokens: ["data-positive", "data-negative", "data-warning", "data-neutral", "data-primary", "data-muted"] },
  { label: "Status", tokens: ["status-success", "status-error", "status-warning", "status-info"] },
  { label: "Surfaces", tokens: ["surface-app", "surface-page", "card", "surface-raised", "surface-subtle", "surface-hover", "surface-active", "surface-kpi"] },
  { label: "Borders", tokens: ["border-subtle", "border-default", "border-strong", "border-brand"] },
];

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex w-[132px] flex-col gap-1.5">
      <div className="h-10 rounded-lg ring-1 ring-border-subtle" style={{ background: `var(--color-${token})` }} />
      <code className="font-sans text-[11px] break-all text-fg-tertiary">--color-{token}</code>
    </div>
  );
}

export default function ColorsSection() {
  return (
    <>
      {GROUPS.map((g) => (
        <VariantRow key={g.label} label={g.label}>
          {g.tokens.map((t) => (
            <Swatch key={t} token={t} />
          ))}
        </VariantRow>
      ))}
    </>
  );
}
