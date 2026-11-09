"use client";

import { useId, type ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Form-row slider: caps label left, an exact-value field right, the slider
 * and its tick labels below. Used by the Cashflow wizard and Amortisation.
 * (The centred, display-style slider is domain/SliderField.)
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
