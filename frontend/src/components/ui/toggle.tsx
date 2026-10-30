"use client"

/**
 * Toggle: shadcn/ui Toggle with two families of variants (same split as
 * Button, see button.tsx).
 *
 * STOCK variants (default, outline) keep shadcn's own look and resolve to
 *   size "default" when no size is passed.
 *
 * CUSTOM variants reproduce this app's existing controls. They get only
 *   CUSTOM_BASE (keyboard focus outline, disabled cursor) and size "none"
 *   unless a size is passed. The "on" state is Radix's `data-state="on"`,
 *   which a Toggle, a multiple ToggleGroup item (aria-pressed) and a single
 *   ToggleGroup item (role="radio", aria-checked) all set.
 *
 * - `segment`: compact segmented-control option (Amortisation Chart/Table).
 *   rounded-lg, 11px semibold, white/.04 bg + white/.07 border + white/.35
 *   text; on = brand 12% bg, brand 40% border, brand text, 12px brand-15% glow.
 *   Layout (padding, flex, gap) stays with the caller.
 * - `segment-pill`: large rounded-full segmented option (repayment
 *   frequency). Transparent + white/.12 border + white/.4 text, 400; on =
 *   brand 15% bg, solid brand border, brand text, 700, 10px brand-20% glow.
 * - `pill`: 26px rounded-full filter chip (Grants). Off = transparent,
 *   white/.07 border, fg-primary 50% text; on = accent 14% bg, 25% border,
 *   accent text, 8px accent-10% glow. Accent: `--pill-accent` (default
 *   brand). `data-tone="negative"` on an item = data-negative accent at
 *   12% bg / 8% glow (the red "No" option).
 * - `choice`: large either/or option (cashflow wizard Property type /
 *   Purchase status). px-5 py-2.5 rounded-lg 14px medium. Off = zinc-800/40
 *   fill, fg-secondary (hover zinc-800/60 + fg-primary); on = brand 12% fill,
 *   brand text, 1px brand-30% ring.
 * - `legend`: chart-legend series chip. Series colour via `--legend-accent`.
 *   Off = `--color-chart-legend-inactive` text; hover (off) = accent 50% text
 *   + 5% bg; on = accent 12% bg, 25% border, accent text. Put a
 *   `<ToggleLegendDot />` inside for the series dot.
 * - `solid`: compact text segment (cashflow dashboard Overview / Details).
 *   rounded-md, medium weight. Off = transparent, fg-secondary; on = solid
 *   brand fill, brand-contrast text. Padding and font size from the caller.
 */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Toggle as TogglePrimitive } from "radix-ui"

const STOCK_BASE =
  "group/toggle inline-flex items-center justify-center gap-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-muted data-[state=on]:bg-muted dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

/** Behaviour-only base for custom variants (outline, not ring, so it never fights a glow). */
const CUSTOM_BASE =
  "group/toggle cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"

const STOCK_VARIANTS = ["default", "outline"] as const

