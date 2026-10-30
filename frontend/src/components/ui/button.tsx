/**
 * Button: shadcn/ui Button with two families of variants.
 *
 * STOCK variants (default, outline, secondary, ghost, destructive, link)
 *   keep shadcn's own look: they get STOCK_BASE (inline-flex, h-8, gap,
 *   rounded-lg, border, text-sm font-medium, [&_svg]:size-4, active nudge…)
 *   and resolve to size "default" when no size is passed. Code pasted from
 *   shadcn / v0 therefore renders as designed.
 *
 * CUSTOM variants (pill, cta, ghost-muted, …) reproduce this app's existing
 *   controls pixel-for-pixel. They get only CUSTOM_BASE (behaviour: keyboard
 *   focus ring, disabled cursor) and NO size classes unless a size is passed
 *   explicitly (default size resolves to "none"). Layout that differs per call
 *   site (padding, font size, flex/gap) stays in the caller's className.
 *
 * `buttonVariants()` applies the same rules, so other components can style a
 * link or trigger as a button: `buttonVariants({ variant: "pill" })`.
 *
 * Per-instance accent colours are passed as CSS custom properties, e.g.
 * `<Button variant="pill" style={{ "--pill-accent": color }} />`.
 *
 * Note: `cn` merges like tailwind-merge (conflicting utilities keep the last),
 * so a caller's className overrides the variant's classes in the same group.
 */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/** shadcn's stock base: applied to stock variants only. */
const STOCK_BASE =
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

/**
 * Behaviour-only base for our custom variants. Uses `outline` (not `ring`) for
 * the keyboard focus indicator so it never fights a variant's box-shadow.
 */
const CUSTOM_BASE =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"

const CUSTOM_BASE_NO_FOCUS = "disabled:cursor-not-allowed"

const STOCK_VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const

/** 26px rounded-full chip. Accent colour: `--pill-accent` (default brand). */
const PILL =
  "[--pill-accent:var(--color-brand)] h-[26px] min-w-[72px] justify-center rounded-full border border-[color:rgba(255,255,255,0.07)] bg-transparent px-2.5 text-center text-[14px] leading-none font-semibold whitespace-nowrap text-[color:color-mix(in_srgb,var(--color-fg-primary)_50%,transparent)] cursor-pointer transition-all duration-150 " +
  "aria-pressed:border-[color:color-mix(in_srgb,var(--pill-accent)_25%,transparent)] aria-pressed:bg-[color:color-mix(in_srgb,var(--pill-accent)_14%,transparent)] aria-pressed:text-[color:var(--pill-accent)] aria-pressed:shadow-[0_0_8px_color-mix(in_srgb,var(--pill-accent)_10%,transparent)]"

/** Shared shape of the full-width outlined auth buttons. */
const OUTLINE_BLOCK =
  "flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border-default text-[14px] font-medium text-fg-primary cursor-pointer [transition:background_0.2s_ease,border-color_0.2s_ease] hover:border-border-strong hover:bg-surface-hover"

/**
 * Custom variants that draw their own focus indicator (so CUSTOM_BASE's
 * outline ring would double it up).
 */
const OWN_FOCUS_VARIANTS = ["cta-glow"] as const

