# MortgageModeler Design System

## Personality

A sharp, dark instrument for modelling property decisions with precision.

**Visual reference:** dark dashboards, warm dark grey backgrounds, barely-raised cards with subtle borders, teal accent used surgically, generous internal padding, typography-driven hierarchy. Not Bloomberg dense, not consumer playful. Clean, calm, precise.

**Target users:** First home buyers through to multi-property investors. Approachable for someone modelling their first purchase, capable enough for someone comparing five scenarios.

## Principles

1. **Numbers are the product.** Dollar amounts, percentages, and rates get the best typography and the most visual weight. Every number uses tabular-nums. Alignment matters.
2. **Show the answer first.** Hero the result. Let the user drill into detail on demand.
3. **Quiet until needed.** Controls are muted until interacted with. Detail is hidden until expanded. Labels are small and low-contrast. The interface recedes; the data advances.
4. **Precision over decoration.** No rounded or approximate displays. No decorative gradients. No colour used purely for aesthetics.
5. **Structure before style.** Layout and hierarchy are established in greyscale. Colour reinforces hierarchy that already works without it.
6. **Restraint before decoration.** Start with too much whitespace, then tighten. Start with fewer elements, then add.

## Visual DNA

### Backgrounds
- Page: warm dark grey (#111215). Not pure black.
- Cards: 1-2 steps lighter (~#1a1e23 to #2a2a2e at low opacity). Boundary from subtle border (1px, low-opacity), not dramatic shadows.

### Accent
- Teal (#2dd4bf) used surgically: hero numbers, active toggle states, section labels, active pills.
- Never for large fills, card backgrounds, or decorative areas.
- Arctic theme (#38bdf8) follows the same restraint — same placements, different hue.

### Typography
- Sora — geometric, modern, good tabular-nums.
- Two weights: `font-normal` (400) and `font-semibold` (600).
- `font-bold` (700) reserved for hero numbers only.
- Hierarchy built entirely with size + weight. Colour reinforces, doesn't create.

### Surface lightness

Elevation is communicated through progressively lighter surfaces, never shadows.

| Token | Hex | Usage |
|---|---|---|
| `--color-surface-page` | `#08090a` | Outermost page background |
| `--color-background` | `#111215` | Card / main app surface (unchanged) |
| `--color-surface-raised` | `#17181c` | Elevated zones: table headers, card headers |
| `--color-surface-hover` | `#1a1b1e` | Interactive row hover feedback |
| `--color-surface-active` | `#1c1d21` | Summary rows, anchors, pressed states |

Each step is ~4–6 hex points lighter. This follows the approach used by Linear and Stripe Dashboard.

### Cards
- Barely raised. Transparent overlay on page, not opaque surface.
- Border: 1px, low-opacity (~8% white or accent-tinted).
- Internal padding: `p-6` (24px) to `p-8` (32px). Density from multiple cards, not packed content.
- Border-radius: `rounded-xl` (12px) to `rounded-2xl` (16px).

### Spacing
- Generous by default. `gap-5` to `gap-7` (20-28px) between sections. `gap-3` to `gap-4` (12-16px) between rows.
- Adjacent values differ by ~25% minimum.

### Interaction
- Hover: translateY -1 to -2px with deeper shadow.
- Active toggles: accent glow (low-opacity box-shadow).
- Transitions: `duration-150` to `duration-200` ease for colour/opacity. `duration-300` cubic-bezier for transform.
- Focus rings: ring-2 to ring-3, accent at 10-25% opacity.

### Shadows
- Rest: `shadow-sm` — `0 1px 4px rgba(0,0,0,0.20)`.
- Hover: `shadow-md` — `0 4px 16px rgba(0,0,0,0.35)`.
- No dramatic drop shadows. Mostly flat, depth from layering.

---

## Scales

All values use Tailwind's native scales. No custom overrides. The design system defines *which* values to use, not new values.

### Type Scale

| Role | Tailwind | Size | Weight |
|---|---|---|---|
| Tiny labels (section headers, field labels) | `text-xs` | 12px | `font-semibold` |
| Detail text, descriptions, bullet items | `text-sm` | 14px | `font-normal` |
| Body text, inputs, values | `text-base` | 16px | `font-normal` or `font-semibold` |
| Section headers, card titles | `text-lg` | 18px | `font-semibold` |
| KPI values, large labels | `text-xl` | 20px | `font-semibold` |
| Prominent values | `text-2xl` | 24px | `font-semibold` |
| Page titles | `text-4xl` | 36px | `font-semibold` |
| Hero numbers | `text-[56px]` | 56px | `font-bold` |

Hero number is the only arbitrary value — 56px has no Tailwind equivalent. Use `text-[56px]` or define as `--text-hero` in `@theme`.

### Spacing Scale

Use Tailwind's native spacing directly. No custom tokens needed.

| Tailwind | Value | Common use |
|---|---|---|
| `1` | 4px | Tight gaps (pill internal, toggle thumb offset) |
| `1.5` | 6px | Label-to-input gap |
| `2` | 8px | Row gaps, small padding |
| `3` | 12px | Row gaps within cards, divider margins |
| `4` | 16px | Standard gap between elements |
| `5` | 20px | Section gaps within cards |
| `6` | 24px | Card internal padding (small) |
| `7` | 28px | Card horizontal padding |
| `8` | 32px | Card internal padding (large), section gaps |
| `9` | 36px | Page horizontal padding |
| `10` | 40px | Large section gaps |
| `12` | 48px | Hero spacing |
| `16` | 64px | Loan summary metric gaps |

### Border Radius

| Tailwind | Value | Use |
|---|---|---|
| `rounded-lg` | 8px | Inputs, selects, small pills |
| `rounded-xl` | 12px | Inner panels, fact boxes |
| `rounded-2xl` | 16px | Cards, main containers |
| `rounded-full` | 9999px | Round pills, toggle tracks |

### Shadows

Defined as CSS custom properties (Tailwind's defaults don't match our dark theme needs).

| Token | Value | Use |
|---|---|---|
| Card rest | `0 1px 4px rgba(0,0,0,0.20)` | Default card shadow |
| Card hover | `0 4px 16px rgba(0,0,0,0.35)` | Hovered/lifted card |
| Glow (accent) | `0 0 8px color-mix(in srgb, var(--color-accent) 40%, transparent)` | Active toggle thumb |

### Colour Tokens

Defined as CSS custom properties in `globals.css` via `@theme`. Two themes remap the same semantic tokens.

**Semantic tokens (used in code):**

| Token | Graphite Teal | Slate Arctic |
|---|---|---|
| `--color-background` | #111215 | #0e1117 |
| `--color-foreground` | #f0fdfa | #f0f9ff |
| `--color-accent` | #2dd4bf | #38bdf8 |
| `--color-accent-contrast` | #18181b | #0c1825 |
| `--color-accent-border` | rgba(45,212,191,0.35) | rgba(56,189,248,0.30) |
| `--color-muted` | #f4f4f5 | *(shared)* |
| `--color-subtle` | #a1a1aa | *(shared)* |
| `--color-faint` | #71717a | *(shared)* |
| `--color-card` | rgba(42,42,46,0.72) | *(shared)* |
| `--color-card-elevated` | rgba(44,44,48,0.82) | *(shared)* |
| `--color-border` | rgba(113,113,122,0.08) | *(shared)* |

**Accent usage (surgical — same placements both themes):**
- Hero numbers: `color: var(--color-accent)`
- Section labels: `color-mix(in srgb, var(--color-accent) 60%, transparent)`
- Active toggles: `background: color-mix(in srgb, var(--color-accent) 35%, transparent)`
- Active pills: `background: color-mix(in srgb, var(--color-accent) 14%, transparent)`
- Focus rings: `box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent)`
- Card borders (accent-tinted): `border-color: color-mix(in srgb, var(--color-accent) 15%, transparent)`

**Series colours (charts only):**

| Series | Colour |
|---|---|
| Balance | #2dd4bf |
| Interest | #f87171 |
| Equity | #60a5fa |
| Total Paid | #a78bfa |
| LVR | #fb923c |
| Offset | #facc15 |

**Scoped palettes (in `src/lib/theme.ts`, not global):**

| Palette | Purpose |
|---|---|
| `SERIES` | Chart series colours (balance, interest, equity, etc.) |
| `CF_COLORS` | Cashflow chart palette variants |
| `TAX_COLORS` | Tax breakdown donut segments |
| `TAX_BRACKET_COLORS` | Five-tier severity ramp for marginal tax rate tiers |
| `TAX_CATEGORY_COLORS` | Per-section tints for the Advanced tax inputs (income / deductions / adjustments) |
| `LVR_COLORS` | Three-tier LVR safety thresholds |
| `STATE_COLORS` | Australian state / federal recognition colours for the Grants feature |
| `DEPRECIATION_COLOR` | Single source for depreciation purple |

Scoped palettes are feature-specific vocabulary. They live in `theme.ts` rather than the global `@theme` block because their meaning is tied to a specific domain (tax brackets, LVR thresholds, jurisdictions) rather than the general design language.

---

See [DESIGN-PROCESS.md](DESIGN-PROCESS.md) for the step-by-step design workflow.
