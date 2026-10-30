"use client"

import * as React from "react"
import { cn } from "cn"
import { Label as LabelPrimitive } from "radix-ui"

/**
 * Label variants:
 * - `default` (stock shadcn): flex, text-sm, leading-none, font-medium.
 * - `field` (ours): small field caption above an input (cashflow wizard).
 * - `bare` (ours): no classes at all; the caller styles the label (used for
 *   whole-row clickable labels around a Switch or Checkbox). Note the stock
 *   `leading-none` would otherwise change the line height of the row.
 * - `form` (ours): 13px fg-secondary regular caption above an auth input.
 *   Display and spacing come from the caller.
 * - `caps` (ours): 11px semibold uppercase wide-tracked caption,
 *   fg-primary 50% (Purchase costs fields; Grants overrides size/colour).
 */
const LABEL_VARIANTS = {
  default:
    "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
  field: "text-xs font-medium text-fg-secondary",
  form: "text-[13px] font-normal text-fg-secondary",
  caps: "text-[11px] font-semibold whitespace-nowrap text-fg-primary/50 uppercase tracking-widest",
  bare: "",
} as const

function Label({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & {
  variant?: keyof typeof LABEL_VARIANTS
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(LABEL_VARIANTS[variant], className)}
      {...props}
    />
  )
}

export { Label }
