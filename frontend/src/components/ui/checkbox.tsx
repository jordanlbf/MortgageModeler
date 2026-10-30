"use client"

import * as React from "react"
import { cn } from "cn"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon } from "lucide-react"

/**
 * Checkbox variants:
 * - `default` (stock shadcn): 16px, lucide check.
 * - `lg` (ours, column drawer rows): 20px rounded-md box, 1.5px border-default
 *   border; checked = brand fill + brand border with a 12px / stroke-3
 *   brand-contrast check. Usually wrapped in a <label> row so the whole row
 *   toggles it.
 * - `md` (ours, cashflow wizard): 18px rounded box with a 1px currentColor
 *   border (inherits the label's text colour); checked = brand fill + brand
 *   border with a CSS-drawn tick (4×8px rotated 2px border, brand-contrast)
 *   rather than the lucide icon, matching the original hand-rolled box.
 */
const STOCK_ROOT =
  "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 group-has-[:focus-visible]/field-label:ring-0 group-has-[:focus-visible]/field-label:not-data-checked:border-input after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground group-has-[:focus-visible]/field-label:data-checked:border-primary dark:data-checked:bg-primary"

const LG_ROOT =
  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] border-border-default bg-transparent text-brand-contrast transition-all data-checked:border-brand data-checked:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"

const MD_ROOT =
  "relative h-[18px] w-[18px] shrink-0 rounded border border-current bg-transparent transition-all duration-150 data-[state=checked]:border-brand data-[state=checked]:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"

const MD_TICK =
  "absolute top-[3px] left-[6px] h-2 w-1 rotate-45 border-r-2 border-b-2 border-brand-contrast"

function Checkbox({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  variant?: "default" | "md" | "lg"
}) {
  if (variant === "md") {
    return (
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        data-variant={variant}
        className={cn(MD_ROOT, className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className={MD_TICK} />
      </CheckboxPrimitive.Root>
    )
  }
  const lg = variant === "lg"
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-variant={variant}
      className={cn(lg ? LG_ROOT : STOCK_ROOT, className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={
          lg
            ? "flex items-center justify-center"
            : "grid place-content-center text-current transition-none [&>svg]:size-3.5"
        }
      >
        {lg ? <CheckIcon size={12} strokeWidth={3} /> : <CheckIcon />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
