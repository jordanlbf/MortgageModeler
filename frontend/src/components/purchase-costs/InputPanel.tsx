"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { PC_STATES, type PurchaseCostsState } from "@/hooks/usePurchaseCostsState";
import { formatDollars } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const CAPTION = "text-[11px] font-medium uppercase tracking-[0.08em] text-fg-tertiary";

/**
 * Reads typed money: "650000", "650,000", "$650k", "1.2m", and for the deposit
 * "20%" (of `percentOf`). Returns null while the text isn't a number yet.
 */
export function parseAmount(text: string, percentOf?: number): number | null {
  const t = text.trim().toLowerCase().replace(/[$,\s]/g, "");
  if (!t) return 0;
  const m = t.match(/^(\d*\.?\d*)(k|m|%)?$/);
  if (!m || m[1] === "" || m[1] === ".") return null;
  const n = parseFloat(m[1]);
  if (m[2] === "k") return Math.round(n * 1e3);
  if (m[2] === "m") return Math.round(n * 1e6);
  if (m[2] === "%") return percentOf ? Math.round((percentOf * Math.min(n, 100)) / 100) : null;
  return Math.round(n);
}

const MONEY_SIZE = {
  lg: { dollar: "text-[22px]", input: "h-10 text-[30px] tracking-[-0.02em]" },
  md: { dollar: "text-[17px]", input: "h-8 text-[20px]" },
} as const;

/**
 * Money input with a "$" prefix. Keeps what you type while focused (so "1.2m"
 * or "20%" can be typed), updates the estimate on every keystroke, and tidies
 * to "600,000" on blur. Arrow keys step by `step`.
 */
function MoneyField({
  id,
  value,
  onCommit,
  placeholder,
  step,
  percentOf,
  autoFocus,
  aside,
  size = "md",
}: {
  id: string;
  value: number;
  onCommit: (n: number) => void;
  placeholder: string;
  step: number;
  percentOf?: number;
  autoFocus?: boolean;
  aside?: React.ReactNode;
  size?: keyof typeof MONEY_SIZE;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const shown = draft ?? (value > 0 ? formatDollars(value).replace(/^\$/, "") : "");
  const sz = MONEY_SIZE[size];

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
    // Focus once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className={`${sz.dollar} font-semibold ${value > 0 || draft ? "text-fg-secondary" : "text-fg-muted"}`} aria-hidden="true">$</span>
      <Input
        ref={ref}
        variant="form"
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={shown}
        onChange={(e) => {
          const text = e.target.value;
          const n = parseAmount(text, percentOf);
          if (n !== null) onCommit(n);
          // Plain numbers show formatted as you type; shorthand ("1.2m", "20%") stays as typed until blur.
          setDraft(/^[\s$\d,]*$/.test(text) ? null : text);
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setDraft(null);
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const dir = e.key === "ArrowUp" ? 1 : -1;
            const next = Math.max(0, (dir > 0 ? Math.floor(value / step) + 1 : Math.ceil(value / step) - 1) * step);
            setDraft(null);
            onCommit(next);
          }
        }}
        className={`${sz.input} min-w-0 flex-1 border-0 bg-transparent px-0 font-semibold tabular-nums shadow-none placeholder:font-normal placeholder:text-fg-muted hover:bg-transparent focus:bg-transparent focus:shadow-none`}
      />
      {aside}
    </span>
  );
}

/** Caption + money input (clicking either focuses the input), with a slider underneath. */
function MoneyBlock({ label, htmlFor, children, slider }: { label: string; htmlFor: string; children: React.ReactNode; slider: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 px-6 py-4">
      <label htmlFor={htmlFor} className="flex cursor-text flex-col gap-1">
        <span className={CAPTION}>{label}</span>
        {children}
      </label>
      {slider}
    </div>
  );
}

/**
 * A collapsible group, like an account group in a finance sidebar: chevron and
 * title on the left; when collapsed, the current values sit right-aligned.
 */
