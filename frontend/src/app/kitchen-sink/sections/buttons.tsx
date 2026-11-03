import { ArrowLeft, ChevronRight, Loader2, Plus, Settings, SlidersHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import VariantRow from "../_components/VariantRow";

const STOCK = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;
const SIZES = ["xs", "sm", "default", "lg"] as const;

/** Custom variants carry no size classes; the padding here stands in for a call site's layout. */
const CUSTOM_TEXT = [
  "cta", "soft", "outline-action", "outline-subtle", "ghost-muted", "ghost-brand", "chip", "link-muted", "link-subtle", "link-quiet",
] as const;

/** Full-width variants, shown in a column as wide as a typical card. */
const CUSTOM_BLOCK = ["cta-glow", "outline-filled", "outline-block"] as const;

const CUSTOM_ICON = ["ghost-icon", "outline-icon", "icon-filled", "icon-brand", "icon-quiet", "icon-subtle"] as const;

export default function ButtonsSection() {
  return (
    <>
      {STOCK.map((v) => (
        <VariantRow key={v} label={`variant="${v}" × xs/sm/default/lg`}>
          {SIZES.map((s) => (
            <Button key={s} variant={v} size={s}>
              {v === "destructive" ? "Delete property" : "Save scenario"}
            </Button>
          ))}
        </VariantRow>
      ))}
      <VariantRow label="disabled">
        {STOCK.map((v) => (
          <Button key={v} variant={v} disabled>
            {v}
          </Button>
        ))}
      </VariantRow>
      <VariantRow label="loading (disabled + spinner)">
        <Button disabled>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Calculating
        </Button>
        <Button variant="outline" disabled>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Saving
        </Button>
      </VariantRow>
      <VariantRow label="with icon (data-icon)">
        <Button>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add property
        </Button>
        <Button variant="outline">
          Next step
          <ChevronRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </VariantRow>
      <VariantRow label="icon / icon-xs / icon-sm / icon-lg">
        {(["icon-xs", "icon-sm", "icon", "icon-lg"] as const).map((s) => (
          <Button key={s} variant="outline" size={s} aria-label="Settings">
            <Settings aria-hidden="true" />
          </Button>
        ))}
        <Button variant="destructive" size="icon" aria-label="Delete property">
          <Trash2 aria-hidden="true" />
        </Button>
      </VariantRow>
      {CUSTOM_TEXT.map((v) => (
        <VariantRow key={v} label={`variant="${v}"`}>
          <Button variant={v} className="px-3 py-1.5 text-[13px]">
            Compare scenarios
          </Button>
          <Button variant={v} className="px-3 py-1.5 text-[13px]" disabled>
            Disabled
          </Button>
        </VariantRow>
      ))}
      {CUSTOM_BLOCK.map((v) => (
        <VariantRow key={v} label={`variant="${v}" (full width)`}>
          <div className="flex w-full max-w-[320px] flex-col gap-2">
            <Button variant={v} className="px-3 py-2.5 text-[13px]">Compare scenarios</Button>
            <Button variant={v} className="px-3 py-2.5 text-[13px]" disabled>Disabled</Button>
          </div>
        </VariantRow>
      ))}
      <VariantRow label="icon variants (ghost-icon … icon-subtle)">
        {CUSTOM_ICON.map((v) => (
          <Button key={v} variant={v} className="size-8" aria-label={`Filters (${v})`} title={v}>
            <SlidersHorizontal className="size-4" aria-hidden="true" />
          </Button>
        ))}
        <Button
          variant="tinted-icon"
          className="size-8"
          aria-label="Filters (tinted-icon)"
          title="tinted-icon"
          style={{ "--tint-accent": "var(--color-data-warning)" } as React.CSSProperties}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </VariantRow>
      <VariantRow label='variant="link-back"'>
        <Button variant="link-back">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to properties
        </Button>
      </VariantRow>
    </>
  );
}
