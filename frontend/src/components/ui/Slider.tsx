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
  variant?: "default" | "compact";
}

export default function Slider({
  label, value, display, min, max, step, onChange, editable = false, parseDisplay, accent = t.accent, variant = "default",
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const compact = variant === "compact";

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
      {compact ? (
        /* ── Compact: label left, value right ── */
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[15px] text-fg-primary/50">{label}</span>
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
                editing ? "text-fg-primary cursor-text" : "text-fg-primary cursor-text hover:brightness-125"
              }`}
              style={{ caretColor: accent }}
            />
          ) : (
            <span className="text-[15px] font-medium tabular-nums text-fg-primary">{display}</span>
          )}
        </div>
      ) : (
        /* ── Default: centered label + centered editable value ── */
        <>
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
                    ? "text-fg-primary cursor-text"
                    : "text-fg-primary cursor-text hover:brightness-125"
                  : "text-fg-primary"
              }`}
            />
          </div>
        </>
      )}

      <div className="relative flex h-4 items-center">
        <div
          className="absolute inset-x-0 h-[2px] rounded-full"
          style={{ background: t.border.default, ...(!compact && { boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)" }) }}
        />
        <div
          className={`absolute left-0 h-[2px] rounded-full${compact ? " transition-all duration-500" : ""}`}
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
          className={`pointer-events-none absolute h-[10px] w-[10px] -translate-x-1/2 rounded-full border-[2px]${compact ? " transition-all duration-500" : ""}`}
          style={{ left: `${pct}%`, borderColor: mix(accent, 80), background: t.bg.sliderThumb }}
        />
      </div>
    </div>
  );
}
