import { Badge } from "@/components/ui/badge";
import KeyValueList, { KeyValueRow } from "@/components/patterns/blocks/KeyValueList";
import { formatDollars } from "@/lib/formatters";
import VariantRow from "../_components/VariantRow";
import Specimen from "../_components/Specimen";
import { LINES, LINES_TOTAL } from "./dummy";

export default function ListsSection() {
  return (
    <>
      <VariantRow label='KeyValueList · size="sm" with total'>
        <Specimen className="w-full max-w-[280px]">
          <KeyValueList>
            {LINES.map((l) => <KeyValueRow key={l.label} label={l.label} value={formatDollars(l.value)} />)}
            <KeyValueRow label="Total" value={formatDollars(LINES_TOTAL)} total />
          </KeyValueList>
        </Specimen>
      </VariantRow>
      <VariantRow label='KeyValueList divided · size="md" · tones · badge value'>
        <Specimen className="w-full max-w-[280px]">
          <KeyValueList divided>
            <KeyValueRow size="md" label="Metric" value={formatDollars(480_000)} />
            <KeyValueRow
              size="md"
              label="Ratio"
              value={<Badge variant="soft" className="px-2 py-1 text-[12.5px] font-semibold" style={{ "--badge-accent": "var(--color-data-warning)" } as React.CSSProperties}>82.5%</Badge>}
            />
            <KeyValueRow size="md" label="Good" value="None" tone="positive" />
            <KeyValueRow size="md" label="Bad" value={`−${formatDollars(900)}`} tone="negative" />
            <KeyValueRow size="md" label="Empty" value="—" tone="muted" />
          </KeyValueList>
        </Specimen>
      </VariantRow>
      <VariantRow label="grouped lists (sections with dividers)">
        <Specimen className="flex w-full max-w-[280px] flex-col gap-4">
          {[0, 1].map((g) => (
            <KeyValueList key={g} className="border-b border-border-subtle pb-4 last:border-b-0 last:pb-0">
              {LINES.slice(0, 2).map((l) => <KeyValueRow key={l.label} label={l.label} value={formatDollars(l.value)} />)}
              <KeyValueRow label={`Group ${g + 1} total`} value={formatDollars(LINES[0].value + LINES[1].value)} total />
            </KeyValueList>
          ))}
        </Specimen>
      </VariantRow>
    </>
  );
}
