import { Inbox, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/patterns/EmptyState";
import InlineAlert from "@/components/patterns/InlineAlert";
import KeyValueList, { KeyValueRow } from "@/components/patterns/KeyValueList";
import SectionCard, { SectionTitle } from "@/components/patterns/SectionCard";
import Stat, { StatDelta } from "@/components/patterns/Stat";
import { formatDollars } from "@/lib/formatters";
import VariantRow from "../components/VariantRow";

/*
 * Dummy content on purpose: these cards exist to tune the shared patterns in
 * components/patterns. Pages use the same components, so a change there shows
 * up here and across the app together.
 */

const LINES = [
  { label: "Line item one", value: 48_250 },
  { label: "Line item two", value: 12_400 },
  { label: "Line item three", value: 3_180 },
];
const LINES_TOTAL = LINES.reduce((sum, l) => sum + l.value, 0);

function MenuButton() {
  return (
    <Button variant="ghost-icon" className="rounded p-1" aria-label="Card options">
      <MoreHorizontal className="size-4 text-fg-tertiary" aria-hidden="true" />
    </Button>
  );
}

function Placeholder({ h = 120 }: { h?: number }) {
  return <div className="w-full rounded-lg border border-dashed border-border-subtle" style={{ height: h }} aria-hidden="true" />;
}

export default function PatternsSection() {
  return (
    <>
      <VariantRow label="SectionCard · patterns/SectionCard.tsx">
        <SectionCard titleAs="h3" title="Card title" className="w-full max-w-[320px]">
          <Placeholder />
        </SectionCard>
        <SectionCard titleAs="h3" title="With an action" action={<MenuButton />} className="w-full max-w-[320px]">
          <Placeholder />
        </SectionCard>
        <SectionCard flush titleAs="h3" title="Flush body" className="w-full max-w-[320px]">
          <div className="border-t border-border-subtle px-6 py-5"><Placeholder h={44} /></div>
          <div className="border-t border-border-subtle px-6 py-5"><Placeholder h={44} /></div>
        </SectionCard>
      </VariantRow>

      <VariantRow label='SectionTitle variant="default" / "brand"'>
        <SectionCard titleAs="h3" title="Default title" className="w-full max-w-[320px]" />
        <SectionCard className="w-full max-w-[320px]">
          <SectionTitle as="h3" variant="brand">Brand title</SectionTitle>
        </SectionCard>
      </VariantRow>

      <VariantRow label='Stat size="sm" / "md" / "lg" / "hero" · patterns/Stat.tsx'>
        <div className="flex flex-wrap items-end gap-10">
          <Stat label="Small" size="sm" value={formatDollars(1_250)} />
          <Stat label="Medium" size="md" value={formatDollars(12_500)} />
          <Stat label="Large" size="lg" value={formatDollars(125_000)} />
          <Stat label="Hero" size="hero" value={formatDollars(1_250_000)} />
        </div>
      </VariantRow>

      <VariantRow label="Stat tone · delta · action · children">
        <SectionCard className="w-[240px] px-5 py-4">
          <Stat label="Positive" tone="positive" value={formatDollars(8_400)} delta={<StatDelta direction="up">4.2%</StatDelta>} />
        </SectionCard>
        <SectionCard className="w-[240px] px-5 py-4">
          <Stat label="Negative" tone="negative" value={`−${formatDollars(2_150)}`} delta={<StatDelta direction="down">1.8%</StatDelta>} />
        </SectionCard>
        <SectionCard className="w-[240px] px-5 py-4">
          <Stat label="With action" value={formatDollars(64_000)} action={<MenuButton />}>
            <span className="text-[12px] text-fg-tertiary">Supporting line</span>
          </Stat>
        </SectionCard>
        <SectionCard className="w-[240px] px-5 py-4">
          <Stat label="Muted" tone="muted" value="—">
            <span className="text-[12px] text-fg-tertiary">No value yet</span>
          </Stat>
        </SectionCard>
      </VariantRow>

      <VariantRow label='KeyValueList · size="sm" / "md" · divided · total · patterns/KeyValueList.tsx'>
        <SectionCard className="w-full max-w-[280px]">
          <KeyValueList>
            {LINES.map((l) => <KeyValueRow key={l.label} label={l.label} value={formatDollars(l.value)} />)}
            <KeyValueRow label="Total" value={formatDollars(LINES_TOTAL)} total />
          </KeyValueList>
        </SectionCard>
        <SectionCard className="w-full max-w-[280px]">
          <KeyValueList divided>
            <KeyValueRow size="md" label="Metric" value={formatDollars(480_000)} />
            <KeyValueRow
              size="md"
              label="Ratio"
              value={<Badge variant="soft" className="px-2 py-1 text-[12.5px] font-semibold" style={{ "--badge-accent": "var(--color-data-warning)" } as React.CSSProperties}>82.5%</Badge>}
            />
            <KeyValueRow size="md" label="Good" value="None" tone="positive" />
            <KeyValueRow size="md" label="Bad" value={`−${formatDollars(900)}`} tone="negative" />
          </KeyValueList>
        </SectionCard>
      </VariantRow>

      <VariantRow label='InlineAlert tone="error" / "warning" / "success" / "info"'>
        <div className="flex w-full max-w-[560px] flex-col gap-2">
          <InlineAlert tone="error">Something went wrong. This is an error message.</InlineAlert>
          <InlineAlert tone="warning">Heads up. This is a warning message.</InlineAlert>
          <InlineAlert tone="success">All done. This is a success message.</InlineAlert>
          <InlineAlert tone="info">For your information. This is an info message.</InlineAlert>
        </div>
      </VariantRow>

      <VariantRow label="EmptyState · patterns/EmptyState.tsx">
        <EmptyState
          className="w-full max-w-[300px]"
          icon={<Inbox className="size-5" aria-hidden="true" />}
          title="Nothing here yet"
          body="A short reason, one line if possible."
          action={<Button size="sm">Primary action</Button>}
        />
      </VariantRow>

      <VariantRow label="Composed page (dummy)">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <SectionCard flush titleAs="h3" title="Inputs">
            <div className="border-t border-border-subtle px-6 py-5"><Placeholder h={56} /></div>
            <div className="border-t border-border-subtle px-6 py-5"><Placeholder h={56} /></div>
            <div className="border-t border-border-subtle px-6 py-5"><Placeholder h={56} /></div>
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
                <SectionCard key={label} className="px-5 py-4">
                  <Stat label={label} value={formatDollars((i + 1) * 12_345)} delta={<StatDelta direction={i === 1 ? "down" : "up"}>{i + 2}.1%</StatDelta>} />
                </SectionCard>
              ))}
            </div>
            <SectionCard titleAs="h3" title="Breakdown">
              <KeyValueList>
                {LINES.map((l) => <KeyValueRow key={l.label} label={l.label} value={formatDollars(l.value)} />)}
                <KeyValueRow label="Total" value={formatDollars(LINES_TOTAL)} total />
              </KeyValueList>
            </SectionCard>
          </div>
        </div>
      </VariantRow>
    </>
  );
}
