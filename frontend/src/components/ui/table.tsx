"use client"

import * as React from "react"
import { cn } from "cn"

/**
 * Table variants (set on `Table`; the parts inherit via context):
 * - `default` (stock shadcn): scroll container, borders, row hover, padding.
 * - `bare` (ours): no container div and NO classes on any part, so callers
 *   can reproduce an existing layout exactly. Typical use is a grid-rowed
 *   table: `Table className="block"`, `TableHeader`/`TableBody` `block`,
 *   `TableRow className="grid grid-cols-[…]"`, which keeps `<table>`
 *   semantics with CSS-grid column sizing (and lets `TableBody` be its own
 *   scroll container under a fixed header). Because display overrides can
 *   drop the implicit table semantics, every part carries its explicit ARIA
 *   role (table / rowgroup / row / columnheader / cell).
 * - `dense` (ours, cashflow details tables): no container div (the caller
 *   owns scrolling); `w-full table-fixed`, 12px. The first column is sticky
 *   (`w-16`, left-aligned, card fill under the scrolled cells).
 *   - `TableHead`: px-3 py-2, right-aligned 11px medium uppercase
 *     tracking-wider, fg-tertiary on surface-subtle.
 *   - Body `TableRow`: h-8, pointer, white/.02 hover wash. Mark the selected
 *     row with `data-state="selected"`: brand/.04 fill, and its sticky first
 *     cell turns surface-hover + brand text (the hover wash still wins over
 *     the selected fill, as before). Header rows get no classes.
 *   - `TableCell`: px-3 py-2, right-aligned 12px tabular-nums fg-primary
 *     with a border-subtle top rule. The sticky first cell is 500 weight with
 *     proportional figures. Value colours come from the caller's className
 *     (or `style` for computed colours).
 *   - Head and cell modifiers (data attributes):
 *     `data-tone="total"` (head: 600 fg-secondary; cell: 500),
 *     `data-tone="net"` (head: 600 brand; cell: 13px 600),
 *     `data-divider="subtle"` (1px border-subtle left rule, starts a column
 *     group), `data-divider="strong"` (2px border-default left rule; on a
 *     cell the top rule turns border-default too).
 */
type TableVariant = "default" | "bare" | "dense"

const TableVariantContext = React.createContext<TableVariant>("default")
const useTableVariant = () => React.useContext(TableVariantContext)
/** True inside `TableHeader`: dense header rows get no row classes. */
const TableHeaderContext = React.createContext(false)

const DENSE_DIVIDER =
  "data-[divider=subtle]:border-l data-[divider=subtle]:border-border-subtle data-[divider=strong]:border-l-2 data-[divider=strong]:border-border-default"

const DENSE_ROW =
  "group/row h-8 cursor-pointer transition-colors hover:bg-white/[0.02] data-[state=selected]:bg-brand/[0.04] data-[state=selected]:hover:bg-white/[0.02]"

const DENSE_HEAD =
  "bg-surface-subtle px-3 py-2 text-right text-[11px] font-medium tracking-wider text-fg-tertiary uppercase " +
  "data-[tone=total]:font-semibold data-[tone=total]:text-fg-secondary data-[tone=net]:font-semibold data-[tone=net]:text-brand " +
  "first:sticky first:left-0 first:z-10 first:w-16 first:text-left " +
  DENSE_DIVIDER

const DENSE_CELL =
  "border-t border-border-subtle px-3 py-2 text-right text-[12px] text-fg-primary tabular-nums " +
  "data-[tone=total]:font-medium data-[tone=net]:text-[13px] data-[tone=net]:font-semibold " +
  "first:sticky first:left-0 first:z-10 first:bg-card first:text-left first:font-medium first:normal-nums " +
  "group-data-[state=selected]/row:first:bg-surface-hover group-data-[state=selected]/row:first:text-brand " +
  DENSE_DIVIDER

function Table({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"table"> & { variant?: TableVariant }) {
  if (variant === "bare") {
    return (
      <TableVariantContext.Provider value="bare">
        <table data-slot="table" data-variant="bare" role="table" className={className} {...props} />
      </TableVariantContext.Provider>
    )
  }
  if (variant === "dense") {
    return (
      <TableVariantContext.Provider value="dense">
        <table
          data-slot="table"
          data-variant="dense"
          className={cn("w-full table-fixed text-[12px]", className)}
          {...props}
        />
      </TableVariantContext.Provider>
    )
  }
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  const variant = useTableVariant()
  if (variant !== "default") {
    return (
      <TableHeaderContext.Provider value>
        <thead
          data-slot="table-header"
          role={variant === "bare" ? "rowgroup" : undefined}
          className={className}
          {...props}
        />
      </TableHeaderContext.Provider>
    )
  }
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  const variant = useTableVariant()
  if (variant !== "default") {
    return (
      <tbody
        data-slot="table-body"
        role={variant === "bare" ? "rowgroup" : undefined}
        className={className}
        {...props}
      />
    )
  }
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  const variant = useTableVariant()
  if (variant !== "default") {
    return (
      <tfoot
        data-slot="table-footer"
        role={variant === "bare" ? "rowgroup" : undefined}
        className={className}
        {...props}
      />
    )
  }
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  const variant = useTableVariant()
  const inHeader = React.useContext(TableHeaderContext)
  if (variant === "bare") return <tr data-slot="table-row" role="row" className={className} {...props} />
  if (variant === "dense") {
    return (
      <tr
        data-slot="table-row"
        className={inHeader ? className : cn(DENSE_ROW, className)}
        {...props}
      />
    )
  }
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  const variant = useTableVariant()
  if (variant === "bare") return <th data-slot="table-head" role="columnheader" className={className} {...props} />
  if (variant === "dense") return <th data-slot="table-head" className={cn(DENSE_HEAD, className)} {...props} />
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  const variant = useTableVariant()
  if (variant === "bare") return <td data-slot="table-cell" role="cell" className={className} {...props} />
  if (variant === "dense") return <td data-slot="table-cell" className={cn(DENSE_CELL, className)} {...props} />
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  const variant = useTableVariant()
  if (variant !== "default") return <caption data-slot="table-caption" className={className} {...props} />
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export type { TableVariant }
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
