import { Card } from "@/components/ui/card";
import VariantRow from "../_components/VariantRow";

/*
 * The raw Card primitive (components/ui/card.tsx). Pages should use
 * SectionCard (Components page) rather than these directly; this row exists
 * so the underlying surfaces can be compared side by side.
 */

const VARIANTS = [
  { variant: "panel", note: "base of SectionCard" },
  { variant: "glass", note: "Amortisation, Tax" },
  { variant: "scheme", note: "grant scheme cards" },
  { variant: "auth", note: "sign in / sign up" },
  { variant: "default", note: "stock shadcn" },
] as const;

export default function CardVariantsSection() {
  return (
    <VariantRow label='Card variant="panel" / "glass" / "scheme" / "auth" / "default"'>
      {VARIANTS.map(({ variant, note }) => (
        <Card
          key={variant}
          variant={variant}
          className="flex h-[120px] w-[200px] flex-col justify-end gap-1 p-5"
          style={variant === "scheme" ? ({ "--card-accent": "var(--color-brand)" } as React.CSSProperties) : undefined}
        >
          <span className="text-[14px] font-semibold text-fg-primary">{variant}</span>
          <span className="text-[12px] text-fg-tertiary">{note}</span>
        </Card>
      ))}
    </VariantRow>
  );
}
