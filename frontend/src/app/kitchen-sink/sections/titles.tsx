import { Label } from "@/components/ui/label";
import InfoTip from "@/components/patterns/blocks/InfoTip";
import SectionTitle from "@/components/patterns/blocks/SectionTitle";
import VariantRow from "../_components/VariantRow";
import Specimen from "../_components/Specimen";

export default function TitlesSection() {
  return (
    <>
      <VariantRow label='SectionTitle variant="default" / "brand"'>
        <Specimen><SectionTitle as="h3">Default title</SectionTitle></Specimen>
        <Specimen><SectionTitle as="h3" variant="brand">Brand title</SectionTitle></Specimen>
      </VariantRow>
      <VariantRow label='caption · Label variant="caps" (Stat captions, field labels)'>
        <Specimen>
          <Label variant="caps" asChild><span>Caption text</span></Label>
        </Specimen>
      </VariantRow>
      <VariantRow label="InfoTip (help on hover, focus or tap, in place of helper text)">
        <Specimen>
          <span className="flex items-center gap-1 text-[13.5px] text-fg-secondary">
            Field label
            <InfoTip label="Field label">A short line of help about this field.</InfoTip>
          </span>
        </Specimen>
      </VariantRow>
    </>
  );
}
