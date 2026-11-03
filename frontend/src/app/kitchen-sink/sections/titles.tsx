import { Label } from "@/components/ui/label";
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
    </>
  );
}
