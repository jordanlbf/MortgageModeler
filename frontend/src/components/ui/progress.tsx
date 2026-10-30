"use client"

import * as React from "react"
import { cn } from "cn"
import { Progress as ProgressPrimitive } from "radix-ui"

/**
 * Progress variants:
 * - `default` (stock shadcn): 4px bar, indicator slides with translateX.
 * - `bar` (ours, wizard sidebar): 6px white/6% track, brand indicator that
 *   animates its WIDTH over 500ms ease-out (inventory risk R7: a translateX
 *   indicator eases differently and clips the rounded end differently).
 *   Override colours with `className` / `indicatorClassName`.
 * - `meter` (ours, password strength): 3px surface-raised track with 2px
 *   radius; the indicator's WIDTH and colour ease over 250ms. Colour via
 *   `--progress-accent` (set it in `style`). Width comes from the caller.
 */
function Progress({
  className,
  indicatorClassName,
  value,
  variant = "default",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  variant?: "default" | "bar" | "meter"
  indicatorClassName?: string
}) {
  if (variant === "meter") {
    return (
      <ProgressPrimitive.Root
        data-slot="progress"
        data-variant="meter"
        value={value}
        className={cn("h-[3px] overflow-hidden rounded-[2px] bg-surface-raised", className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full rounded-[2px] bg-[var(--progress-accent)] [transition:width_0.25s_ease,background_0.25s_ease]",
            indicatorClassName
          )}
          style={{ width: `${value ?? 0}%` }}
        />
      </ProgressPrimitive.Root>
    )
  }

  if (variant === "bar") {
    return (
      <ProgressPrimitive.Root
        data-slot="progress"
        data-variant="bar"
        value={value}
        className={cn("h-1.5 overflow-hidden rounded-full bg-white/[0.06]", className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full rounded-full bg-brand transition-all duration-500 ease-out",
            indicatorClassName
          )}
          style={{ width: `${value ?? 0}%` }}
        />
      </ProgressPrimitive.Root>
    )
  }

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("size-full flex-1 bg-primary transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
