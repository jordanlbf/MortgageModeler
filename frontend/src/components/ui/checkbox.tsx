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
 */
const STOCK_ROOT =
  "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 group-has-[:focus-visible]/field-label:ring-0 group-has-[:focus-visible]/field-label:not-data-checked:border-input after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground group-has-[:focus-visible]/field-label:data-checked:border-primary dark:data-checked:bg-primary"

const LG_ROOT =
  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] border-border-default bg-transparent text-brand-contrast transition-all data-checked:border-brand data-checked:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"

function Checkbox({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  variant?: "default" | "lg"
}) {
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
