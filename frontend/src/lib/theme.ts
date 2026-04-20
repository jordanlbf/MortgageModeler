// ── Theme: Graphite Teal ─────────────────────────────────────
// Single source of truth for all colour tokens.
//
// Usage:
//   import { t, SERIES, mix } from "@/lib/theme";
//
// Themeable values use CSS custom properties (defined in globals.css).
// SERIES colors, chart chrome, and tooltip stay as hex (single-file usage).
// ──────────────────────────────────────────────────────────────

/** `color-mix(in srgb, <color> <pct>%, transparent)` — use for opacity variants */
export const mix = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export const t = {
  brand: {
    default:     "var(--color-brand)",
    contrast:    "var(--color-brand-contrast)",
    hover:       "var(--color-brand-hover)",
    subtle:      "var(--color-brand-subtle)",
    subtleHover: "var(--color-brand-subtle-hover)",
    border:      "var(--color-brand-border)",
  },

  surface: {
    page:    "var(--color-surface-page)",
    app:     "var(--color-surface-app)",
    raised:  "var(--color-surface-raised)",
    hover:   "var(--color-surface-hover)",
    active:  "var(--color-surface-active)",
    overlay: "var(--color-surface-overlay)",
  },

  fg: {
    primary:   "var(--color-fg-primary)",
    secondary: "var(--color-fg-secondary)",
    tertiary:  "var(--color-fg-tertiary)",
    disabled:  "var(--color-fg-disabled)",
  },

  data: {
    primary:  "var(--color-data-primary)",
    emphasis: "var(--color-data-emphasis)",
    muted:    "var(--color-data-muted)",
    positive: "var(--color-data-positive)",
    negative: "var(--color-data-negative)",
    warning:  "var(--color-data-warning)",
    neutral:  "var(--color-data-neutral)",
  },

  status: {
    success:   "var(--color-status-success)",
    error:     "var(--color-status-error)",
    warning:   "var(--color-status-warning)",
    info:      "var(--color-status-info)",
    successBg: "var(--color-status-success-bg)",
    errorBg:   "var(--color-status-error-bg)",
    warningBg: "var(--color-status-warning-bg)",
  },

  border: {
    subtle:  "var(--color-border-subtle)",
    default: "var(--color-border-default)",
    strong:  "var(--color-border-strong)",
    brand:   "var(--color-border-brand)",
  },

  focus: {
    ring:       "var(--color-focus-ring)",
    ringOffset: "var(--color-focus-ring-offset)",
  },

  elevation: {
    flat:   "var(--shadow-flat)",
    raised: "var(--shadow-raised)",
    float:  "var(--shadow-float)",
  },

  chart: {
    gridH:             "var(--color-chart-grid-h)",
    gridV:             "var(--color-chart-grid-v)",
    axisTick:          "var(--color-chart-axis)",
    axisTickMuted:     "var(--color-chart-axis-muted)",
    axisLine:          "var(--color-chart-axis-line)",
    cursor:            "var(--color-chart-cursor)",
    barDefault:        "var(--color-chart-bar-default)",
    barSelected:       "var(--color-chart-bar-selected)",
    barHover:          "var(--color-chart-bar-hover)",
    legendInactive:    "var(--color-chart-legend-inactive)",
    legendDotInactive: "var(--color-chart-legend-dot-inactive)",
  },

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
// (zero/medium/top use --color-data-*) with literals for the in-between
// green and amber tiers.
export const TAX_BRACKET_COLORS = {
  zero:   "var(--color-data-positive)",
  low:    "#86efac",
  medium: "var(--color-data-warning)",
  high:   "#f59e0b",
  top:    "#ef4444",
} as const;

// ── LVR severity thresholds ───────────────────────
export const LVR_COLORS = {
  safe:     "var(--color-data-positive)",
  moderate: "var(--color-data-warning)",
  high:     "var(--color-data-negative)",
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
