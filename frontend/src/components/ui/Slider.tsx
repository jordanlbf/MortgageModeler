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
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-100/25 text-center">
        {label}
      </div>
      <div className="mb-4 text-[18px] font-medium leading-none tabular-nums text-slate-100/45 text-center">
        {display}
      </div>
      <div className="relative flex h-4 items-center">
        <div className="absolute inset-x-0 h-[2px] rounded-full bg-slate-400/[0.12]" />
        <div
          className="absolute left-0 h-[2px] rounded-full bg-sky-400/50"
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
          className="pointer-events-none absolute h-[10px] w-[10px] -translate-x-1/2 rounded-full border-[2px] border-sky-400/80 bg-[#1e293b]"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
