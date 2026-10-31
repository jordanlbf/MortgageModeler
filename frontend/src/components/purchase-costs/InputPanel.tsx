"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PC_STATES, type PurchaseCostsState } from "@/hooks/usePurchaseCostsState";
import { formatDollars } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { LMI_THRESHOLD, lvrColor } from "./shared";

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

/**
 * Big money input with a "$" prefix. Keeps what you type while focused (so
 * "1.2m" or "20%" can be typed), updates the estimate on every keystroke, and
 * tidies to "600,000" on blur. Arrow keys step by `step`.
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
    // Hover tint and a brand underline while editing, so the big number reads as editable.
    <span
      className={
        "relative -mx-2 flex min-w-0 cursor-text items-center gap-1.5 rounded-lg px-2 transition-colors duration-150 " +
        "hover:bg-surface-hover/50 has-[>input:focus]:bg-surface-hover/50 " +
        "after:pointer-events-none after:absolute after:inset-x-2 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-transparent after:transition-colors after:duration-150 after:content-[''] has-[>input:focus]:after:bg-brand"
      }
      onClick={(e) => {
        // The % chip beside the number is its own field.
        if (!(e.target as HTMLElement).closest("[data-slot=badge]")) ref.current?.focus();
      }}
    >
      <span className={`text-[22px] font-semibold transition-colors ${value > 0 || draft ? "text-fg-secondary" : "text-fg-muted"}`} aria-hidden="true">$</span>
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
        className="h-9 min-w-0 flex-1 border-0 bg-transparent px-0 text-[28px] font-semibold tracking-[-0.02em] tabular-nums shadow-none placeholder:font-semibold placeholder:text-fg-muted hover:bg-transparent focus:bg-transparent focus:shadow-none"
      />
      {aside}
    </span>
  );
}

/** The slider's own scale: dollars for the price, % of price for the deposit. */
interface Scale {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  /** Labels for the range ends. */
  tick: (n: number) => string;
  valueText: string;
}

/**
 * One amount section: caption, big dollar input, and optionally a slider on
 * `scale` with its range underneath. `markers` label points on the scale
 * (deposits worth aiming for); a drag settles onto them. `accent` tints the slider (the deposit follows the LVR colour).
 */
function AmountSection({
  id,
  label,
  value,
  onChange,
  scale,
  inputStep,
  percentOf,
  autoFocus,
  disabled,
  accent = "var(--color-brand)",
  markers,
  aside,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  scale?: Scale;
  inputStep: number;
  percentOf?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  accent?: string;
  markers?: Marker[];
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-border-subtle px-6 py-5" style={{ "--slider-accent": accent } as React.CSSProperties}>
      <div className="flex flex-col gap-2">
        <Label variant="caps" htmlFor={id}>{label}</Label>
        <MoneyField
          id={id}
          value={value}
          onCommit={onChange}
          placeholder="0"
          step={inputStep}
          percentOf={percentOf}
          autoFocus={autoFocus}
          aside={aside}
        />
      </div>
      {scale && <ScaleSlider label={label} scale={scale} disabled={disabled} markers={markers} />}
    </div>
  );
}

/** A labelled point on a slider's scale. While dragging, the slider settles onto it. */
interface Marker {
  value: number;
  label: string;
  /** Longer explanation, read by screen readers and shown on hover. */
  title?: string;
}

/** Within this distance (in scale units) of a marker, a drag settles onto it. Keyboard steps never snap. */
const SNAP_RADIUS = 1;

