import { t } from "@/lib/theme";

interface SegmentedToggleProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}

const SIZES = {
  sm: {
    container: "rounded-md p-[2px]",
    button: "rounded px-3 py-1 text-[10px]",
  },
  md: {
    container: "rounded-lg p-[3px]",
    button: "rounded-md px-3.5 py-1.5 text-[16px]",
  },
};

export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  size = "sm",
}: SegmentedToggleProps<T>) {
  const s = SIZES[size];
  return (
    <div
      className={`flex ${s.container}`}
      style={{ border: `1px solid ${t.border.default}`, background: t.bg.control }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`${s.button} font-semibold tracking-wide transition-all duration-200 ${
            value === opt.value
              ? "bg-accent/[0.12] text-accent border border-accent/20"
              : "text-muted/25 border border-transparent hover:text-muted/40"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
