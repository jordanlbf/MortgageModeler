import Stat, { StatDelta } from "@/components/patterns/blocks/Stat";
import { formatDollars } from "@/lib/formatters";
import VariantRow from "../_components/VariantRow";
import Specimen from "../_components/Specimen";
import { MenuButton } from "./dummy";

/** The number block on its own. In a card it becomes a StatCard (Cards page). */
export default function NumbersSection() {
  return (
    <>
      <VariantRow label='Stat size="sm" / "md" / "lg" / "hero"'>
        <Specimen className="flex flex-wrap items-end gap-10">
          <Stat label="Small" size="sm" value={formatDollars(1_250)} />
          <Stat label="Medium" size="md" value={formatDollars(12_500)} />
          <Stat label="Large" size="lg" value={formatDollars(125_000)} />
          <Stat label="Hero" size="hero" value={formatDollars(1_250_000)} />
        </Specimen>
      </VariantRow>
      <VariantRow label='Stat tone="default" / "positive" / "negative" / "muted"'>
        <Specimen className="flex flex-wrap items-end gap-10">
          <Stat label="Default" value={formatDollars(64_000)} />
          <Stat label="Positive" tone="positive" value={formatDollars(8_400)} />
          <Stat label="Negative" tone="negative" value={`−${formatDollars(2_150)}`} />
          <Stat label="Muted" tone="muted" value="—" />
        </Specimen>
      </VariantRow>
      <VariantRow label="StatDelta up / down / down-is-good · Stat with delta, action, children">
        <Specimen className="flex flex-wrap items-center gap-6">
          <StatDelta direction="up">4.2%</StatDelta>
          <StatDelta direction="down">1.8%</StatDelta>
          <StatDelta direction="down" tone="positive">$12k</StatDelta>
        </Specimen>
        <Specimen className="w-[240px]">
          <Stat label="Everything" value={formatDollars(42_000)} delta={<StatDelta direction="up">3.2%</StatDelta>} action={<MenuButton />}>
            <span className="text-[12px] text-fg-tertiary">Supporting line</span>
          </Stat>
        </Specimen>
      </VariantRow>
    </>
  );
}
