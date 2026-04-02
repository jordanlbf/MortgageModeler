import { useCallback } from "react";
import { t, mix } from "@/lib/theme";
import { useEditableInput } from "@/hooks/useEditableInput";

interface SliderProps {
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

export default function Slider({
  label, value, display, min, max, step, onChange, editable = false, parseDisplay, accent = t.accent,
}: SliderProps) {
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

  const handleClick = () => {
    if (editable) startEditing();
  };

  return (
    <div>
      <div
        className="mb-1.5 text-[14px] font-medium uppercase tracking-widest text-center"
        style={{ color: mix(accent, 50) }}
      >
        {label}
      </div>

      <div
        className="mb-3 flex items-center justify-center"
        onClick={!editing ? handleClick : undefined}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode={editing ? "decimal" : "none"}
          value={editing ? draft : display}
          readOnly={!editing}
          onChange={handleChange}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          tabIndex={editable ? 0 : -1}
          onFocus={editable ? handleClick : undefined}
          style={{
            caretColor: accent,
            ["--slider-accent" as string]: accent,
          }}
          className={`w-full bg-transparent text-center text-[16px] font-normal leading-none tabular-nums outline-none transition-colors duration-150 ${
            editable
              ? editing
                ? "text-foreground cursor-text"
                : "text-foreground cursor-text hover:brightness-125"
              : "text-foreground"
          }`}
        />
      </div>

      <div className="relative flex h-4 items-center">
        <div className="absolute inset-x-0 h-[2px] rounded-full" style={{ background: t.border.default, boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)" }} />
        <div
          className="absolute left-0 h-[2px] rounded-full"
          style={{ width: `${pct}%`, background: mix(accent, 50) }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step="any"
          value={value}
          onChange={(e) => {
            const raw = Number(e.target.value);
            const stepped = Math.round(raw / step) * step;
            onChange(stepped);
          }}
          className="relative z-10 h-4 w-full cursor-pointer opacity-0"
        />
        <div
          className="pointer-events-none absolute h-[10px] w-[10px] -translate-x-1/2 rounded-full border-[2px]"
          style={{ left: `${pct}%`, borderColor: mix(accent, 80), background: t.bg.sliderThumb }}
        />
      </div>
    </div>
  );
}
