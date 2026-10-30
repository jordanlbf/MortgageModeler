"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { PC_STATES, type PurchaseCostsState } from "@/hooks/usePurchaseCostsState";
import { formatDollars } from "@/lib/formatters";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

/** One cell of the bar. Clicking anywhere in a field cell focuses its input. */
function Segment({ label, htmlFor, className = "", children }: { label: string; htmlFor?: string; className?: string; children: React.ReactNode }) {
  const cls = `flex min-w-0 flex-col justify-center gap-1.5 bg-card px-4 py-3 transition-colors duration-150 hover:bg-surface-hover/40 ${className}`;
  return htmlFor ? (
    <label
      htmlFor={htmlFor}
      className={`${cls} cursor-text focus-within:bg-surface-hover/60 focus-within:shadow-[inset_0_-2px_0_var(--color-brand)]`}
    >
      <span className={CAPTION}>{label}</span>
      {children}
    </label>
  ) : (
    <div className={cls}>
      <span className={CAPTION}>{label}</span>
      {children}
    </div>
  );
}

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
}: {
  id: string;
  value: number;
  onCommit: (n: number) => void;
  placeholder: string;
  step: number;
  percentOf?: number;
  autoFocus?: boolean;
  aside?: React.ReactNode;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const shown = draft ?? (value > 0 ? formatDollars(value).replace(/^\$/, "") : "");

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
    // Focus once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className={`text-[16px] font-semibold ${value > 0 || draft ? "text-fg-secondary" : "text-fg-muted"}`} aria-hidden="true">$</span>
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
        className="h-7 min-w-0 flex-1 border-0 bg-transparent px-0 text-[16px] font-semibold tabular-nums shadow-none placeholder:font-normal placeholder:text-fg-muted hover:bg-transparent focus:bg-transparent focus:shadow-none"
      />
      {aside}
    </span>
  );
}

const PROPERTY_TYPES = [
  { value: "existing", label: "Existing" },
  { value: "new", label: "New" },
  { value: "land", label: "Land" },
] as const;

const FLAGS = [
  { key: "firstHome", label: "First home", hint: "Unlocks state concessions and grants" },
  { key: "couple", label: "Couple", hint: "Two buyers on the title" },
  { key: "lmiExempt", label: "LMI exempt", hint: "Some medical, legal and finance professions" },
] as const;

/** Every input, visible: money fields and property details on top, buyer options as chips below. */
export default function PurchaseInputs({ pc }: { pc: PurchaseCostsState }) {
  const id = useId();
  const { inputs, setters } = pc;
  const { price, depositAmount } = inputs;
  const flagsOn = FLAGS.map((f) => f.key).filter((k) => inputs[k]);

  const overPrice = price > 0 && depositAmount > price;
  const pct = price > 0 && depositAmount > 0 ? `${+((depositAmount / price) * 100).toFixed(1)}%` : null;

  return (
    <div role="group" aria-label="Purchase details" className="overflow-hidden rounded-xl border border-border-subtle bg-border-subtle shadow-raised">
      <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-px lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.25fr)_minmax(0,0.6fr)_minmax(0,1.1fr)]">
        <Segment label="Purchase price" htmlFor={`${id}-price`} className="max-lg:col-span-2">
          <MoneyField
            id={`${id}-price`}
            value={price}
            onCommit={(n) => setters.setPriceInput(String(n))}
            placeholder="e.g. 650k"
            step={10000}
            autoFocus={price === 0}
          />
        </Segment>

        <Segment label="Deposit" htmlFor={`${id}-deposit`} className="max-lg:col-span-2">
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
        </Segment>

        <Segment label="State" htmlFor={`${id}-state`}>
          <NativeSelect
            variant="form"
            id={`${id}-state`}
            value={inputs.state}
            onChange={(e) => setters.setState(e.target.value)}
            className="h-7 border-0 bg-transparent pl-0 pr-6 text-[16px] font-semibold bg-[position:right_0_center] hover:bg-transparent focus:shadow-none"
          >
            {PC_STATES.map((s) => (
              <NativeSelectOption variant="form" key={s} value={s}>{s}</NativeSelectOption>
            ))}
          </NativeSelect>
        </Segment>

        <Segment label="Property">
          <ToggleGroup
            type="single"
            variant="segment"
            aria-label="Property type"
            className="grid grid-cols-3 gap-1"
            value={inputs.propertyType}
            onValueChange={(v) => { if (v) setters.setPropertyType(v); }}
          >
            {PROPERTY_TYPES.map((t) => (
              <ToggleGroupItem key={t.value} value={t.value} className="h-7 min-w-0 px-2 text-[12px]">
                {t.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Segment>
      </div>

      {/* Buyer options, always visible */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border-subtle bg-card px-4 py-2.5">
        <span className={`${CAPTION} mr-1`}>Buyer</span>
        <ToggleGroup
          type="single"
          variant="segment-pill"
          aria-label="Purpose"
          className="flex gap-1"
          value={inputs.ownerOcc ? "owner" : "investor"}
          onValueChange={(v) => { if (v) setters.setOwnerOcc(v === "owner"); }}
        >
          <ToggleGroupItem value="owner" className="h-8 px-3.5 text-[12.5px]">Live in it</ToggleGroupItem>
          <ToggleGroupItem value="investor" className="h-8 px-3.5 text-[12.5px]">Investment</ToggleGroupItem>
        </ToggleGroup>
        <span className="h-4 w-px bg-border-subtle max-sm:hidden" aria-hidden="true" />
        <ToggleGroup
          type="multiple"
          variant="pill"
          aria-label="Buyer options"
          className="flex flex-wrap gap-2"
          value={flagsOn}
          onValueChange={(next) => {
            setters.setFirstHome(next.includes("firstHome"));
            setters.setCouple(next.includes("couple"));
            setters.setLmiExempt(next.includes("lmiExempt"));
          }}
        >
          {FLAGS.map((f) => {
            const on = flagsOn.includes(f.key);
            return (
              <ToggleGroupItem key={f.key} value={f.key} className="h-8 min-w-0 gap-1.5 px-3 text-[12.5px]">
                {/* Tooltip on an inner span: a trigger on the item would overwrite its data-state. */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1.5">
                      {on ? <Check size={13} aria-hidden="true" /> : <Plus size={13} className="opacity-60" aria-hidden="true" />}
                      {f.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent variant="surface" side="bottom" sideOffset={10}>{f.hint}</TooltipContent>
                </Tooltip>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>
    </div>
  );
}
