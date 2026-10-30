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
 *   scroll container under a fixed header).
 */
type TableVariant = "default" | "bare"

const TableVariantContext = React.createContext<TableVariant>("default")
const useBare = () => React.useContext(TableVariantContext) === "bare"

function Table({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"table"> & { variant?: TableVariant }) {
  if (variant === "bare") {
    return (
      <TableVariantContext.Provider value="bare">
        <table data-slot="table" data-variant="bare" className={className} {...props} />
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
  const bare = useBare()
  if (bare) return <thead data-slot="table-header" className={className} {...props} />
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  const bare = useBare()
  if (bare) return <tbody data-slot="table-body" className={className} {...props} />
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  const bare = useBare()
  if (bare) return <tfoot data-slot="table-footer" className={className} {...props} />
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
  const bare = useBare()
  if (bare) return <tr data-slot="table-row" className={className} {...props} />
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
  const bare = useBare()
  if (bare) return <th data-slot="table-head" className={className} {...props} />
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
  const bare = useBare()
  if (bare) return <td data-slot="table-cell" className={className} {...props} />
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
  const bare = useBare()
  if (bare) return <caption data-slot="table-caption" className={className} {...props} />
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
