"use client"

import * as React from "react"
import { cn } from "cn"
import { Switch as SwitchPrimitive } from "radix-ui"

/**
 * Switch variants:
 * - `default` (stock shadcn), sizes `default` / `sm`.
 * - `accent` (ours, was ui/Toggle): 36×20 track, 14px thumb inset 3px with
 *   16px travel, 200ms. Checked track = accent at 40%, thumb = accent.
 *   Accent colour: `--switch-accent` (defaults to brand), e.g.
 *   `style={{ "--switch-accent": color } as React.CSSProperties}`.
 * - `glow` (ours, Purchase costs toggles): 36×20 track with a 1px brand
 *   border (15% off / 50% on) on a brand 12% / 35% fill; 16px thumb inset
 *   1px with 16px travel, transparent off, solid brand + 8px brand glow on.
 */
const STOCK_ROOT =
  "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none group-has-[:focus-visible]/field-label:border-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50"

const STOCK_THUMB =
  "pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"

const ACCENT_ROOT =
  "[--switch-accent:var(--color-brand)] relative h-[20px] w-[36px] shrink-0 rounded-full transition-colors duration-200 bg-[color:rgba(255,255,255,0.08)] data-checked:bg-[color:color-mix(in_srgb,var(--switch-accent)_40%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-disabled:cursor-not-allowed"

const ACCENT_THUMB =
  "absolute top-[3px] left-[3px] h-[14px] w-[14px] rounded-full transition-all duration-200 bg-[color:rgba(255,255,255,0.3)] data-checked:translate-x-[16px] data-checked:bg-[color:var(--switch-accent)]"

const GLOW_ROOT =
  "relative h-5 w-9 shrink-0 cursor-pointer rounded-full border border-brand/15 bg-brand/12 transition-all duration-200 data-[state=checked]:border-brand/50 data-[state=checked]:bg-brand/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-disabled:cursor-not-allowed"

const GLOW_THUMB =
  "pointer-events-none absolute top-[1px] left-[1px] h-4 w-4 rounded-full transition-all duration-200 data-[state=checked]:translate-x-4 data-[state=checked]:bg-brand data-[state=checked]:shadow-[0_0_8px_var(--color-brand)]"

const CUSTOM_PARTS = {
  accent: [ACCENT_ROOT, ACCENT_THUMB],
  glow: [GLOW_ROOT, GLOW_THUMB],
} as const

function Switch({
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
  variant?: "default" | "accent" | "glow"
}) {
  const [root, thumb] =
    variant === "default" ? [STOCK_ROOT, STOCK_THUMB] : CUSTOM_PARTS[variant]
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      data-variant={variant}
      className={cn(root, className)}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={thumb} />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
