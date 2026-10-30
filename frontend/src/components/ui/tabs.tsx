"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Tabs as TabsPrimitive } from "radix-ui"

/**
 * Tabs variants (set on `Tabs` or `TabsList`; triggers inherit via context):
 * - `default`, `line` (stock shadcn).
 * - `underline` (ours): the cashflow dashboard view-mode row. List `flex gap-6`;
 *   triggers `pb-3 -mb-3 text-sm font-medium border-b-2`, inactive fg-tertiary
 *   + transparent border, active fg-primary + brand border. The trigger's
 *   `-mb-3` lets the active underline sit on the row's own bottom border, so
 *   put the list in a row with `pb-3 border-b border-border-subtle`. Add
 *   `capitalize` on triggers whose labels are lowercase keys.
 *
 * Custom variants get none of the stock layout classes (the `Tabs` root gets
 * no `flex flex-col gap-2`), so they can wrap an existing layout unchanged.
 *
 * Note: Radix gives triggers `role="tab"` (not "button") and arrow-key roving
 * focus.
 */
type TabsVariant = "default" | "line" | "underline"

const CUSTOM_TABS_VARIANTS: readonly TabsVariant[] = ["underline"]
const isCustom = (v: TabsVariant) => CUSTOM_TABS_VARIANTS.includes(v)

const TabsVariantContext = React.createContext<TabsVariant>("default")

function Tabs({
  className,
  orientation = "horizontal",
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & { variant?: TabsVariant }) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        data-variant={variant}
        orientation={orientation}
        className={cn(
          !isCustom(variant) && "group/tabs flex gap-2 data-horizontal:flex-col",
          className
        )}
        {...props}
      />
    </TabsVariantContext.Provider>
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const CUSTOM_LIST: Record<string, string> = {
  underline: "flex gap-6",
}

const STOCK_TRIGGER = [
  "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
  "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
  "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
]

const CUSTOM_TRIGGER: Record<string, string> = {
  underline:
    "-mb-3 border-b-2 border-transparent pb-3 text-sm font-medium text-fg-tertiary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=active]:border-brand data-[state=active]:text-fg-primary",
}

function TabsList({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: TabsVariant }) {
  const inherited = React.useContext(TabsVariantContext)
  const v = variant ?? inherited
  return (
    <TabsVariantContext.Provider value={v}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={v}
        className={cn(
          isCustom(v)
            ? CUSTOM_LIST[v]
            : tabsListVariants({ variant: v as VariantProps<typeof tabsListVariants>["variant"] }),
          className
        )}
        {...props}
      />
    </TabsVariantContext.Provider>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const v = React.useContext(TabsVariantContext)
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(isCustom(v) ? CUSTOM_TRIGGER[v] : STOCK_TRIGGER, className)}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
export type { TabsVariant }
