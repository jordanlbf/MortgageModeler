# MortgageModeler Design System

## Personality

A sharp, dark instrument for modelling property decisions with precision.

**Visual reference:** dark dashboards, warm dark grey backgrounds, surface-first elevation (no drawn borders on containers), teal accent used surgically, generous internal padding, typography-driven hierarchy. Not Bloomberg dense, not consumer playful. Clean, calm, precise.

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
- Cards: 1-2 steps lighter on the surface ramp. Boundary comes from the lightness step itself — no drawn border, no dramatic shadow.

### Brand
- Teal (`--color-brand`, #2dd4bf) is the single identity colour. Used surgically: hero numbers, active toggle states, section labels, active pills, selection.
- **Brand is distinct from `data-positive`.** `--color-brand` owns identity / selection / "this is us"; `--color-data-positive` owns "good / up" semantics. They are chromatically distant so the eye can separate them at a glance.
- Never used for large fills, card backgrounds, decorative areas, or semantic meaning (positive/negative/warning).
- Arctic theme (Slate Electric, `#3b82f6`) is a more chromatic alternative — a brighter, cooler blue accent on a deeper page background with pure blue-white foreground. Same placement rules apply; the hue itself is the personality shift.

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
| `--color-surface-app` | `#111215` | Main app content surface |
| `--color-surface-raised` | `#1a1c20` | Cards, table headers, summary-row top band |
| `--color-surface-hover` | `#22252a` | Interactive row hover feedback |
| `--color-surface-active` | `#2a2d33` | Selected rows, anchors, pressed states |
| `--color-surface-overlay` | `rgba(8,9,10,0.72)` | Modal / dialog scrim |

Each step is ~6–10 hex points lighter. This follows the approach used by Linear and Stripe Dashboard.

### Data vs status semantic colours

Meaning colours come in two flavours and the distinction is structural:

- **Data semantics** (`--color-data-positive/-negative/-warning`) sit on-screen indefinitely — in tables, in chart axes, on KPI tiles. They are calm and desaturated (~60-70% of Tailwind default saturation) so they don't vibrate on dark surfaces or pull the eye away from the numbers they're colouring.
- **Status semantics** (`--color-status-success/-error/-warning/-info`) flash briefly — toasts, validation messages, inline banners. They're slightly brighter than their data counterparts because they need to catch attention for a moment, then disappear.

Kept as separate token sets so the two can diverge if a future design iteration demands it.

### Tokens not patterns

Components reach for tokens, never for raw hex or opacity-based washes on the brand colour. Two corollaries:

- No `color-mix(… var(--color-brand) N%, transparent)` in component files for state backgrounds. Use `--color-brand-subtle` or `--color-brand-subtle-hover` — pre-mixed on the app surface, so the apparent colour doesn't drift across elevation tiers.
- No inline `box-shadow: 0 4px 16px rgba(0,0,0,…)`. Use `--shadow-flat`, `--shadow-raised`, or `--shadow-float`.

The only permitted raw colours in component files are feature-scoped palettes in `src/lib/theme.ts` (`SERIES`, `CF_COLORS`, `TAX_COLORS`, etc.), which are domain vocabulary rather than UI tokens.

### Cards
- Barely raised. `bg-surface-raised` against `bg-surface-app` — the ~6-10 hex-point lightness step is the boundary.
- No drawn border on the container itself. See **Borders** below for the rule.
- Internal padding: `p-6` (24px) to `p-8` (32px). Density from multiple cards, not packed content.
- Border-radius: `rounded-xl` (12px) to `rounded-2xl` (16px).

### Borders

**Borders are for controls, not containers.** Containers (cards, KPI strips, panels, mode pickers, nested fact cards, filter bars) rely on the surface lightness step for definition. A drawn border on a container competes with the ramp and adds visual noise; remove it and let the surface do the work.

Borders are reserved for elements where the edge is the affordance:

| Allowed | Why |
|---|---|
| Form inputs (`.form-input`, `.form-select`) | The edge *is* the input — users target it to focus |
| Outline buttons | The ring communicates "clickable but secondary" |
| Toggle tracks, pill controls | Edge defines the hit target |
| Focus rings | Accessibility requirement |
| Top accent bars (`border-t-2 border-t-accent-border`) | Categorical marker, not a boundary |
| Row dividers (`border-b`), column dividers (`border-l`) | Separators inside a container, not around one |
| Tooltip / popover edges | Floating layer needs a hairline to read against any surface |
| Data-viz bar edges | Part of the chart vocabulary |

Everything else uses `bg-surface-raised` (or a `bg-brand/[0.0x]` wash for brand-tinted callouts) against the surrounding surface. If two adjacent surfaces don't visually separate, bump the raised surface's lightness — don't reach for a border.

Exception: error / warning banners may carry a tinted border because they're ephemeral and need to catch the eye.

### Spacing
- Generous by default. `gap-5` to `gap-7` (20-28px) between sections. `gap-3` to `gap-4` (12-16px) between rows.
- Adjacent values differ by ~25% minimum.

### Interaction
- Hover: translateY -1 to -2px with deeper shadow (`--shadow-float`).
- Active toggles: brand glow (low-opacity box-shadow).
- Transitions: `duration-150` to `duration-200` ease for colour/opacity. `duration-300` cubic-bezier for transform.
- Focus rings: `box-shadow: 0 0 0 3px var(--color-focus-ring)`. Visible on every focusable element.

### Shadows
- Rest: `--shadow-raised`.
- Hover / lifted: `--shadow-float`.
- Ultra-flat outline: `--shadow-flat`.
- No ad-hoc `box-shadow: 0 Npx Mpx rgba(...)` in components. Depth comes from the three named tokens.

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

Defined as CSS custom properties. Three named tokens — components never use raw `box-shadow` values.

| Token | Value | Use |
|---|---|---|
| `--shadow-flat` | `0 0 0 0.5px rgba(255,255,255,0.02)` | Subtle outline on flat surfaces |
| `--shadow-raised` | `0 1px 3px rgba(0,0,0,0.24), 0 0 0 0.5px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.02)` | Default card shadow |
| `--shadow-float` | `0 8px 24px rgba(0,0,0,0.40), 0 0 0 0.5px rgba(174,196,191,0.08), inset 0 1px 0 rgba(255,255,255,0.03)` | Hover / lifted card |

### Colour Tokens

Defined as CSS custom properties in `globals.css` via `@theme`. Two themes (Graphite Teal, Slate Electric) remap the same role-based tokens. See [TOKENS.md](TOKENS.md) for the complete palette table.

**Token categories:**

- **Brand** — single identity colour. `--color-brand` + subtle/hover/border variants.
- **Surface ramp** — elevation via lightness, not shadow. Five tiers: page → app → raised → hover → active, plus overlay.
- **Foreground ramp** — unified mint-tinted family: primary / secondary / tertiary / disabled.
- **Data ink** — tabular numerics: primary / emphasis / muted.
- **Data semantic** — tabular meaning: positive / negative / warning / neutral.
- **Status semantic** — UI feedback: success / error / warning / info (+ pre-mixed `-bg` surfaces).
- **Borders** — mint-tinted: subtle / default / strong / brand. Applied to controls only; see the Borders subsection above.
- **Focus** — explicit `--color-focus-ring`.
- **Elevation** — three named shadows.

**Brand usage (surgical — same placements both themes):**

- Hero numbers, section labels, selection, active tab indicators: `color: var(--color-brand)`.
- Active toggle fills, brand wash backgrounds: `background: var(--color-brand-subtle)` or `var(--color-brand-subtle-hover)`.
- Control borders (inputs, outline buttons) in brand-accented contexts: `border-color: var(--color-brand-border)`.
- Focus rings: `box-shadow: 0 0 0 3px var(--color-focus-ring)`.

Never use `color-mix(…, var(--color-brand) N%, transparent)` in components — reach for the pre-mixed tokens instead, so apparent colour stays consistent across elevation tiers.

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
