import { useState, useRef, useCallback } from "react";
import { t } from "@/lib/theme";

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
}

export default function Slider({
  label, value, display, min, max, step, onChange, editable = false, parseDisplay,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!editable || editing) return;
    setEditing(true);
    const seed = parseDisplay ? parseDisplay(display) : value;
    setDraft(seed.toLocaleString("en-AU", { maximumFractionDigits: 2 }));
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const commit = useCallback(() => {
    if (!editing) return;
    setEditing(false);
    const stripped = draft.replace(/[^0-9.\-]/g, "");
    const parsed = Number(stripped);
    if (!isNaN(parsed) && stripped.length > 0) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  }, [draft, min, max, onChange, editing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); inputRef.current?.blur(); }
    if (e.key === "Escape") { e.preventDefault(); setEditing(false); }
    const allowed = /^[0-9.,\-]$/.test(e.key) ||
      ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"].includes(e.key) ||
      e.metaKey || e.ctrlKey;
    if (!allowed) e.preventDefault();
  };

  return (
    <div>
      <div className="mb-1.5 text-[14px] font-medium uppercase tracking-[0.14em] text-teal-400/50 text-center">
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
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9.,-]/g, ""))}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          tabIndex={editable ? 0 : -1}
          onFocus={editable ? handleClick : undefined}
          className={`w-full bg-transparent text-center text-[16px] font-normal leading-none tabular-nums outline-none caret-teal-400 selection:bg-teal-400/20 selection:text-zinc-50 transition-colors duration-150 ${
            editable
              ? editing
                ? "text-zinc-50 cursor-text"
                : "text-zinc-50 cursor-text hover:text-teal-300"
              : "text-zinc-50"
          }`}
        />
      </div>

      <div className="relative flex h-4 items-center">
        <div className="absolute inset-x-0 h-[2px] rounded-full" style={{ background: t.border.default }} />
        <div
          className="absolute left-0 h-[2px] rounded-full"
          style={{ width: `${pct}%`, background: `${t.accent}80` }}
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
          style={{ left: `${pct}%`, borderColor: `${t.accent}cc`, background: t.bg.sliderThumb }}
        />
      </div>
    </div>
  );
}
