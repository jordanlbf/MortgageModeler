import { Badge } from "@/components/ui/badge";
import VariantRow from "../_components/VariantRow";

const STOCK = ["default", "secondary", "destructive", "outline", "ghost"] as const;

const accent = (c: string) => ({ "--badge-accent": c }) as React.CSSProperties;

/** Property / loan tags built on `soft`, one accent each. */
const PROPERTY_TAGS = [
  ["Owner-occupied", "var(--color-brand)"],
  ["Investment", "var(--color-series-equity)"],
  ["Interest-only", "var(--color-data-warning)"],
  ["Overdue", "var(--color-data-negative)"],
  ["Draft", "var(--color-fg-tertiary)"],
] as const;

export default function BadgesSection() {
  return (
    <>
      <VariantRow label="stock: default / secondary / destructive / outline / ghost">
        {STOCK.map((v) => <Badge key={v} variant={v}>{v}</Badge>)}
      </VariantRow>
      <VariantRow label='variant="soft" · semantic (--badge-accent)'>
        <Badge variant="soft">Neutral</Badge>
        <Badge variant="soft" style={accent("var(--color-data-positive)")}>80.0%</Badge>
        <Badge variant="soft" style={accent("var(--color-data-warning)")}>87.7%</Badge>
        <Badge variant="soft" style={accent("var(--color-data-negative)")}>127.3%</Badge>
        <Badge variant="soft" style={accent("var(--color-status-info)")}>Info</Badge>
      </VariantRow>
      <VariantRow label='property tags (variant="soft")'>
        {PROPERTY_TAGS.map(([name, c]) => <Badge key={name} variant="soft" style={accent(c)}>{name}</Badge>)}
      </VariantRow>
      <VariantRow label='variant="count" / "tag"'>
        <Badge variant="count">12</Badge>
        <Badge variant="count">3</Badge>
        <Badge variant="tag">Coming soon</Badge>
      </VariantRow>
      <VariantRow label='variant="tinted" (--badge-accent)'>
        <Badge variant="tinted" style={accent("var(--color-data-positive)")}>Eligible</Badge>
        <Badge variant="tinted" style={accent("var(--color-data-negative)")}>Not eligible</Badge>
      </VariantRow>
      <VariantRow label='variant="stat" (--badge-accent)'>
        <Badge variant="stat" style={accent("var(--color-data-warning)")}>
          <span data-slot="badge-label" className="text-[10px] tracking-widest uppercase">Effective</span>
          <span className="text-[15px] font-semibold tabular-nums">24.6%</span>
        </Badge>
        <Badge variant="stat" style={accent("var(--color-data-negative)")}>
          <span data-slot="badge-label" className="text-[10px] tracking-widest uppercase">Marginal</span>
          <span className="text-[15px] font-semibold tabular-nums">37%</span>
        </Badge>
      </VariantRow>
    </>
  );
}
