// ── Theme: Graphite Teal ─────────────────────────────────────
// Single source of truth for all colour tokens.
//
// Usage:
//   import { t, SERIES } from "@/lib/theme";
//
// Inline styles pull from `t.*` directly.
// Tailwind classes use the same colour families documented below:
//   Accent:   teal-400  →  t.accent
//   Neutrals: zinc-*    →  t.bg.*, t.border.*
//   Negative: red-400   →  SERIES.int.color
//   Equity:   blue-400  →  SERIES.eq.color
// ──────────────────────────────────────────────────────────────

export const t = {
  // ── Backgrounds ──────────────────────────────────
  bg: {
    page: "#111215",
    card: "rgba(42,42,46,0.72)",
    cardElevated: "rgba(44,44,48,0.82)",
    control: "rgba(24,24,27,0.60)",
    sliderThumb: "#1a1c20",
  },

  // ── Accent ───────────────────────────────────────
  accent: "#2dd4bf",
  accentBorder: "rgba(45,212,191,0.35)",

  // ── Borders ──────────────────────────────────────
  border: {
    default: "rgba(113,113,122,0.08)",
  },

  // ── Chart chrome ─────────────────────────────────
  chart: {
    gridH: "rgba(148,163,184,0.06)",
    gridV: "rgba(148,163,184,0.035)",
    axisTick: "rgba(148,163,184,0.50)",
    axisTickMuted: "rgba(148,163,184,0.40)",
    axisLine: "rgba(148,163,184,0.08)",
    cursor: "rgba(148,163,184,0.15)",
    legendInactive: "rgba(148,163,184,0.30)",
    legendDotInactive: "rgba(148,163,184,0.20)",
  },

  // ── Tooltip ──────────────────────────────────────
  tooltip: {
    bg: "rgba(8,8,12,0.94)",
    shadow:
      "0 8px 32px -4px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(148,163,184,0.05)",
    border: "rgba(113,113,122,0.10)",
    divider: "rgba(113,113,122,0.08)",
  },

  // ── Scrollbar ────────────────────────────────────
  scrollbar: "rgba(148,163,184,0.12)",
} as const;

// ── Chart series ───────────────────────────────────
// Each series defines its colour, label, gradient fill
// opacities [top, bottom], and stroke width.

export const SERIES = {
  bal: { color: "#2dd4bf", label: "Balance",  fill: [0.18, 0.02], stroke: 2 },
  int: { color: "#f87171", label: "Interest", fill: [0.12, 0.01], stroke: 1 },
  eq:  { color: "#60a5fa", label: "Equity",   fill: [0.14, 0.01], stroke: 1.2 },
  lvr: { color: "#facc15", label: "LVR",      fill: [0.10, 0.01], stroke: 1.5 },
} as const;

// Convenience array for legend / toggle iteration
export const SERIES_LIST = Object.entries(SERIES).map(([key, s]) => ({
  key,
  color: s.color,
  label: s.label,
}));
