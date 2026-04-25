"use client";

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        color: "var(--color-fg-tertiary)",
        padding: "0 2px",
      }}
    >
      <div
        style={{
          flex: 1,
          height: 3,
          background: "var(--color-surface-raised)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${s.pct}%`,
            background: s.color,
            borderRadius: 2,
            transition: "width 0.25s ease, background 0.25s ease",
          }}
        />
      </div>
      <span
        style={{
          whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums",
          minWidth: 54,
          textAlign: "right",
          color: s.color,
        }}
      >
        {s.label}
      </span>
    </div>
  );
}