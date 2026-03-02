import type { Frequency } from "@/lib/types";
import { FREQ_OPTIONS } from "@/lib/constants";
import { t } from "@/lib/theme";

interface HeaderProps {
  frequency: Frequency;
  onFrequencyChange: (f: Frequency) => void;
}

export default function Header({ frequency, onFrequencyChange }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-9 py-4"
      style={{ borderBottom: `1px solid ${t.border.default}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold text-zinc-900"
          style={{ background: t.accent }}
        >
          M
        </div>
        <span className="text-[17px] font-semibold tracking-tight text-zinc-100/75">
          MortgageModeler
        </span>
      </div>

      <div
        className="flex rounded-lg p-[3px]"
        style={{ border: `1px solid ${t.border.default}`, background: t.bg.control }}
      >
        {FREQ_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onFrequencyChange(value)}
            className={`rounded-md px-4 py-1.5 text-[13px] font-semibold tracking-wide transition-all duration-200 ${
              frequency === value
                ? "bg-teal-400/[0.12] text-teal-400 border border-teal-400/20"
                : "text-zinc-100/25 border border-transparent hover:text-zinc-100/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