const buttonVariantStyles = cva("", {
  variants: {
    variant: {
      // ── Stock shadcn ────────────────────────────────────────────
      default: "bg-primary text-primary-foreground hover:bg-primary/80",
      outline:
        "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
      ghost:
        "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
      destructive:
        "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
      link: "text-primary underline-offset-4 hover:underline",

      // ── Custom (this app) ──────────────────────────────────────
      /** Toggle chip (Grants filters). Active state = `aria-pressed`. */
      pill: PILL,
      /** Brand-filled primary action (wizard Continue / Save / Calculate). */
      cta: "rounded-lg bg-brand font-semibold text-brand-contrast transition-all duration-150 hover:enabled:brightness-110 disabled:opacity-40",
      /** Quiet text button: fg-tertiary → fg-primary with a faint hover wash (wizard Back). */
      "ghost-muted":
        "rounded-lg font-medium text-fg-tertiary transition-colors hover:bg-white/[0.04] hover:text-fg-primary",
      /** Brand-tinted text button with a faint hover wash (ErrorBoundary "Try again"). */
      "ghost-brand":
        "rounded-lg font-medium text-brand/60 transition-colors hover:bg-white/[0.04]",
      /** Square icon button, muted icon, surface-hover wash (drawer close). */
      "ghost-icon":
        "flex items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-hover",
      /** Filled square icon button that grows slightly on hover (modal close). */
      "icon-filled":
        "flex items-center justify-center rounded-lg bg-white/[0.04] text-fg-tertiary transition-all duration-150 hover:scale-105 hover:bg-white/[0.08] hover:text-fg-primary",
      /** Solid surface button, fg-secondary (drawer "Reset to Default"). */
      soft: "rounded-lg bg-surface-hover font-medium text-fg-secondary transition-colors hover:bg-surface-active",
      /** Transparent, 1px border-subtle, surface-hover wash (toolbar "Edit Columns"). */
      "outline-subtle":
        "inline-flex items-center rounded-lg border border-border-subtle bg-transparent font-medium text-fg-primary transition-all hover:bg-surface-hover",
      /**
       * Wizard sidebar step row. Set `data-current` on the current step;
       * non-selectable steps are `disabled` (no opacity change).
       * Keeps `group` so step bodies can use `group-hover:`.
       */
      "nav-step":
        "group relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 disabled:cursor-default data-[current=true]:bg-brand/[0.08] data-[current=false]:enabled:hover:bg-white/[0.03]",
      /**
       * Clickable legend row for a data-viz (tax donut legend): dot + label,
       * rounded-md px-2 py-1. Colour via `--legend-accent`. Set
       * `data-highlighted` for the accent-8% wash and `data-dimmed` to fade
       * to 30% while another series is highlighted.
       */
      "legend-row":
        "flex cursor-pointer items-center gap-2 rounded-md bg-transparent px-2 py-1 text-left transition-all duration-200 data-[dimmed=true]:opacity-30 data-[highlighted=true]:bg-[color:color-mix(in_srgb,var(--legend-accent)_8%,transparent)]",
      /**
       * Full-width 46px brand CTA with an emerald glow (auth Sign in / Create
       * account / Send reset link). Owns its focus style: a 3px focus-ring
       * box-shadow on top of the glow. A child with `data-cta-arrow` slides
       * 3px right on hover.
       */
      "cta-glow":
        "group/cta flex h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-brand text-[14px] font-semibold tracking-[-0.005em] text-brand-contrast cursor-pointer outline-none " +
        "shadow-[0_4px_16px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.20)] [transition:background_0.2s_ease,box-shadow_0.2s_ease,transform_0.1s_ease] motion-reduce:[transition:none] " +
        "hover:bg-brand-hover hover:shadow-[0_6px_24px_rgba(52,211,153,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] active:[transform:scale(0.99)] " +
        "focus-visible:shadow-[0_4px_16px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.20),0_0_0_3px_var(--color-focus-ring)] " +
        "[&>[data-cta-arrow]]:inline-block [&>[data-cta-arrow]]:font-medium [&>[data-cta-arrow]]:[transition:transform_0.2s_ease] motion-reduce:[&>[data-cta-arrow]]:[transition:none] hover:[&>[data-cta-arrow]]:[transform:translateX(3px)]",
      /**
       * Full-width 44px outlined button (auth "Use a different email"):
       * transparent, 1px border-default, 14px medium. Hover: surface-hover
       * wash + border-strong.
       */
      "outline-block": OUTLINE_BLOCK + " bg-transparent",
      /** As `outline-block` on a `--color-control` fill (Continue with Google). */
      "outline-filled": OUTLINE_BLOCK + " bg-control",
      /** Text link, fg-secondary → fg-primary; the gap widens 6→8px on hover ("← Back to sign in"). */
      "link-back":
        "inline-flex items-center gap-1.5 text-fg-secondary no-underline [transition:color_0.2s_ease,gap_0.2s_ease] hover:gap-2 hover:text-fg-primary",
      /** Quiet text link, fg-tertiary → fg-secondary (login "Forgot?"). Size comes from the caller. */
      "link-muted":
        "text-fg-tertiary no-underline [transition:color_0.2s_ease] hover:text-fg-secondary",
    },
    size: {
      /** No size classes (default for custom variants). */
      none: "",
      default:
        "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
      sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
      lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      icon: "size-8",
      "icon-xs":
        "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
      "icon-sm":
        "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
      "icon-lg": "size-9",
    },
  },
})

type ButtonVariantProps = VariantProps<typeof buttonVariantStyles>
type ButtonVariant = NonNullable<ButtonVariantProps["variant"]>

function isStockVariant(variant: ButtonVariant): boolean {
  return (STOCK_VARIANTS as readonly string[]).includes(variant)
}

function ownsFocus(variant: ButtonVariant): boolean {
  return (OWN_FOCUS_VARIANTS as readonly string[]).includes(variant)
}

function buttonVariants({
  variant = "default",
  size,
  className,
}: ButtonVariantProps & { className?: string } = {}) {
  const v = variant ?? "default"
  const stock = isStockVariant(v)
  return cn(
    stock ? STOCK_BASE : ownsFocus(v) ? CUSTOM_BASE_NO_FOCUS : CUSTOM_BASE,
    buttonVariantStyles({ variant: v, size: size ?? (stock ? "default" : "none") }),
    className
  )
}

function Button({
  className,
  variant = "default",
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  ButtonVariantProps & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const v = variant ?? "default"
  const resolvedSize = size ?? (isStockVariant(v) ? "default" : "none")

  return (
    <Comp
      data-slot="button"
      data-variant={v}
      data-size={resolvedSize}
      className={buttonVariants({ variant: v, size: resolvedSize, className })}
      {...props}
    />
  )
}

export { Button, buttonVariants }
export type { ButtonVariant }
