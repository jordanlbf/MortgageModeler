"use client";

import { useCallback } from "react";
import { t } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useEditableInput } from "@/hooks/useEditableInput";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface SliderFieldProps {
  label: string;
  value: number;
  /** Formatted value shown above the track (and used as aria-valuetext). */
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  /** Let the user click the value and type a new one. */
  editable?: boolean;
  /** Parses the typed text back to a number (required for `editable`). */
  parseDisplay?: (display: string) => number;
  /** Accent colour for label, range and thumb. Defaults to brand. */
  accent?: string;
}

/**
 * Labelled slider: centred uppercase label, centred click-to-edit value and a
 * shadcn `Slider` (variant `accent`). The accent colour is passed down as the
 * `--slider-accent` CSS custom property.
 */
export default function SliderField({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  editable = false,
  parseDisplay,
  accent = t.brand.default,
}: SliderFieldProps) {
  const clampedCommit = useCallback(
    (parsed: number) => onChange(Math.min(max, Math.max(min, parsed))),
    [onChange, min, max],
  );

  const parse = useCallback(
    (d: string) => (parseDisplay ? parseDisplay(d) : value),
    [parseDisplay, value],
  );

  const { editing, draft, inputRef, startEditing, commit, handleKeyDown, handleChange } =
    useEditableInput({ display, onCommit: clampedCommit, parse });

  const handleClick = () => {
    if (editable) startEditing();
  };

  return (
    <div style={{ ["--slider-accent" as string]: accent }}>
      <div className="mb-1.5 text-center text-[14px] font-medium tracking-widest uppercase text-[color:color-mix(in_srgb,var(--slider-accent)_50%,transparent)]">
        {label}
      </div>

      <div
        className="mb-3 flex items-center justify-center"
        onClick={!editing ? handleClick : undefined}
      >
        <Input
          ref={inputRef}
          variant="ghost"
          type="text"
          inputMode={editing ? "decimal" : "none"}
          value={editing ? draft : display}
          readOnly={!editing}
          onChange={handleChange}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          tabIndex={editable ? 0 : -1}
          onFocus={editable ? handleClick : undefined}
          className={cn(
            "w-full text-center text-[16px] leading-none font-normal text-fg-primary tabular-nums caret-[color:var(--slider-accent)] transition-colors duration-150",
            editable && "cursor-text",
            editable && !editing && "hover:brightness-125",
          )}
        />
      </div>

      <Slider
        variant="accent"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        thumbProps={{ "aria-label": label, "aria-valuetext": display }}
      />
    </div>
  );
}
