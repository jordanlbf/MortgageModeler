import { Badge } from "@/components/ui/badge";
import KeyValueList, { KeyValueRow } from "@/components/patterns/KeyValueList";
import SectionCard from "@/components/patterns/SectionCard";
import Stat, { StatDelta } from "@/components/patterns/Stat";
import { formatDollars } from "@/lib/formatters";
import { LINES, LINES_TOTAL, MenuButton, Placeholder } from "./dummy";

/** A whole dummy page built only from the patterns: the quickest way to judge a change in context. */
export default function ExamplePageSection() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <SectionCard flush titleAs="h3" title="Inputs">
        {["Input one", "Input two", "Input three"].map((s) => (
          <div key={s} className="border-t border-border-subtle px-6 py-5">
            <Placeholder h={56} label={s} />
          </div>
        ))}
      </SectionCard>
      <div className="flex min-w-0 flex-col gap-6">
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {["Metric one", "Metric two", "Metric three"].map((label, i) => (
            <SectionCard key={label} size="sm">
              <Stat label={label} value={formatDollars((i + 1) * 12_345)} delta={<StatDelta direction={i === 1 ? "down" : "up"}>{i + 2}.1%</StatDelta>} />
            </SectionCard>
          ))}
        </div>
        <SectionCard titleAs="h3" title="Trend" description="Dummy chart area" action={<MenuButton />}>
          <Placeholder h={160} label="Chart" />
        </SectionCard>
        <SectionCard titleAs="h3" title="Breakdown">
          <KeyValueList>
            {LINES.map((l) => <KeyValueRow key={l.label} label={l.label} value={formatDollars(l.value)} />)}
            <KeyValueRow label="Total" value={formatDollars(LINES_TOTAL)} total />
          </KeyValueList>
        </SectionCard>
      </div>
    </div>
  );
}