function Group({ title, summary, defaultOpen, children }: { title: string; summary: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t border-border-subtle">
      <CollapsibleTrigger asChild>
        <Button variant="disclosure" className="h-auto gap-3 px-6 py-3.5 hover:bg-surface-hover/30">
          <span className="flex items-center gap-2 text-[14px] font-medium text-fg-primary">
            <ChevronRight
              size={15}
              className={`shrink-0 text-fg-tertiary transition-transform duration-200 ${open ? "rotate-90" : ""}`}
              aria-hidden="true"
            />
            {title}
          </span>
          {!open && <span className="truncate text-[13px] text-fg-tertiary">{summary}</span>}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3.5 px-6 pt-0.5 pb-5">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** A setting row: label (and optional hint) on the left, a switch on the right. */
function SwitchRow({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Label variant="bare" htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13.5px] text-fg-primary">{label}</span>
        <span className="text-[12px] text-fg-tertiary">{hint}</span>
      </span>
      <Switch variant="accent" id={id} checked={checked} onCheckedChange={onChange} />
    </Label>
  );
}

const PROPERTY_TYPES = [
  { value: "existing", label: "Existing" },
  { value: "new", label: "New" },
  { value: "land", label: "Land" },
] as const;

const ITEM = "h-8 min-w-0 px-3 text-[12.5px]";

/** The input column: price and deposit always visible, everything else in collapsible groups. */
export default function InputPanel({ pc }: { pc: PurchaseCostsState }) {
  const id = useId();
  const { inputs, setters } = pc;
  const { price, depositAmount } = inputs;

  const overPrice = price > 0 && depositAmount > price;
  const pct = price > 0 && depositAmount > 0 ? `${+((depositAmount / price) * 100).toFixed(1)}%` : null;

  const priceMin = 100_000;
  const priceMax = Math.max(3_000_000, price);
  const depositMax = Math.max(price, depositAmount, 50_000);

  const typeLabel = PROPERTY_TYPES.find((t) => t.value === inputs.propertyType)?.label ?? "";
  const buyerSummary = [inputs.ownerOcc ? "Live in it" : "Investment", inputs.firstHome && "First home"].filter(Boolean).join(" · ");
  const advancedSummary = [inputs.couple && "Couple", inputs.lmiExempt && "LMI exempt"].filter(Boolean).join(" · ") || "None";

  return (
    <Card variant="panel" role="group" aria-label="Purchase details" className="rounded-2xl">
      <h2 className="px-6 pt-6 pb-1 text-[17px] font-semibold tracking-[-0.01em] text-fg-primary">Your purchase</h2>

      <MoneyBlock
        label="Purchase price"
        htmlFor={`${id}-price`}
        slider={
          <Slider
            variant="accent"
            aria-label="Purchase price"
            min={priceMin}
            max={priceMax}
            step={10_000}
            value={[Math.max(priceMin, price)]}
            onValueChange={([v]) => setters.setPriceInput(String(v))}
            thumbProps={{ "aria-valuetext": formatDollars(price) }}
          />
        }
      >
        <MoneyField
          id={`${id}-price`}
          size="lg"
          value={price}
          onCommit={(n) => setters.setPriceInput(String(n))}
          placeholder="e.g. 650k"
          step={10000}
          autoFocus={price === 0}
        />
      </MoneyBlock>

      <MoneyBlock
        label="Deposit"
        htmlFor={`${id}-deposit`}
        slider={
          <Slider
            variant="accent"
            aria-label="Deposit"
            min={0}
            max={depositMax}
            step={5_000}
            disabled={price <= 0}
            value={[Math.min(depositAmount, depositMax)]}
            onValueChange={([v]) => setters.setDepositAmountInput(String(v))}
            thumbProps={{ "aria-valuetext": formatDollars(depositAmount) }}
          />
        }
      >
        <MoneyField
          id={`${id}-deposit`}
          value={depositAmount}
          onCommit={(n) => setters.setDepositAmountInput(String(n))}
          placeholder={price > 0 ? "e.g. 20% or 130k" : "e.g. 130k"}
          step={5000}
          percentOf={price}
          aside={
            pct && (
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-medium tabular-nums ${
                  overPrice ? "bg-data-negative/10 text-data-negative" : "bg-surface-hover text-fg-secondary"
                }`}
                aria-live="polite"
              >
                {overPrice ? "Over price" : pct}
              </span>
            )
          }
        />
      </MoneyBlock>

      <div className="h-2" />

      <Group title="Property" summary={`${inputs.state} · ${typeLabel}`} defaultOpen>
        <div className="flex items-center justify-between gap-4">
          <Label variant="bare" htmlFor={`${id}-state`} className="text-[13.5px] text-fg-secondary">State</Label>
          <NativeSelect
            variant="form"
            id={`${id}-state`}
            aria-label="State"
            value={inputs.state}
            onChange={(e) => setters.setState(e.target.value)}
            className="h-8 w-[84px] rounded-lg pl-3 pr-7 text-[13px] font-medium"
          >
            {PC_STATES.map((s) => (
              <NativeSelectOption variant="form" key={s} value={s}>{s}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <ToggleGroup
          type="single"
          variant="segment-pill"
          aria-label="Property type"
          className="grid grid-cols-3 gap-1.5"
          value={inputs.propertyType}
          onValueChange={(v) => { if (v) setters.setPropertyType(v); }}
        >
          {PROPERTY_TYPES.map((t) => (
            <ToggleGroupItem key={t.value} value={t.value} className={ITEM}>{t.label}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Group>

      <Group title="Buyer" summary={buyerSummary} defaultOpen>
        <ToggleGroup
          type="single"
          variant="segment-pill"
          aria-label="Occupancy"
          className="grid grid-cols-2 gap-1.5"
          value={inputs.ownerOcc ? "owner" : "investor"}
          onValueChange={(v) => { if (v) setters.setOwnerOcc(v === "owner"); }}
        >
          <ToggleGroupItem value="owner" className={ITEM}>Live in it</ToggleGroupItem>
          <ToggleGroupItem value="investor" className={ITEM}>Investment</ToggleGroupItem>
        </ToggleGroup>
        <SwitchRow
          id={`${id}-first`}
          label="First home"
          hint="Unlocks state concessions and grants"
          checked={inputs.firstHome}
          onChange={setters.setFirstHome}
        />
      </Group>

      <Group title="Advanced" summary={advancedSummary}>
        <SwitchRow id={`${id}-couple`} label="Couple" hint="Two buyers on the title" checked={inputs.couple} onChange={setters.setCouple} />
        <SwitchRow
          id={`${id}-lmi`}
          label="LMI exempt"
          hint="Some medical, legal and finance professions"
          checked={inputs.lmiExempt}
          onChange={setters.setLmiExempt}
        />
      </Group>

      <div className="h-2" />
    </Card>
  );
}
