// ── Theme: Graphite Teal ─────────────────────────────────────
// Single source of truth for all colour tokens.
//
// Usage:
//   import { t, SERIES, mix } from "@/lib/theme";
//
// Themeable values use CSS custom properties (defined in globals.css).
// Tailwind classes use the same tokens: text-accent, bg-card, etc.
// SERIES colors, chart chrome, and tooltip stay as hex (single-file usage).
// ──────────────────────────────────────────────────────────────

/** `color-mix(in srgb, <color> <pct>%, transparent)` — use for opacity variants */
export const mix = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export const t = {
  // ── Backgrounds ──────────────────────────────────
  bg: {
    page: "var(--color-background)",
    card: "var(--color-card)",
    cardElevated: "var(--color-card-elevated)",
    control: "var(--color-control)",
    sliderThumb: "var(--color-slider-thumb)",
  },

  // ── Text ──────────────────────────────────────────
  fg: "var(--color-foreground)",
  muted: "var(--color-muted)",
  subtle: "var(--color-subtle)",
  faint: "var(--color-faint)",

  // ── Accent ───────────────────────────────────────
  accent: "var(--color-accent)",
  accentBorder: "var(--color-accent-border)",

  // ── Borders ──────────────────────────────────────
  border: {
    default: "var(--color-border)",
    hover: "var(--color-border-hover)",
  },

  // ── Chart chrome ─────────────────────────────────
  chart: {
    gridH: "var(--color-chart-grid-h)",
    gridV: "var(--color-chart-grid-v)",
    axisTick: "var(--color-chart-axis)",
    axisTickMuted: "var(--color-chart-axis-muted)",
    axisLine: "var(--color-chart-axis-line)",
    cursor: "var(--color-chart-cursor)",
    legendInactive: "var(--color-chart-legend-inactive)",
    legendDotInactive: "var(--color-chart-legend-dot-inactive)",
  },

  // ── Tooltip ──────────────────────────────────────
  tooltip: {
    bg: "rgba(8,8,12,0.94)",
    shadow:
      "0 8px 32px -4px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(148,163,184,0.05)",
    border: "rgba(113,113,122,0.10)",
    divider: "rgba(113,113,122,0.08)",
  },
} as const;

// ── Chart series ───────────────────────────────────
// Each series defines its colour, label, gradient fill
// opacities [top, bottom], and stroke width.

export const SERIES = {
  bal:  { color: "#2dd4bf", label: "Balance",    fill: [0.18, 0.02], stroke: 2 },
  int:  { color: "#f87171", label: "Interest",   fill: [0.12, 0.01], stroke: 1 },
  eq:   { color: "#60a5fa", label: "Equity",     fill: [0.14, 0.01], stroke: 1.2 },
  paid: { color: "#a78bfa", label: "Total Paid", fill: [0.10, 0.01], stroke: 1.5 },
  lvr:  { color: "#fb923c", label: "LVR",        fill: [0.10, 0.01], stroke: 1.5 },
  offset: { color: "#facc15", label: "Offset", fill: [0.12, 0.01], stroke: 1.5 },
} as const;

// Convenience array for legend / toggle iteration
export const SERIES_LIST = Object.entries(SERIES).map(([key, s]) => ({
  key,
  color: s.color,
  label: s.label,
}));