const toggleVariantStyles = cva("", {
  variants: {
    variant: {
      // ── Stock shadcn ────────────────────────────────────────────
      default: "bg-transparent",
      outline: "border border-input bg-transparent hover:bg-muted",

      // ── Custom (this app) ──────────────────────────────────────
      segment:
        "rounded-lg border border-[color:rgba(255,255,255,0.07)] bg-[color:rgba(255,255,255,0.04)] text-[11px] font-semibold tracking-wide text-[color:rgba(255,255,255,0.35)] transition-all duration-200 " +
        "data-[state=on]:border-[color:color-mix(in_srgb,var(--color-brand)_40%,transparent)] data-[state=on]:bg-[color:color-mix(in_srgb,var(--color-brand)_12%,transparent)] data-[state=on]:text-brand data-[state=on]:shadow-[0_0_12px_color-mix(in_srgb,var(--color-brand)_15%,transparent)]",
      "segment-pill":
        "rounded-full border border-[color:rgba(255,255,255,0.12)] bg-transparent text-[11px] font-normal tracking-[0.5px] text-[color:rgba(255,255,255,0.4)] transition-all duration-200 " +
        "data-[state=on]:border-brand data-[state=on]:bg-[color:color-mix(in_srgb,var(--color-brand)_15%,transparent)] data-[state=on]:font-bold data-[state=on]:text-brand data-[state=on]:shadow-[0_0_10px_color-mix(in_srgb,var(--color-brand)_20%,transparent)]",
      pill:
        "[--pill-accent:var(--color-brand)] h-[26px] min-w-[72px] justify-center rounded-full border border-[color:rgba(255,255,255,0.07)] bg-transparent px-2.5 text-center text-[14px] leading-none font-semibold whitespace-nowrap text-[color:color-mix(in_srgb,var(--color-fg-primary)_50%,transparent)] transition-all duration-150 " +
        "data-[state=on]:border-[color:color-mix(in_srgb,var(--pill-accent)_25%,transparent)] data-[state=on]:bg-[color:color-mix(in_srgb,var(--pill-accent)_14%,transparent)] data-[state=on]:text-[color:var(--pill-accent)] data-[state=on]:shadow-[0_0_8px_color-mix(in_srgb,var(--pill-accent)_10%,transparent)] " +
        "data-[tone=negative]:[--pill-accent:var(--color-data-negative)] data-[tone=negative]:data-[state=on]:bg-[color:color-mix(in_srgb,var(--pill-accent)_12%,transparent)] data-[tone=negative]:data-[state=on]:shadow-[0_0_8px_color-mix(in_srgb,var(--pill-accent)_8%,transparent)]",
      choice:
        "rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-150 " +
        "data-[state=off]:bg-zinc-800/40 data-[state=off]:text-fg-secondary data-[state=off]:hover:bg-zinc-800/60 data-[state=off]:hover:text-fg-primary " +
        "data-[state=on]:bg-brand/[0.12] data-[state=on]:text-brand data-[state=on]:ring-1 data-[state=on]:ring-brand/30",
      legend:
        "flex items-center gap-2 rounded-md border border-transparent bg-transparent px-2.5 py-1 text-[13px] font-semibold tracking-wide text-[color:var(--color-chart-legend-inactive)] transition-all duration-200 " +
        "data-[state=off]:hover:bg-[color:color-mix(in_srgb,var(--legend-accent)_5%,transparent)] data-[state=off]:hover:text-[color:color-mix(in_srgb,var(--legend-accent)_50%,transparent)] " +
        "data-[state=on]:border-[color:color-mix(in_srgb,var(--legend-accent)_25%,transparent)] data-[state=on]:bg-[color:color-mix(in_srgb,var(--legend-accent)_12%,transparent)] data-[state=on]:text-[color:var(--legend-accent)]",
      solid:
        "rounded-md bg-transparent font-medium text-fg-secondary transition-colors " +
        "data-[state=on]:bg-brand data-[state=on]:text-brand-contrast",
    },
    size: {
      /** No size classes (default for custom variants). */
      none: "",
      default:
        "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      sm: "h-7 min-w-7 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
      lg: "h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
    },
  },
})

type ToggleVariantProps = VariantProps<typeof toggleVariantStyles>
type ToggleVariant = NonNullable<ToggleVariantProps["variant"]>

function isStockToggleVariant(variant: ToggleVariant): boolean {
  return (STOCK_VARIANTS as readonly string[]).includes(variant)
}

function toggleVariants({
  variant = "default",
  size,
  className,
}: ToggleVariantProps & { className?: string } = {}) {
  const v = variant ?? "default"
  const stock = isStockToggleVariant(v)
  return cn(
    stock ? STOCK_BASE : CUSTOM_BASE,
    toggleVariantStyles({ variant: v, size: size ?? (stock ? "default" : "none") }),
    className
  )
}

function Toggle({
  className,
  variant = "default",
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & ToggleVariantProps) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      data-variant={variant}
      className={toggleVariants({ variant, size, className })}
      {...props}
    />
  )
}

/**
 * Series dot for the `legend` variant: 6px circle, accent + 6px glow when the
 * parent toggle is on, `--color-chart-legend-dot-inactive` when off.
 */
function ToggleLegendDot({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="toggle-legend-dot"
      className={cn(
        "h-1.5 w-1.5 rounded-full bg-[color:var(--color-chart-legend-dot-inactive)] transition-all duration-200",
        "group-data-[state=on]/toggle:bg-[color:var(--legend-accent)] group-data-[state=on]/toggle:shadow-[0_0_6px_color-mix(in_srgb,var(--legend-accent)_31.37%,transparent)]",
        className
      )}
      {...props}
    />
  )
}

export { Toggle, ToggleLegendDot, toggleVariants, isStockToggleVariant }
export type { ToggleVariant, ToggleVariantProps }
