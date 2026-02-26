interface SliderProps {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

export default function Slider({ label, value, display, min, max, step, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="min-w-36 flex-1">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-white/20">{label}</span>
        <span className="text-xs font-medium tabular-nums text-indigo-300">{display}</span>
      </div>
      <div className="relative flex h-5 items-center">
        <div className="absolute inset-x-0 h-0.5 rounded-full bg-white/[0.06]" />
        <div
          className="absolute left-0 h-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400"
          style={{ width: `${pct}%` }}
        />
        <div
          className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-md"
          style={{ left: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 h-5 w-full cursor-pointer opacity-0"
        />
        <div
          className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
