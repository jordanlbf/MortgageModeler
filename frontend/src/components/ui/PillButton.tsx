"use client";

import { mix } from "@/lib/theme";

interface Props {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}

export default function PillButton({ active, color, onClick, children }: Props) {
  const accent = color ?? "var(--color-brand)";
  return (
    <button
      type="button"
      className="h-[26px] px-2.5 rounded-full border text-[14px] font-semibold cursor-pointer whitespace-nowrap outline-none leading-none transition-all duration-150 min-w-[72px] text-center justify-center"
      style={active ? {
        background: mix(accent, 14),
        color: accent,
        borderColor: mix(accent, 25),
        boxShadow: `0 0 8px ${mix(accent, 10)}`,
      } : {
        background: "transparent",
        color: mix("var(--color-fg-primary)", 50),
        borderColor: "rgba(255,255,255,0.07)",
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
