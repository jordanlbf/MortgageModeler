"use client";

import { Progress } from "@/components/ui/progress";

interface Props {
  value: string;
}

type Strength = {
  score: number;
  label: string;
  color: string;
  pct: number;
};

function calcStrength(v: string): Strength {
  if (v.length === 0) {
    return { score: 0, label: "8+ chars", color: "var(--color-fg-tertiary)", pct: 0 };
  }

  let score = 0;
  if (v.length >= 8) score++;
  if (v.length >= 12) score++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;

  const pct = Math.min(100, (score / 5) * 100);

  if (score <= 2) return { score, label: "Weak", color: "#ef4444", pct };
  if (score <= 3) return { score, label: "Okay", color: "#f59e0b", pct };
  return { score, label: "Strong", color: "var(--color-brand)", pct };
}

export default function PasswordStrength({ value }: Props) {
  const s = calcStrength(value);

  return (
    <div className="flex items-center gap-2 px-0.5 text-[11px] text-fg-tertiary">
      <Progress
        variant="meter"
        value={s.pct}
        aria-label="Password strength"
        aria-valuetext={s.label}
        className="flex-1"
        style={{ "--progress-accent": s.color } as React.CSSProperties}
      />
      <span
        className="min-w-[54px] whitespace-nowrap text-right tabular-nums"
        style={{ color: s.color }}
      >
        {s.label}
      </span>
    </div>
  );
}
