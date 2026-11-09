"use client";

import { useEffect, useRef, useState } from "react";
import { formatDollars } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

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
 * Money input in the Cashflow setup box (Input `filled`): shows "$650,000".
 * Keeps what you type while focused (so "1.2m" or "20%" can be typed),
 * updates the estimate on every keystroke, and tidies on blur. Arrow keys
 * step by `step`. `aside` (the deposit's % chip) sits inside the box, right.
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
  const shown = draft ?? (value > 0 ? formatDollars(value) : "");

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
    // Focus once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <Input
        ref={ref}
        variant="filled"
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
        className={aside ? "w-full pr-20" : "w-full"}
      />
      {aside && <span className="absolute top-1/2 right-2.5 -translate-y-1/2">{aside}</span>}
    </div>
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
 * One amount section: caption, dollar input box, and optionally a slider on
 * `scale` with its range underneath. `markers` label points on the scale
 * (deposits worth aiming for); a drag settles onto them. `accent` tints the slider (the deposit follows the LVR colour).
 */
export function AmountSection({
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
  divider = true,
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
  /** A line above the section. Off to run straight on from the one above (price, then deposit). */
  divider?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-4 px-6 pb-5 ${divider ? "border-t border-border-subtle pt-5" : "pt-0"}`} style={{ "--slider-accent": accent } as React.CSSProperties}>
      <div className="flex flex-col gap-2">
        <Label variant="caps" htmlFor={id}>{label}</Label>
        <MoneyField
          id={id}
          value={value}
          onCommit={onChange}
          placeholder="$0"
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
        thumbProps={{ "aria-label": label, "aria-valuetext": scale.valueText }}
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
export function PercentChip({ id, percent, accent, onCommit }: { id: string; percent: number; accent: string; onCommit: (pct: number) => void }) {
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

