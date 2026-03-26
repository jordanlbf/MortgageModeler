import { mix } from "@/lib/theme";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: string;
  reverse?: boolean;
}

function ToggleButton({ checked, onClick, accent = "var(--color-accent)" }: { checked: boolean; onClick: () => void; accent?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onClick}
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
  );
}

export default function Toggle({ label, checked, onChange, accent = "var(--color-accent)", reverse = false }: ToggleProps) {
  const labelSpan = (
    <span
      className="text-[15px] font-medium transition-colors duration-200"
      style={{ color: checked ? "var(--color-foreground)" : mix("var(--color-muted)", 50) }}
    >
      {label}
    </span>
  );

  const toggle = <ToggleButton checked={checked} onClick={() => onChange(!checked)} accent={accent} />;

  if (reverse) {
    return (
      <label className="flex w-full cursor-pointer items-center justify-between select-none">
        {labelSpan}
        {toggle}
      </label>
    );
  }

  return (
    <label className="flex cursor-pointer items-center gap-2.5 select-none">
      {toggle}
      {labelSpan}
    </label>
  );
}
