"use client"

/**
 * ToggleGroup: shadcn/ui ToggleGroup. Items take their variant/size from the
 * group (see toggle.tsx for the variants).
 *
 * Stock variants get shadcn's root layout (flex w-fit, gap from `spacing`)
 * and item classes (shrink-0, joined corners at spacing 0).
 * Custom variants (`segment`, `segment-pill`, `pill`, `choice`, `legend`, `solid`) get NO root or item
 * layout classes: the caller's className owns layout, so the group can wrap
 * an existing flex row unchanged.
 *
 * Notes:
 * - `type="single"` items get `role="radio"` + `aria-checked`; `type="multiple"`
 *   items stay buttons with `aria-pressed`. Arrow keys move focus (roving).
 * - Radix lets the user deselect a single group's active item
 *   (`onValueChange("")`). For must-have-a-value groups, ignore empty values.
 * - Per-item accent colours go through CSS custom properties on the item,
 *   e.g. `style={{ "--legend-accent": color }}`.
 */
import * as React from "react"
import { cn } from "cn"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import {
  isStockToggleVariant,
  toggleVariants,
  type ToggleVariantProps,
} from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  ToggleVariantProps & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }
>({
  size: undefined,
  variant: "default",
  spacing: 2,
  orientation: "horizontal",
})

function ToggleGroup({
  className,
  variant = "default",
  size,
  spacing = 2,
  orientation = "horizontal",
  children,
  style,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  ToggleVariantProps & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }) {
  const v = variant ?? "default"
  const stock = isStockToggleVariant(v)
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={v}
      data-size={size ?? undefined}
      data-spacing={spacing}
      data-orientation={orientation}
      style={stock ? ({ "--gap": spacing, ...style } as React.CSSProperties) : style}
      className={cn(
        stock &&
          "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-lg data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-vertical:flex-col data-vertical:items-stretch",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant: v, size, spacing, orientation }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

const STOCK_ITEM =
  "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-lg group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-lg group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-lg group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-lg group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t"

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & ToggleVariantProps) {
  const context = React.useContext(ToggleGroupContext)
  const v = context.variant || variant || "default"
  const s = context.size || size
  const stock = isStockToggleVariant(v)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={v}
      data-size={s ?? undefined}
      data-spacing={context.spacing}
      className={cn(stock && STOCK_ITEM, toggleVariants({ variant: v, size: s }), className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
