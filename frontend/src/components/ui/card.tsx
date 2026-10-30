import * as React from "react"
import { cn } from "cn"
import { Slot } from "radix-ui"

/**
 * Card variants:
 * - `default` (stock shadcn): flex column, padding, ring, rounded-xl, bg-card.
 * - `glass` (ours, was GlassCard): raised surface, rounded-2xl, backdrop blur,
 *   soft shadow and a 1px hover lift. No padding or layout: callers own that
 *   (and may pass e.g. a coloured `borderTop` through `style`).
 * - `auth` (ours, was AuthCard's inline style): full-width card capped at
 *   400px, --color-card fill, 1px border-default, 12px radius, 28px padding
 *   and a deep drop shadow. Use `asChild` to render it as a `<form>`.
 * - `scheme` (ours, grant scheme card): flex column, 18px radius, white/.04
 *   fill, white/.08 border with a 3px top border in `--card-accent` at 55%,
 *   soft shadow, 250ms ease-out-expo transitions. Hover lift/shadow and
 *   padding come from the caller.
 * - `panel` (ours, cashflow dashboard panels and details table): rounded-xl,
 *   1px border-subtle, --color-card fill. No padding or layout: callers own
 *   that.
 */
const CARD_STOCK =
  "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl"

const CARD_GLASS =
  "rounded-2xl bg-surface-raised backdrop-blur-md " +
  "shadow-[0_1px_4px_rgba(0,0,0,0.20),0_0_0_0.5px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.02)] " +
  "transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] " +
  "hover:-translate-y-px hover:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.35),0_0_0_0.5px_rgba(113,113,122,0.06),inset_0_1px_0_rgba(255,255,255,0.03)]"

const CARD_AUTH =
  "w-full max-w-[400px] rounded-xl border border-border-default bg-card p-7 " +
  "shadow-[0_8px_24px_rgba(0,0,0,0.44),0_0_0_0.5px_rgba(113,113,122,0.08),inset_0_1px_0_rgba(255,255,255,0.03)]"

const CARD_SCHEME =
  "flex flex-col rounded-[18px] border border-white/[0.08] border-t-[3px] border-t-[color:color-mix(in_srgb,var(--card-accent)_55%,transparent)] bg-white/[0.04] " +
  "shadow-[0_1px_4px_rgba(0,0,0,0.2),0_0_0_0.5px_rgba(255,255,255,0.02),inset_0_1px_0_rgba(255,255,255,0.02)] " +
  "transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)]"

const CARD_PANEL = "rounded-xl border border-border-subtle bg-card"

const CARD_VARIANTS = {
  default: CARD_STOCK,
  glass: CARD_GLASS,
  auth: CARD_AUTH,
  scheme: CARD_SCHEME,
  panel: CARD_PANEL,
} as const

type CardVariant = keyof typeof CARD_VARIANTS

function Card({
  className,
  size = "default",
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  variant?: CardVariant
  /** Render the single child element (e.g. a `<form>`) with the card's props. */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(CARD_VARIANTS[variant], className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
