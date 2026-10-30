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
 */
const STOCK_ROOT =
  "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none group-has-[:focus-visible]/field-label:border-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50"

const STOCK_THUMB =
  "pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"

const ACCENT_ROOT =
  "[--switch-accent:var(--color-brand)] relative h-[20px] w-[36px] shrink-0 rounded-full transition-colors duration-200 bg-[color:rgba(255,255,255,0.08)] data-checked:bg-[color:color-mix(in_srgb,var(--switch-accent)_40%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-disabled:cursor-not-allowed"

const ACCENT_THUMB =
  "absolute top-[3px] left-[3px] h-[14px] w-[14px] rounded-full transition-all duration-200 bg-[color:rgba(255,255,255,0.3)] data-checked:translate-x-[16px] data-checked:bg-[color:var(--switch-accent)]"

function Switch({
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
  variant?: "default" | "accent"
}) {
  const accent = variant === "accent"
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      data-variant={variant}
      className={cn(accent ? ACCENT_ROOT : STOCK_ROOT, className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={accent ? ACCENT_THUMB : STOCK_THUMB}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