function ScaleSlider({ label, scale, disabled, markers = [] }: { label: string; scale: Scale; disabled?: boolean; markers?: Marker[] }) {
  const { min, max } = scale;
  const span = Math.max(max - min, 1);
  const at = (v: number) => `${((Math.min(Math.max(v, min), max) - min) / span) * 100}%`;
  const shown = markers.filter((m) => m.value > min && m.value < max);
  // Drop an end label when a marker label would sit on top of it.
  const crowded = (end: number) => shown.some((m) => Math.abs(m.value - end) < span * 0.1);
  const dragging = useRef(false);

  return (
    <div className="relative pt-1 pb-5">
      <Slider
        variant="hero"
        aria-label={label}
        min={min}
        max={max}
        step={scale.step}
        disabled={disabled}
        value={[Math.min(Math.max(scale.value, min), max)]}
        onPointerDown={() => {
          dragging.current = true;
          window.addEventListener("pointerup", () => { dragging.current = false; }, { once: true });
        }}
        onValueChange={([v]) => {
          const near = dragging.current ? shown.find((m) => Math.abs(m.value - v) <= SNAP_RADIUS) : undefined;
          scale.onChange(near ? near.value : v);
        }}
        thumbProps={{ "aria-valuetext": scale.valueText }}
      />
      {shown.map((m) => (
        <span
          key={m.value}
          className="pointer-events-none absolute top-0 bottom-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: at(m.value) }}
          aria-hidden="true"
        >
          <span className="mt-[9px] h-2.5 w-px bg-fg-secondary" />
          <span className="pointer-events-auto mt-auto text-[10.5px] whitespace-nowrap tabular-nums text-fg-secondary" title={m.title}>{m.label}</span>
        </span>
      ))}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between text-[10.5px] tabular-nums text-fg-tertiary" aria-hidden="true">
        <span className={crowded(min) ? "invisible" : undefined}>{scale.tick(min)}</span>
        <span className={crowded(max) ? "invisible" : undefined}>{scale.tick(max)}</span>
      </span>
      {shown.some((m) => m.title) && (
        <span className="sr-only">{shown.filter((m) => m.title).map((m) => m.title).join(". ")}</span>
      )}
    </div>
  );
}

/**
 * The deposit as a % of the price, editable in place: a tinted chip holding a
 * small input. Shows a whole number until focused, then one decimal. Typing
 * updates the deposit live; focusing alone never changes it. Arrows step 1%.
 */
function PercentChip({ id, percent, accent, onCommit }: { id: string; percent: number; accent: string; onCommit: (pct: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(Math.round(percent));
  const commit = (pct: number) => onCommit(Math.min(Math.max(pct, 0), 100));
  return (
    <Badge
      variant="soft"
      className="h-7 cursor-text gap-0 px-2 text-[13px] transition-shadow hover:ring-1 hover:ring-[color:color-mix(in_srgb,var(--badge-accent)_40%,transparent)] focus-within:ring-1 focus-within:ring-[color:var(--badge-accent)]"
      style={{ "--badge-accent": accent } as React.CSSProperties}
      onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus()}
    >
      <Input
        variant="ghost"
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label="Deposit as a percentage of the price"
        value={shown}
        style={{ width: `${Math.max(shown.length, 1) + 0.2}ch` }}
        className="h-auto p-0 text-right font-[inherit] text-[color:inherit] tabular-nums"
        onFocus={() => setDraft(String(+percent.toFixed(1)))}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          const text = e.target.value.replace(/[^\d.]/g, "");
          const n = parseFloat(text);
          setDraft(n > 100 ? "100" : text);
          if (!Number.isNaN(n)) commit(n);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const next = e.key === "ArrowUp" ? Math.floor(percent) + 1 : Math.ceil(percent) - 1;
            setDraft(String(Math.min(Math.max(next, 0), 100)));
            commit(next);
          }
        }}
      />
      <span aria-hidden="true">%</span>
    </Badge>
  );
}

const PROPERTY_TYPES = [
  { value: "existing", label: "Existing home" },
  { value: "new", label: "New build" },
  { value: "land", label: "Vacant land" },
] as const;

/** A setting row. When `disabled`, the row dims; `note` says why, to screen readers only. */
function SwitchRow({
  id,
  label,
  checked,
  onChange,
  disabled,
  note,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  note?: string;
}) {
  return (
    <Label
      variant="bare"
      htmlFor={id}
      className={`flex items-center justify-between gap-4 transition-opacity duration-200 ${disabled ? "cursor-default opacity-45" : "cursor-pointer"}`}
    >
      <span className="text-[13.5px] text-fg-secondary">
        {label}
        {/* Inside the label, so it's read with the switch's name. */}
        {disabled && note && <span className="sr-only">, {note}</span>}
      </span>
      <Switch
        variant="accent"
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </Label>
  );
}

