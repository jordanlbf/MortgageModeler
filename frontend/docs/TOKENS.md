# Token Reference

Source of truth: `src/app/globals.css` (`@theme {}` block) and `src/lib/theme.ts`.

The v2 token system uses role-based naming so brand identity, tabular data
semantics, and UI status feedback stay structurally distinct. Opacity-based
variants on the brand colour are avoided — instead, explicit pre-mixed tokens
(`--color-brand-subtle`, `--color-status-*-bg`, etc.) give consistent
appearance across all surfaces.

## Brand

The single identity colour for MortgageModeler. Used for selection, active
tabs, column-group accent bars, and hero labels. **Never** used for semantic
meaning (positive/negative/warning), large fills, or decorative areas.

| Token | Value | Usage | Tailwind |
|---|---|---|---|
| `--color-brand` | `#2dd4bf` | Identity colour | `text-brand`, `bg-brand`, `border-brand`, `ring-brand` |
| `--color-brand-contrast` | `#0a1a18` | Text on brand fills | — |
| `--color-brand-hover` | `#3de0cc` | Hover on brand fills | — |
| `--color-brand-subtle` | `#0f2320` | Pre-mixed low-intensity brand wash (on `--color-surface-app`) | — |
| `--color-brand-subtle-hover` | `#143330` | Hover variant of the wash | — |
| `--color-brand-border` | `rgba(45, 212, 191, 0.32)` | Brand-tinted card borders, accent underlines | — |

## Surface ramp

Elevation is expressed through progressively lighter surfaces, not shadows.
Each tier is ~6–10 hex points apart so the step is perceptible.

| Token | Value | Usage | Tailwind |
|---|---|---|---|
| `--color-surface-page` | `#08090a` | Outermost page background | `bg-surface-page` |
| `--color-surface-app` | `#111215` | Main app content surface | `bg-surface-app` |
| `--color-surface-raised` | `#1a1c20` | Cards, table headers, summary-row top band | `bg-surface-raised` |
| `--color-surface-hover` | `#22252a` | Interactive row hover feedback | `bg-surface-hover` |
| `--color-surface-active` | `#2a2d33` | Selected rows, pressed states | `bg-surface-active` |
| `--color-surface-overlay` | `rgba(8, 9, 10, 0.72)` | Modal / dialog scrim | — |

## Foreground ramp

Unified mint-tinted family — all text colours share the same chromatic family
so they cohere.

| Token | Value | Usage | Tailwind |
|---|---|---|---|
| `--color-fg-primary` | `#f0fdfa` | Headers, hero values, primary text | `text-fg-primary` |
| `--color-fg-secondary` | `#aec4bf` | Labels, secondary UI text | `text-fg-secondary` |
| `--color-fg-tertiary` | `#6e7e7a` | Metadata, axes, inactive UI | `text-fg-tertiary` |
| `--color-fg-disabled` | `#3f4845` | Disabled state | — |

## Data ink

Dedicated tokens for tabular numeric content. Separate from UI `fg-*` so table
numbers can tune independently.

| Token | Value | Usage | Tailwind |
|---|---|---|---|
| `--color-data-primary` | `#c5d4cf` | Default tabular numbers | `text-data-primary` |
| `--color-data-emphasis` | `#f0fdfa` | Headline / total values | — |
| `--color-data-muted` | `#8ba19c` | YoY percentages, secondary data | — |

## Data semantic

Meaning in tabular / chart context. Calm, desaturated colours that sit
on-screen indefinitely without pulling the eye.

| Token | Value | Usage | Tailwind |
|---|---|---|---|
| `--color-data-positive` | `#2fb881` | Gains, up-movement — chromatically distant from `--color-brand` | `text-data-positive` |
| `--color-data-negative` | `#d45555` | Losses, down-movement | `text-data-negative` |
| `--color-data-warning` | `#d99a28` | Caution, threshold values | `text-data-warning` |
| `--color-data-neutral` | `var(--color-fg-tertiary)` | Zero, neutral rows | — |

## Status semantic

UI feedback for toasts, validation, and banners. Slightly brighter than data
semantics because status surfaces flash briefly. Kept as separate tokens so
they can diverge from data colours.

| Token | Value | Usage |
|---|---|---|
| `--color-status-success` | `#3fc77a` | Success toast / banner text |
| `--color-status-error` | `#e56565` | Error validation, destructive confirmations |
| `--color-status-warning` | `#e5a832` | Warning banners |
| `--color-status-info` | `var(--color-brand)` | Info banners |
| `--color-status-success-bg` | `rgba(63, 199, 122, 0.10)` | Success banner background |
| `--color-status-error-bg` | `rgba(229, 101, 101, 0.10)` | Error banner background |
| `--color-status-warning-bg` | `rgba(229, 168, 50, 0.10)` | Warning banner background |

## Borders

Mint-tinted family so borders cohere with the foreground ramp.

