import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/**
 * Badge variants:
 * - stock shadcn (default, secondary, destructive, outline, ghost, link) get
 *   STOCK_BASE (h-5, rounded-4xl, px-2, text-xs…).
 * - custom variants (count, tag, tinted, stat) get no base classes, so they render exactly as the
 *   inline spans they replaced.
 */
const STOCK_BADGE_VARIANTS = ["default", "secondary", "destructive", "outline", "ghost", "link"]

const STOCK_BASE =
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!"

const badgeVariantStyles = cva("",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        /** Small brand count pill (e.g. "Edit Columns  12"). */
        count:
          "rounded-full bg-brand px-1.5 py-0.5 text-[11px] font-semibold text-brand-contrast",
        /**
         * Two-line stat pill (tax Effective / Marginal rate). Colour via
         * `--badge-accent`: accent 10% bg, 25% border, accent text. Mark the
         * caption with `data-slot="badge-label"` for the 58% caption colour.
         */
        /** Tiny uppercase slate tag ("Coming soon" on placeholder tools). */
        tag:
          "inline-block rounded-[3px] bg-[rgba(148,163,184,0.08)] px-2 py-[3px] text-[8px] leading-none font-semibold tracking-widest text-[color:rgba(148,163,184,0.35)] uppercase",
        /**
         * 36px rounded-[14px] uppercase tag tinted with `--badge-accent`
         * (accent text on an accent-10% wash): grant card state badge.
         */
        tinted:
          "inline-flex h-9 items-baseline justify-center rounded-[14px] bg-[color:color-mix(in_srgb,var(--badge-accent)_10%,transparent)] px-3 text-[13px] font-semibold tracking-widest text-[color:var(--badge-accent)] uppercase",
        stat:
          "flex flex-col items-center rounded-full border border-[color:color-mix(in_srgb,var(--badge-accent)_25%,transparent)] bg-[color:color-mix(in_srgb,var(--badge-accent)_10%,transparent)] px-5 py-2 text-center text-[color:var(--badge-accent)] " +
          "**:data-[slot=badge-label]:text-[color:color-mix(in_srgb,var(--badge-accent)_58%,transparent)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function badgeVariants({
  variant = "default",
}: VariantProps<typeof badgeVariantStyles> = {}) {
  const v = variant ?? "default"
  return cn(
    STOCK_BADGE_VARIANTS.includes(v) && STOCK_BASE,
    badgeVariantStyles({ variant: v })
  )
}

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariantStyles> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
