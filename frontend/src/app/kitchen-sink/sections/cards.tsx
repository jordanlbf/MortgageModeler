import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import KeyValueList, { KeyValueRow } from "@/components/patterns/KeyValueList";
import SectionCard from "@/components/patterns/SectionCard";
import Stat, { StatDelta } from "@/components/patterns/Stat";
import { formatDollars } from "@/lib/formatters";
import VariantRow from "../_components/VariantRow";
import { LINES, LINES_TOTAL, MenuButton, Placeholder } from "./dummy";

/*
 * Every card in the app is a SectionCard (components/patterns/SectionCard.tsx).
 * Edit that file, not this one, to change cards everywhere.
 */

const W = "w-full max-w-[320px]";

export default function CardsSection() {
  return (
    <>
      <VariantRow label="header · title / + description / + action / all three">
        <SectionCard titleAs="h3" title="Card title" className={W}>
          <Placeholder h={80} />
        </SectionCard>
        <SectionCard titleAs="h3" title="Card title" description="One line of supporting text" className={W}>
          <Placeholder h={80} />
        </SectionCard>
        <SectionCard titleAs="h3" title="Card title" action={<MenuButton />} className={W}>
          <Placeholder h={80} />
        </SectionCard>
        <SectionCard titleAs="h3" title="Card title" description="One line of supporting text" action={<Badge variant="tag">Status</Badge>} className={W}>
          <Placeholder h={80} />
        </SectionCard>
      </VariantRow>

      <VariantRow label='size="default" / size="sm" · untitled'>
        <SectionCard titleAs="h3" title="Default size" className={W}>
          <Placeholder h={60} />
        </SectionCard>
        <SectionCard size="sm" titleAs="h3" title="Small size" action={<MenuButton />} className={W}>
          <Placeholder h={60} />
        </SectionCard>
        <SectionCard className={W}>
          <Placeholder h={60} label="No header" />
        </SectionCard>
      </VariantRow>

      <VariantRow label="flush · divided sections / table">
        <SectionCard flush titleAs="h3" title="Divided sections" className={W}>
          {["Section one", "Section two", "Section three"].map((s) => (
            <div key={s} className="border-t border-border-subtle px-6 py-5">
              <Placeholder h={36} label={s} />
            </div>
          ))}
        </SectionCard>
        <SectionCard flush titleAs="h3" title="With a table" className="w-full max-w-[480px]">
          <div className="px-3 pb-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LINES.map((l) => (
                  <TableRow key={l.label}>
                    <TableCell>{l.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatDollars(l.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </VariantRow>

      <VariantRow label="common contents · stat / list / chart / form">
        <SectionCard size="sm" className="w-[220px]">
          <Stat label="Stat card" value={formatDollars(42_000)} delta={<StatDelta direction="up">3.2%</StatDelta>}>
            <span className="text-[12px] text-fg-tertiary">Supporting line</span>
          </Stat>
        </SectionCard>
        <SectionCard titleAs="h3" title="List card" className="w-full max-w-[280px]">
          <KeyValueList>
            {LINES.map((l) => <KeyValueRow key={l.label} label={l.label} value={formatDollars(l.value)} />)}
            <KeyValueRow label="Total" value={formatDollars(LINES_TOTAL)} total />
          </KeyValueList>
        </SectionCard>
        <SectionCard titleAs="h3" title="Chart card" description="Last 12 months" action={<MenuButton />} className="w-full max-w-[360px]">
          <Placeholder h={140} label="Chart" />
        </SectionCard>
        <SectionCard titleAs="h3" title="Form card" className="w-full max-w-[300px]">
          <div className="flex flex-col gap-1.5">
            <Label variant="form" htmlFor="ks-card-field">Field label</Label>
            <Input id="ks-card-field" variant="form" placeholder="Value" />
          </div>
          <Button variant="cta" className="self-start px-5 py-2.5 text-sm">Save</Button>
        </SectionCard>
      </VariantRow>

      <VariantRow label="in a grid · cards stretch to the tallest">
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
          <SectionCard titleAs="h3" title="Short">
            <Placeholder h={40} />
          </SectionCard>
          <SectionCard titleAs="h3" title="Tall">
            <Placeholder h={120} />
          </SectionCard>
          <SectionCard titleAs="h3" title="Medium" action={<MenuButton />}>
            <Placeholder h={80} />
          </SectionCard>
        </div>
      </VariantRow>
    </>
  );
}