| Token | Value | Usage | Tailwind |
|---|---|---|---|
| `--color-border-subtle` | `rgba(174, 196, 191, 0.08)` | Default panels, dividers | `border-subtle` |
| `--color-border-default` | `rgba(174, 196, 191, 0.14)` | Cards, tables, form inputs | `border-default` |
| `--color-border-strong` | `rgba(174, 196, 191, 0.22)` | Hover, focus, emphasised edges | `border-strong` |
| `--color-border-brand` | `var(--color-brand-border)` | Brand-accented borders | `border-brand` |

## Focus

Explicit a11y-critical tokens. Every focusable element must show a visible
ring in brand colour.

| Token | Value | Usage |
|---|---|---|
| `--color-focus-ring` | `rgba(45, 212, 191, 0.35)` | Box-shadow ring on form inputs, toggles, buttons |
| `--color-focus-ring-offset` | `var(--color-surface-app)` | Ring offset colour for outline rings |

## Elevation

Three named shadows. No ad-hoc drop shadows in components.

| Token | Value | Usage |
|---|---|---|
| `--shadow-flat` | `0 0 0 0.5px rgba(255,255,255,0.02)` | Subtle outline on flat surfaces |
| `--shadow-raised` | `0 1px 3px rgba(0,0,0,0.24), 0 0 0 0.5px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.02)` | Default card shadow |
| `--shadow-float` | `0 8px 24px rgba(0,0,0,0.40), 0 0 0 0.5px rgba(174,196,191,0.08), inset 0 1px 0 rgba(255,255,255,0.03)` | Hover / lifted card |

## Column group washes (cashflow)

Subtle column-band washes used on the Cashflow Summary unified table to
group Outgoings and Cashflow columns without hard separator rules.

| Token | Value | Usage |
|---|---|---|
| `--color-out-tint` | `rgba(174, 196, 191, 0.022)` | Outgoings cell default |
| `--color-out-tint-hover` | `rgba(174, 196, 191, 0.040)` | Outgoings cell hover |
| `--color-out-tint-raised` | `rgba(174, 196, 191, 0.028)` | Outgoings header / summary row |
| `--color-cf-wash` | `rgba(45, 212, 191, 0.05)` | Cashflow cell default |
| `--color-cf-wash-hover` | `rgba(45, 212, 191, 0.07)` | Cashflow cell hover |
| `--color-cf-wash-strong` | `rgba(45, 212, 191, 0.08)` | Cashflow header / summary row |

Utility classes in `globals.css`:

```css
.out-zone { background: var(--color-out-tint); }
.cf-zone { background: var(--color-cf-wash); }
```

## Chart chrome

| Token | Value | Usage |
|---|---|---|
| `--color-chart-grid-h` | `rgba(174, 196, 191, 0.06)` | Horizontal grid lines |
| `--color-chart-grid-v` | `rgba(174, 196, 191, 0.035)` | Vertical grid lines |
| `--color-chart-axis` | `rgba(174, 196, 191, 0.50)` | Axis tick labels |
| `--color-chart-axis-muted` | `rgba(174, 196, 191, 0.40)` | Secondary axis ticks |
| `--color-chart-axis-line` | `rgba(174, 196, 191, 0.08)` | Axis lines |
| `--color-chart-cursor` | `rgba(174, 196, 191, 0.15)` | Hover cursor |
| `--color-chart-bar-default` | `var(--color-surface-active)` | Default bar fill — calm, not attention-grabbing |
| `--color-chart-bar-selected` | `var(--color-brand)` | Selected / focused bar |
| `--color-chart-bar-hover` | `var(--color-surface-hover)` | Hovered bar |
| `--color-chart-legend-inactive` | `rgba(174, 196, 191, 0.30)` | Inactive legend text |
| `--color-chart-legend-dot-inactive` | `rgba(174, 196, 191, 0.20)` | Inactive legend dot |

## Tool card defaults

| Token | Value | Usage |
|---|---|---|
| `--color-tool-default` | `#94a3b8` | Fallback tool card accent when no category assigned |
| `--color-tool-default-glow` | `rgba(148, 163, 184, 0.08)` | Fallback tool card glow |

## Scrollbar

| Token | Value | Usage |
|---|---|---|
| `--color-scrollbar` | `rgba(174, 196, 191, 0.12)` | `.custom-scrollbar` webkit thumb |

## Layout

| Token | Value | Usage |
|---|---|---|
| `--layout-sidebar-width` | `240px` | Fixed sidebar width |
| `--layout-content-max` | `1200px` | Maximum width for main content area |
| `--layout-page-padding-x` | `36px` | Horizontal page padding |
| `--layout-page-padding-y` | `32px` | Vertical page padding |
| `--layout-nav-item-height` | `36px` | Sidebar nav item row height |
| `--layout-global-btn-size` | `34px` | Globals tray icon button size |
| `--layout-header-actions-reserve` | `64px` | Right-padding reservation on page headers to avoid overlap with the floating globals tray. Update when the tray's width changes. |
