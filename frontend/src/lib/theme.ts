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
    page: "var(--color-surface-page)",
    card: "var(--color-card)",
    cardElevated: "var(--color-card-elevated)",
    raised: "var(--color-surface-raised)",
    hover: "var(--color-surface-hover)",
    active: "var(--color-surface-active)",
    control: "var(--color-control)",
    sliderThumb: "var(--color-slider-thumb)",
  },

  // ── Text ──────────────────────────────────────────
  fg: "var(--color-foreground)",
  muted: "var(--color-muted)",
  subtle: "var(--color-subtle)",
  faint: "var(--color-faint)",
  fgTable: "var(--color-fg-table)",

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

// ── Cashflow chart palette ────────────────────────
export const CF_COLORS = {
  positive:     "#4ade80",
  positiveDark: "#16a34a",
  positiveLit:  "#86efac",
  teal:         "#2dd4bf",
  tealDark:     "#0d9488",
  tealLit:      "#5eead4",
  negative:     "#ef4444",
  negativeDark: "#dc2626",
  negativeLit:  "#f87171",
  amber:        "#f59e0b",
  amberLit:     "#fcd34d",
  purple:       "#a78bfa",
  purpleLit:    "#c4b5fd",
  axisTick:     "#71717a",
} as const;

// ── Tax breakdown palette ─────────────────────────
export const TAX_COLORS = {
  incomeTax:  "#f87171",
  medicare:   "#60a5fa",
  mls:        "#fb923c",
  hecs:       "#a78bfa",
  netIncome:  "#2dd4bf",
} as const;

// ── Tax input category tints ──────────────────────
// One colour per Advanced tax input section (income / deductions / adjustments).
// Used for tab backgrounds, status dots, and group accents.
export const TAX_CATEGORY_COLORS = {
  income:      "#6b9fcc",
  deductions:  "#c97070",
  adjustments: "#bfa75a",
} as const;

// ── Tax bracket severity ladder ───────────────────
// Five-tier ramp for marginal-rate KPI tiles. Mixes semantic tokens
// (zero/medium/top use --color-positive/--color-warning/--color-negative)
// with literals for the in-between green and amber tiers.
export const TAX_BRACKET_COLORS = {
  zero:   "var(--color-positive)",
  low:    "#86efac",
  medium: "var(--color-warning)",
  high:   "#f59e0b",
  top:    "#ef4444",
} as const;

// ── LVR severity thresholds ───────────────────────
export const LVR_COLORS = {
  safe:     "var(--color-positive)",
  moderate: "var(--color-warning)",
  high:     "var(--color-negative)",
} as const;

// ── Depreciation series colour ────────────────────
export const DEPRECIATION_COLOR = "#a78bfa";

// ── Australian state / federal grant palette ─────
// Scoped to the Government Grants feature — each jurisdiction has its own
// recognition colour. Not part of the general design vocabulary.
export const STATE_COLORS = {
  FEDERAL: "#A78BFA",
  NSW:     "#6BB5E8",
  VIC:     "#5B8DBE",
  QLD:     "#C06080",
  WA:      "#D4A843",
  SA:      "#E06060",
  TAS:     "#4AAF82",
  ACT:     "#6A9FD8",
  NT:      "#D87A58",
} as const;

// Convenience array for legend / toggle iteration
export const SERIES_LIST = Object.entries(SERIES).map(([key, s]) => ({
  key,
  color: s.color,
  label: s.label,
}));
