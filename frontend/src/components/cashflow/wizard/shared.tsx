import { useId, type ReactNode } from "react";
import { Check, Plus, type LucideIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Stat from "@/components/patterns/blocks/Stat";
import { cn } from "@/lib/utils";
import { formatDollarsSigned } from "@/lib/formatters";

export const currencyInput = (setter: (v: string) => void) => ({
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setter(raw ? formatDollarsSigned(Number(raw)) : "");
  },
});

export function InputField({
  label,
  hint,
  suffix,
  id,
  className,
  type = "text",
  caps = false,
  ...inputProps
}: {
  label: string;
  hint?: string;
  /** Small caps caption, as on the Purchase Costs card (steps moved onto the shared patterns). */
  caps?: boolean;
  /** Right-aligned unit shown inside the field (e.g. "%"). */
  suffix?: string;
} & Omit<React.ComponentProps<typeof Input>, "variant">) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const input = (
    <Input
      id={inputId}
      type={type}
      variant="filled"
      className={cn(suffix && "pr-10 w-full", className)}
      {...inputProps}
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <Label variant={caps ? "caps" : "field"} htmlFor={inputId}>{label}</Label>
        {hint && <span className="text-[10px] text-fg-muted">{hint}</span>}
      </div>
      {suffix ? (
        <div className="relative">
          {input}
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-fg-tertiary pointer-events-none">
            {suffix}
          </span>
        </div>
      ) : (
        input
      )}
    </div>
  );
}

/**
 * Form-row slider: caps label left, an exact-value field right, the slider
 * and its tick labels below. (The centred, display-style slider is
 * domain/SliderInputField.)
 */
export function SliderInputField({
  label,
  value,
  onType,
  onSlide,
  min,
  max,
  step,
  suffix,
  ticks,
  fallback,
  aside,
}: {
  label: string;
  value: string;
  onType: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSlide: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
  ticks: string[];
  fallback: number;
  /** Optional readout beside the label, e.g. the dollar equivalent of a %. */
  aside?: ReactNode;
}) {
  const id = useId();
  const n = parseFloat(value);
  const sliderValue = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <Label variant="caps" htmlFor={id}>{label}</Label>
          {aside}
        </div>
        <div className="relative">
          <Input
            id={id}
            variant="filled"
            inputMode="decimal"
            value={value}
            onChange={onType}
            placeholder={String(fallback)}
            className="h-9 w-24 pr-9 text-right text-[15px] font-semibold tabular-nums"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-fg-tertiary">{suffix}</span>
        </div>
      </div>
      <Slider
        variant="hero"
        min={min}
        max={max}
        step={step}
        value={[sliderValue]}
        onValueChange={([v]) => onSlide(v)}
        thumbProps={{ "aria-label": label, "aria-valuetext": `${sliderValue}${suffix === "%" ? "%" : ` ${suffix}`}` }}
        className={cn(!Number.isFinite(n) && "opacity-50")}
      />
      <div className="flex justify-between text-[11px] text-fg-muted tabular-nums" aria-hidden="true">
        {ticks.map((t) => <span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

/** Pill toggle for an optional feature (Toggle `pill`): plus when off, check when on. */
export function FeatureToggle({ on, onChange, children }: { on: boolean; onChange: (on: boolean) => void; children: ReactNode }) {
  return (
    <Toggle variant="pill" pressed={on} onPressedChange={onChange} className="inline-flex h-8 items-center gap-1.5 px-3.5 text-[13px]">
      {on ? <Check size={14} strokeWidth={2.4} aria-hidden="true" /> : <Plus size={14} strokeWidth={2.4} aria-hidden="true" />}
      {children}
    </Toggle>
  );
}

export type Figure = { label: string; value: string; accent?: string };

/**
 * A step's key figures, in one row under its inputs. A figure appears once
 * everything it needs is entered ("—" until then); the row appears with the
 * first one. Columns are sized for the full set, so figures don't stretch.
 * Hidden at 2xl when the wizard has its summary column, which shows them.
 */
export function Figures({ items }: { items: Figure[] }) {
  const shown = items.filter((f) => f.value !== "—");
  if (shown.length === 0) return null;
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border-subtle px-6 py-5 2xl:group-data-aside/wizard:hidden",
        items.length === 3 ? "@min-[30rem]:grid-cols-3" : "@min-[30rem]:grid-cols-4",
      )}
    >
      {shown.map((f) => (
        <Stat
          key={f.label}
          size="sm"
          label={f.label}
          value={<span style={f.accent ? { color: f.accent } : undefined}>{f.value}</span>}
        />
      ))}
    </div>
  );
}

/** One row of tiles: icon, title, selection dot. */
export function TileChoice<T extends string>({
  labelId,
  label,
  value,
  options,
  onPick,
}: {
  labelId: string;
  label: string;
  value: T | null;
  options: { value: T; title: string; Icon: LucideIcon }[];
  onPick: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Label variant="caps" id={labelId}>{label}</Label>
      {/* Click handlers live on the items (not onValueChange) so re-clicking
          the active tile re-applies the choice and never deselects it. */}
      <ToggleGroup
        type="single"
        variant="tile"
        value={value ?? ""}
        aria-labelledby={labelId}
        className="grid grid-cols-1 gap-2.5 @min-[26rem]:grid-cols-2"
      >
        {options.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value} onClick={() => onPick(o.value)}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-fg-tertiary transition-colors group-data-[state=on]/toggle:bg-brand/15 group-data-[state=on]/toggle:text-brand">
              <o.Icon size={16} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-fg-primary">{o.title}</span>
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded-full border-2 border-border-default transition-colors group-data-[state=on]/toggle:border-brand group-data-[state=on]/toggle:bg-brand group-data-[state=on]/toggle:shadow-[inset_0_0_0_2px_var(--color-surface-raised)]"
            />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
