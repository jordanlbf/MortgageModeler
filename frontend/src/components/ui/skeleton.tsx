import * as React from "react"
import { cn } from "cn"

/**
 * Skeleton variants:
 * - `default` (stock shadcn): block `div`, `bg-muted`, sized by className.
 * - `inline` (ours): inline-block `span` on `bg-border-default`, so it can sit
 *   inside a line of text without breaking it. Size it with `width`/`height`.
 */
type SkeletonProps = React.ComponentProps<"span"> & {
  variant?: "default" | "inline"
  /** Explicit CSS width (e.g. "160px"). */
  width?: string
  /** Explicit CSS height (e.g. "34px"). */
  height?: string
}

function Skeleton({
  className,
  variant = "default",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const sizeStyle =
    width || height ? { width, height, ...style } : style

  if (variant === "inline") {
    return (
      <span
        data-slot="skeleton"
        data-variant="inline"
        className={cn("inline-block animate-pulse rounded-md bg-border-default", className)}
        style={sizeStyle}
        {...props}
      />
    )
  }

  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      style={sizeStyle}
      {...(props as React.ComponentProps<"div">)}
    />
  )
}

export { Skeleton }
