import { mix } from "@/lib/theme";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: string;
}

export default function Toggle({ label, checked, onChange, accent = "var(--color-accent)" }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 select-none">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative h-[20px] w-[36px] shrink-0 rounded-full transition-colors duration-200"
        style={{
          background: checked ? mix(accent, 40) : "rgba(255,255,255,0.08)",
        }}
      >
        <span
          className="absolute top-[3px] left-[3px] h-[14px] w-[14px] rounded-full transition-all duration-200"
          style={{
            transform: checked ? "translateX(16px)" : "translateX(0)",
            background: checked ? accent : "rgba(255,255,255,0.3)",
          }}
        />
      </button>
      <span
        className="text-[12px] font-medium transition-colors duration-200"
        style={{ color: checked ? "var(--color-foreground)" : mix("var(--color-muted)", 50) }}
      >
        {label}
      </span>
    </label>
  );
}