/** The input card: title, then price, deposit, property and buyer sections. */
export default function InputPanel({ pc }: { pc: PurchaseCostsState }) {
  const id = useId();
  const { inputs, setters } = pc;
  const { price, depositAmount } = inputs;

  // The deposit slider runs 0–100% of the price; the 80% LVR point (20% deposit) is marked.
  const depositPct = price > 0 ? (depositAmount / price) * 100 : 0;
  const noLmiPct = Math.round((1 - LMI_THRESHOLD) * 100);
  const pctTick = (n: number) => `${n}%`;
  const lvr = price > 0 ? Math.max(0, (price - depositAmount) / price) : null;
  const overPrice = price > 0 && depositAmount > price;

  return (
    <Card variant="panel" role="group" aria-labelledby={`${id}-title`} className="h-full gap-0 rounded-2xl">
      <h2 id={`${id}-title`} className="px-6 pt-6 pb-5 text-[20px] leading-tight font-semibold tracking-[-0.01em] text-fg-primary">Your Purchase</h2>

      <AmountSection
        id={`${id}-price`}
        label="Purchase price"
        value={price}
        onChange={(n) => setters.setPriceInput(String(n))}
        inputStep={10_000}
        autoFocus={price === 0}
      />

      <AmountSection
        id={`${id}-deposit`}
        label="Deposit"
        value={depositAmount}
        onChange={(n) => setters.setDepositAmountInput(String(n))}
        scale={{
          value: depositPct,
          min: 0,
          max: 100,
          step: 1,
          onChange: (pct) => setters.setDepositAmountInput(String(Math.round((price * pct) / 100))),
          tick: pctTick,
          valueText: `${formatDollars(depositAmount) || "$0"}, ${Math.round(depositPct)}% of the price`,
        }}
        inputStep={5_000}
        percentOf={price}
        disabled={price <= 0}
        accent={lvr === null ? undefined : lvrColor(lvr)}
        markers={
          price > 0
            ? [
                ...(inputs.firstHome
                  ? [{ value: 5, label: "5%", title: "5%: the minimum deposit under the First Home Guarantee, with no LMI" }]
                  : []),
                { value: noLmiPct, label: `${noLmiPct}%`, title: `${noLmiPct}%: deposit needed to avoid LMI` },
              ]
            : undefined
        }
        aside={
          price > 0 && (
            <PercentChip
              id={`${id}-deposit-pct`}
              percent={depositPct}
              accent={overPrice ? "var(--color-data-negative)" : lvrColor(lvr)}
              onCommit={(pct) => setters.setDepositAmountInput(String(Math.round((price * pct) / 100)))}
            />
          )
        }
      />

      <div className="flex flex-col gap-4 border-t border-border-subtle px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <Label variant="bare" htmlFor={`${id}-state`} className="text-[13.5px] text-fg-secondary">State</Label>
            <NativeSelect
              variant="form"
              id={`${id}-state`}
              value={inputs.state}
              onChange={(e) => setters.setState(e.target.value)}
              className="h-8 w-[88px] shrink-0 rounded-lg pr-7 pl-3 text-[13px] font-medium"
            >
              {PC_STATES.map((s) => (
                <NativeSelectOption variant="form" key={s} value={s}>{s}</NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {/* One type is always on: switching one on turns the others off, and the active one can't be switched off. */}
          <div role="group" aria-label="Property type" className="flex flex-col gap-4">
            {PROPERTY_TYPES.map((t) => (
              <SwitchRow
                key={t.value}
                id={`${id}-type-${t.value}`}
                label={t.label}
                checked={inputs.propertyType === t.value}
                onChange={(on) => { if (on) setters.setPropertyType(t.value); }}
              />
            ))}
          </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border-subtle px-6 pt-5 pb-6">
          <SwitchRow
            id={`${id}-occ`}
            label="Living in it"
            checked={inputs.ownerOcc}
            onChange={(v) => {
              setters.setOwnerOcc(v);
              // First home benefits need you to live in it.
              if (!v) setters.setFirstHome(false);
            }}
          />
          <SwitchRow
            id={`${id}-first`}
            label="First home buyer"
            checked={inputs.firstHome}
            onChange={setters.setFirstHome}
            disabled={!inputs.ownerOcc}
            note="Only for a home you'll live in"
          />
          <SwitchRow id={`${id}-couple`} label="Buying as a couple" checked={inputs.couple} onChange={setters.setCouple} />
          <SwitchRow
            id={`${id}-lmi`}
            label="LMI exempt"
            checked={inputs.lmiExempt}
            onChange={setters.setLmiExempt}
            disabled={lvr !== null && lvr <= LMI_THRESHOLD}
            note={`No LMI with a ${noLmiPct}%+ deposit`}
          />
      </div>
    </Card>
  );
}
