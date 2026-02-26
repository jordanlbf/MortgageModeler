import type { Frequency } from "@/lib/engine";

interface LoanControlsProps {
  principal: number;
  setPrincipal: (v: number) => void;
  rate: number;
  setRate: (v: number) => void;
  years: number;
  setYears: (v: number) => void;
  frequency: Frequency;
  setFrequency: (v: Frequency) => void;
}

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
];

export default function LoanControls({
  principal, setPrincipal,
  rate, setRate,
  years, setYears,
  frequency, setFrequency,
}: LoanControlsProps) {
  const sliders = [
    { label: "Loan amount", value: principal, setter: setPrincipal, min: 100000, max: 2000000, step: 10000, display: `$${(principal / 1000).toFixed(0)}k` },
    { label: "Interest rate", value: rate, setter: setRate, min: 2, max: 12, step: 0.1, display: `${rate.toFixed(1)}%` },
    { label: "Loan term", value: years, setter: setYears, min: 5, max: 30, step: 1, display: `${years} years` },
  ];

  return (
    <div className="flex flex-wrap gap-7">
      {sliders.map(({ label, value, setter, min, max, step, display }) => (
        <div key={label} className="min-w-40 flex-1">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">{label}</span>
            <span className="text-xs font-medium tabular-nums text-indigo-300">{display}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => setter(Number(e.target.value))}
            className="slider w-full"
          />
        </div>
      ))}
      <div className="min-w-44">
        <span className="mb-2.5 block text-[10px] font-medium uppercase tracking-wider text-white/25">Frequency</span>
        <div className="flex gap-0.5 rounded-lg bg-white/[0.04] p-0.5">
          {FREQ_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFrequency(value)}
              className={`flex-1 rounded-md px-3.5 py-1.5 text-[11px] font-medium transition-all ${
                frequency === value
                  ? "bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 text-indigo-300"
                  : "text-white/30 hover:text-white/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
