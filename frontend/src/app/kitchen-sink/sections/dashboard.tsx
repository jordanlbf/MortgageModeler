import KeyValueList, { KeyValueRow } from "@/components/patterns/blocks/KeyValueList";
import { StatDelta } from "@/components/patterns/blocks/Stat";
import SectionCard from "@/components/patterns/cards/SectionCard";
import StatCard from "@/components/patterns/cards/StatCard";
import DashboardLayout from "@/components/patterns/layouts/DashboardLayout";
import { formatDollars } from "@/lib/formatters";
import { LINES, LINES_TOTAL, MenuButton, Placeholder } from "./dummy";

/** DashboardLayout with dummy cards: KPI strip, chart and table, side summary. */
export default function DashboardSection() {
  return (
    <DashboardLayout
      kpis={["Metric one", "Metric two", "Metric three"].map((label, i) => (
        <StatCard key={label} label={label} value={formatDollars((i + 1) * 12_345)} delta={<StatDelta direction={i === 1 ? "down" : "up"}>{i + 2}.1%</StatDelta>} />
      ))}
      side={
        <SectionCard titleAs="h3" title="Side summary" className="h-full">
          <KeyValueList>
            {LINES.map((l) => <KeyValueRow key={l.label} label={l.label} value={formatDollars(l.value)} />)}
            <KeyValueRow label="Total" value={formatDollars(LINES_TOTAL)} total />
          </KeyValueList>
        </SectionCard>
      }
    >
      <SectionCard titleAs="h3" title="Trend" description="Dummy chart area" action={<MenuButton />}>
        <Placeholder h={200} label="Chart" />
      </SectionCard>
      <SectionCard titleAs="h3" title="Detail">
        <Placeholder h={120} label="Table" />
      </SectionCard>
    </DashboardLayout>
  );
}
