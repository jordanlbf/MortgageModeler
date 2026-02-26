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
    <div>
      {/* Label */}
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/20">
        {label}
      </div>

      {/* Value */}
      <div className="mb-3 text-[18px] font-medium leading-none tabular-nums text-white/80">
        {display}
      </div>

      {/* Track */}
      <div className="relative flex h-4 items-center">
        <div className="absolute inset-x-0 h-[2px] rounded-full bg-white/[0.06]" />
        <div
          className="absolute left-0 h-[2px] rounded-full bg-indigo-400/50"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 h-4 w-full cursor-pointer opacity-0"
        />
        <div
          className="pointer-events-none absolute h-[10px] w-[10px] -translate-x-1/2 rounded-full border-[2px] border-indigo-400/70 bg-[#0c0c16]"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
