import { Badge } from "@/components/ui/badge";
import KeyValueList, { KeyValueRow } from "@/components/patterns/blocks/KeyValueList";
import Stat from "@/components/patterns/blocks/Stat";
import SectionCard from "@/components/patterns/cards/SectionCard";
import CalculatorLayout from "@/components/patterns/layouts/CalculatorLayout";
import { formatDollars } from "@/lib/formatters";
import { LINES, LINES_TOTAL, Placeholder } from "./dummy";

/** CalculatorLayout with dummy cards: the shape of Purchase Costs. */
export default function CalculatorSection() {
  return (
    <CalculatorLayout
      aria-label="Calculator layout example"
      inputs={
        <SectionCard flush titleAs="h3" title="Inputs" className="h-full">
          {["Input one", "Input two", "Input three"].map((s) => (
            <div key={s} className="border-t border-border-subtle px-6 py-5">
              <Placeholder h={56} label={s} />
            </div>
          ))}
        </SectionCard>
      }
    >
      <SectionCard titleAs="h3" title="Summary" action={<Badge variant="tag">Status</Badge>}>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-[minmax(0,1fr)_200px]">
          <Stat label="Headline number" size="hero" value={formatDollars(LINES_TOTAL)}>
            <span className="text-[13px] text-fg-tertiary">A supporting line of context</span>
          </Stat>
          <KeyValueList divided>
            <KeyValueRow size="md" label="Metric A" value={formatDollars(42_000)} />
            <KeyValueRow size="md" label="Metric B" value="18.5%" />
            <KeyValueRow size="md" label="Metric C" value="None" tone="positive" />
          </KeyValueList>
        </div>
      </SectionCard>
      <SectionCard titleAs="h3" title="Breakdown" className="flex-1">
        <KeyValueList>
          {LINES.map((l) => <KeyValueRow key={l.label} label={l.label} value={formatDollars(l.value)} />)}
          <KeyValueRow label="Total" value={formatDollars(LINES_TOTAL)} total />
        </KeyValueList>
      </SectionCard>
    </CalculatorLayout>
  );
}
