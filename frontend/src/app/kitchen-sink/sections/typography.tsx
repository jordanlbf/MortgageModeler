import { Label } from "@/components/ui/label";
import VariantRow from "../_components/VariantRow";

/** The type scale in use across the app. Sora everywhere; numbers use tabular-nums. */
const SCALE = [
  { label: "h1 · 30/33 · 600", className: "text-[30px] leading-[1.1] font-semibold tracking-[-0.02em]", sample: "Purchase Costs" },
  { label: "h2 card title · 20/25 · 600", className: "text-[20px] leading-tight font-semibold tracking-[-0.01em]", sample: "Your Purchase" },
  { label: "h3 · 15/20 · 600", className: "text-[15px] leading-5 font-semibold", sample: "Where your cash goes" },
  { label: "hero number · 44/44 · 600", className: "text-[44px] leading-none font-semibold tracking-[-0.03em] tabular-nums", sample: "$1,234,567" },
  { label: "input value · 28 · 600", className: "text-[28px] font-semibold tracking-[-0.02em] tabular-nums", sample: "$650,000" },
  { label: "body · 14/20 · 400", className: "text-[14px] leading-5", sample: "Stamp duty is calculated on the dutiable value of 42 Smith Street." },
  { label: "small · 13/18 · 400", className: "text-[13px] leading-[18px] text-fg-secondary", sample: "Includes the first home concession for QLD." },
  { label: "caption · 12 · 400", className: "text-[12px] text-fg-tertiary", sample: "Updated yesterday" },
  { label: "numeric · 14 · 600 tabular", className: "text-[14px] font-semibold tabular-nums", sample: "$1,247  −$47,382  4.2%  127.3%" },
];

export default function TypographySection() {
  return (
    <>
      {SCALE.map((s) => (
        <VariantRow key={s.label} label={s.label}>
          <span className={`min-w-0 break-words ${s.className}`}>{s.sample}</span>
        </VariantRow>
      ))}
      <VariantRow label='Label variant="caps"'>
        <Label variant="caps">Purchase price</Label>
      </VariantRow>
      <VariantRow label='Label variant="field" / "form"'>
        <Label variant="field">Interest rate</Label>
        <Label variant="form">Email address</Label>
      </VariantRow>
    </>
  );
}
