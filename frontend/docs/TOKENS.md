# Token Reference

Source of truth: `src/app/globals.css` (`@theme {}` block) and `src/lib/theme.ts`.

## Surface lightness ramp

Elevation is expressed through progressively lighter surfaces, not shadows.

| Token | Value | Usage |
|---|---|---|
| `--color-surface-page` | `#08090a` | Outermost page background |
| `--color-background` | `#111215` | Card / main app surface |
| `--color-surface-raised` | `#17181c` | Table headers, card headers, summary-row top band |
| `--color-surface-hover` | `#1a1b1e` | Row hover |
| `--color-surface-active` | `#1c1d21` | Summary row, pressed states |

## Column group tints (unified tables)

Subtle column-band washes used on the Cashflow Summary unified table to group Outgoings and Cashflow columns without hard separator rules.

| Token | Value | Usage |
|---|---|---|
| `--color-out-tint` | `rgba(255,255,255,0.018)` | Outgoings cell default |
| `--color-out-tint-hover` | `rgba(255,255,255,0.038)` | Outgoings cell hover (when compounding) |
| `--color-out-tint-raised` | `rgba(255,255,255,0.025)` | Outgoings header / summary row |
| `--color-cf-wash` | `rgba(45,212,191,0.05)` | Cashflow cell default |
| `--color-cf-wash-hover` | `rgba(45,212,191,0.07)` | Cashflow cell hover |
| `--color-cf-wash-strong` | `rgba(45,212,191,0.08)` | Cashflow header / summary row |

Utility classes in `globals.css`:

```css
.out-zone { background: var(--color-out-tint); }
.cf-zone { background: var(--color-cf-wash); }
```

## Foreground ramp

| Token | Value | Usage |
|---|---|---|
| `--color-foreground` | `#f0fdfa` | Primary text, headers, values |
| `--color-muted` | `#f4f4f5` | Near-foreground variant |
| `--color-subtle` | `#a1a1aa` | Secondary text, labels |
| `--color-faint` | `#71717a` | Tertiary text, metadata |
| `--color-fg-table` | `#ccccd2` | Tabular data row text — softer than foreground so numbers breathe |

## Tool card defaults

| Token | Value | Usage |
|---|---|---|
| `--color-tool-default` | `#94a3b8` | Fallback tool card accent when no category assigned |
| `--color-tool-default-glow` | `rgba(148,163,184,0.08)` | Fallback tool card glow |
