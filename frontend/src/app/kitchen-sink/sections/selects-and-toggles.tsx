"use client";

import { BarChart3, Building2, Home, Table2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle, ToggleLegendDot } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import VariantRow from "../_components/VariantRow";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

/** Tab panels, so each trigger's aria-controls points at a real element. The strips are the point here. */
function Panels({ values }: { values: string[] }) {
  return (
    <>
      {values.map((v) => (
        <TabsContent key={v} value={v} className="sr-only">
          {v} panel
        </TabsContent>
      ))}
    </>
  );
}

export default function SelectsAndTogglesSection() {
  return (
    <>
      <VariantRow label="NativeSelect default / form / disabled">
        <NativeSelect aria-label="State (default)" defaultValue="QLD">
          {STATES.map((s) => <NativeSelectOption key={s} value={s}>{s}</NativeSelectOption>)}
        </NativeSelect>
        <NativeSelect variant="form" aria-label="State (form)" defaultValue="VIC" className="w-[120px]">
          {STATES.map((s) => <NativeSelectOption variant="form" key={s} value={s}>{s}</NativeSelectOption>)}
        </NativeSelect>
        <NativeSelect variant="form" aria-label="State (disabled)" defaultValue="NSW" disabled className="w-[120px]">
          {STATES.map((s) => <NativeSelectOption variant="form" key={s} value={s}>{s}</NativeSelectOption>)}
        </NativeSelect>
      </VariantRow>

      {(["default", "md", "lg"] as const).map((v) => (
        <VariantRow key={v} label={`Checkbox variant="${v}" · off / on / disabled`}>
          <Label variant="bare" className="flex items-center gap-2 text-[13px] text-fg-secondary">
            <Checkbox variant={v} />
            Include stamp duty
          </Label>
          <Label variant="bare" className="flex items-center gap-2 text-[13px] text-fg-secondary">
            <Checkbox variant={v} defaultChecked />
            Include LMI
          </Label>
          <Label variant="bare" className="flex items-center gap-2 text-[13px] text-fg-muted">
            <Checkbox variant={v} disabled />
            Include grants
          </Label>
        </VariantRow>
      ))}

      <VariantRow label="Switch default (sm / default) · accent · glow · disabled">
        <Switch size="sm" aria-label="Switch sm" defaultChecked />
        <Switch aria-label="Switch default" />
        <Switch variant="accent" aria-label="Living in it" defaultChecked />
        <Switch variant="accent" aria-label="First home buyer (custom accent)" defaultChecked style={{ "--switch-accent": "var(--color-data-warning)" } as React.CSSProperties} />
        <Switch variant="glow" aria-label="Show depreciation" defaultChecked />
        <Switch variant="accent" aria-label="LMI exempt (disabled)" disabled />
      </VariantRow>

      <VariantRow label='ToggleGroup variant="segment" (segmented control)'>
        <ToggleGroup type="single" variant="segment" aria-label="View" defaultValue="chart" className="flex gap-1">
          <ToggleGroupItem value="chart" aria-label="Chart" className="flex items-center gap-1.5 px-3 py-1.5">
            <BarChart3 className="size-3.5" aria-hidden="true" /> Chart
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table" className="flex items-center gap-1.5 px-3 py-1.5">
            <Table2 className="size-3.5" aria-hidden="true" /> Table
          </ToggleGroupItem>
        </ToggleGroup>
      </VariantRow>
      <VariantRow label='ToggleGroup variant="segment-pill"'>
        <ToggleGroup type="single" variant="segment-pill" aria-label="Repayment frequency" defaultValue="monthly" className="grid grid-cols-3 gap-1.5">
          {["weekly", "fortnightly", "monthly"].map((f) => (
            <ToggleGroupItem key={f} value={f} className="h-8 px-3 capitalize">{f}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </VariantRow>
      <VariantRow label='ToggleGroup variant="pill" (+ data-tone="negative")'>
        <ToggleGroup type="single" variant="pill" aria-label="Eligible" defaultValue="no" className="flex gap-2">
          <ToggleGroupItem value="yes">Yes</ToggleGroupItem>
          <ToggleGroupItem value="no" data-tone="negative">No</ToggleGroupItem>
        </ToggleGroup>
      </VariantRow>
      <VariantRow label='ToggleGroup variant="tile" (one row: icon, title, status pill; children react via group-data-[state=on]/toggle)'>
        <ToggleGroup type="single" variant="tile" aria-label="Property kind" defaultValue="investment" className="grid w-full max-w-[560px] grid-cols-2 gap-3">
          {[
            { value: "investment", title: "Investment", pill: "New", Icon: Building2 },
            { value: "home", title: "Home", pill: "Existing", Icon: Home },
          ].map((t) => (
            <ToggleGroupItem key={t.value} value={t.value} aria-label={`${t.title}, ${t.pill.toLowerCase()}`}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-fg-tertiary group-data-[state=on]/toggle:bg-brand/15 group-data-[state=on]/toggle:text-brand">
                <t.Icon size={16} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-fg-primary">{t.title}</span>
              <Badge variant="soft" className="rounded-full px-2 py-1 group-data-[state=on]/toggle:[--badge-accent:var(--color-brand)]">{t.pill}</Badge>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </VariantRow>
      <VariantRow label='ToggleGroup variant="choice"'>
        <ToggleGroup type="single" variant="choice" aria-label="Purchase status" defaultValue="planning" className="flex gap-2">
          <ToggleGroupItem value="planning">Planning to buy</ToggleGroupItem>
          <ToggleGroupItem value="owned">Already own it</ToggleGroupItem>
        </ToggleGroup>
      </VariantRow>
      <VariantRow label='ToggleGroup variant="solid"'>
        <ToggleGroup type="single" variant="solid" aria-label="Dashboard view" defaultValue="overview" className="flex gap-1 rounded-lg bg-surface-subtle p-1">
          <ToggleGroupItem value="overview" className="px-3 py-1 text-[13px]">Overview</ToggleGroupItem>
          <ToggleGroupItem value="details" className="px-3 py-1 text-[13px]">Details</ToggleGroupItem>
        </ToggleGroup>
      </VariantRow>
      <VariantRow label='ToggleGroup variant="segment-fill"'>
        <ToggleGroup type="single" variant="segment-fill" aria-label="New or existing" defaultValue="new" className="inline-flex rounded-full bg-surface-hover/70 p-1">
          <ToggleGroupItem value="new" style={{ "--segment-accent": "var(--color-purchase-new)" } as React.CSSProperties}>New home</ToggleGroupItem>
          <ToggleGroupItem value="existing" style={{ "--segment-accent": "var(--color-purchase-existing)" } as React.CSSProperties}>Existing home</ToggleGroupItem>
        </ToggleGroup>
      </VariantRow>
      <VariantRow label='ToggleGroup variant="legend" (multiple)'>
        <ToggleGroup type="multiple" variant="legend" aria-label="Show series" defaultValue={["equity", "debt"]} className="flex gap-1.5">
          {[
            ["equity", "Equity", "var(--color-series-equity)"],
            ["debt", "Debt", "var(--color-series-debt)"],
            ["cashflow", "Cashflow", "var(--color-series-cashflow)"],
          ].map(([v, name, c]) => (
            <ToggleGroupItem key={v} value={v} style={{ "--legend-accent": c } as React.CSSProperties}>
              <ToggleLegendDot />
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </VariantRow>
      <VariantRow label="Toggle default / outline (pressed)">
        <Toggle aria-label="Show interest" defaultPressed>Interest</Toggle>
        <Toggle variant="outline" aria-label="Show principal">Principal</Toggle>
      </VariantRow>

      {(["default", "line"] as const).map((v) => (
        <VariantRow key={v} label={`Tabs variant="${v}"`}>
          <Tabs variant={v} defaultValue="summary">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
            </TabsList>
            <Panels values={["summary", "schedule", "assumptions"]} />
          </Tabs>
        </VariantRow>
      ))}
      <VariantRow label='Tabs variant="underline"'>
        <Tabs variant="underline" defaultValue="annual">
          <TabsList className="flex gap-6 border-b border-border-subtle pb-3">
            <TabsTrigger value="annual">Annual</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="cumulative">Cumulative</TabsTrigger>
          </TabsList>
          <Panels values={["annual", "monthly", "cumulative"]} />
        </Tabs>
      </VariantRow>
      <VariantRow label='Tabs variant="track"'>
        <Tabs variant="track" defaultValue="quick">
          <TabsList className="flex w-fit gap-1 rounded-lg p-1">
            <TabsTrigger value="quick" className="rounded-md px-3 py-1.5 text-sm font-medium">Quick estimate</TabsTrigger>
            <TabsTrigger value="custom" className="rounded-md px-3 py-1.5 text-sm font-medium">Custom</TabsTrigger>
          </TabsList>
          <Panels values={["quick", "custom"]} />
        </Tabs>
      </VariantRow>
      <VariantRow label='Tabs variant="stat" (--tab-accent)'>
        <Tabs variant="stat" defaultValue="income" className="w-full max-w-[420px]">
          <TabsList className="flex gap-[3px] rounded-[10px] p-[3px]">
            {[
              ["income", "Income", "$148,200", "var(--color-data-positive)"],
              ["deductions", "Deductions", "$31,407", "var(--color-data-warning)"],
              ["tax", "Tax", "—", "var(--color-data-negative)"],
            ].map(([v, name, val, c]) => (
              <TabsTrigger
                key={v}
                value={v}
                data-filled={val !== "—" ? "true" : undefined}
                className="flex flex-1 flex-col items-center rounded-[8px] px-3 py-[10px]"
                style={{ "--tab-accent": c } as React.CSSProperties}
              >
                <span className="text-[12px] font-medium">{name}</span>
                <span className="text-[13px] font-semibold tabular-nums text-[color:var(--tab-stat-value)]">{val}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <Panels values={["income", "deductions", "tax"]} />
        </Tabs>
      </VariantRow>

      <VariantRow label='Slider default / accent / hero'>
        <div className="w-[200px]"><Slider defaultValue={[40]} thumbProps={{ "aria-label": "Slider default" }} /></div>
        <div className="w-[200px]"><Slider variant="accent" defaultValue={[60]} thumbProps={{ "aria-label": "Slider accent" }} /></div>
        <div className="w-[200px]" style={{ "--slider-accent": "var(--color-data-warning)" } as React.CSSProperties}>
          <Slider variant="hero" defaultValue={[12]} max={100} thumbProps={{ "aria-label": "Deposit percent" }} />
        </div>
      </VariantRow>
    </>
  );
}
