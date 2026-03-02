import { t } from "@/lib/theme";

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
      <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-teal-400/50 text-center">
        {label}
      </div>
      <div className="mb-4 text-[18px] font-normal leading-none tabular-nums text-zinc-50 text-center">
        {display}
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
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
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
