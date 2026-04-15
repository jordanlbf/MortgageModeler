import { useCallback } from "react";
import { t, mix } from "@/lib/theme";
import { useEditableInput } from "@/hooks/useEditableInput";

interface CompactSliderProps {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  editable?: boolean;
  parseDisplay?: (display: string) => number;
  accent?: string;
}

export default function CompactSlider({
  label, value, display, min, max, step, onChange, editable = false, parseDisplay, accent = t.accent,
}: CompactSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

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

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[15px] text-muted/50">{label}</span>
        {editable ? (
          <input
            ref={inputRef}
            type="text"
            inputMode={editing ? "decimal" : "none"}
            value={editing ? draft : display}
            readOnly={!editing}
            onChange={handleChange}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            onClick={!editing ? startEditing : undefined}
            onFocus={startEditing}
            className={`w-[100px] bg-transparent text-right text-[15px] font-medium tabular-nums outline-none ${
              editing ? "text-foreground cursor-text" : "text-foreground cursor-text hover:brightness-125"
            }`}
            style={{ caretColor: accent }}
          />
        ) : (
          <span className="text-[15px] font-medium tabular-nums text-foreground">{display}</span>
        )}
      </div>
      <div className="relative flex h-4 items-center">
        <div className="absolute inset-x-0 h-[2px] rounded-full" style={{ background: t.border.default }} />
        <div
          className="absolute left-0 h-[2px] rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: mix(accent, 50) }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step="any"
          value={value}
          aria-label={label}
          aria-valuetext={display}
          onChange={(e) => {
            const raw = Number(e.target.value);
            const stepped = Math.round(raw / step) * step;
            onChange(stepped);
          }}
          className="relative z-10 h-4 w-full cursor-pointer opacity-0"
        />
        <div
          className="pointer-events-none absolute h-[10px] w-[10px] -translate-x-1/2 rounded-full border-[2px] transition-all duration-500"
          style={{ left: `${pct}%`, borderColor: mix(accent, 80), background: t.bg.sliderThumb }}
        />
      </div>
    </div>
  );
}
