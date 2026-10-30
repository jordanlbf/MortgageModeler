import * as React from "react"
import { cn } from "cn"

/**
 * Input variants:
 * - `default` (stock shadcn): h-8 bordered input.
 * - `filled` (ours): borderless input-bg field, 16px medium tabular figures,
 *   brand focus ring (cashflow wizard InputField). Width/padding-right for a
 *   suffix adornment come from the caller.
 * - `ghost` (ours): transparent, no outline. For click-to-edit values whose
 *   typography comes entirely from the caller (EditableValue, SliderField).
 *   Set `data-editing="true"` while editing for a white/.06 wash and a 1px
 *   ring in `--input-accent` (tax EditableField).
 *
 * Custom variants get none of the stock classes, so they render exactly as
 * the hand-rolled inputs they replaced.
 */
const INPUT_VARIANTS = {
  default:
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  filled:
    "rounded-lg border-0 bg-input-bg px-4 py-3 text-base font-medium text-fg-primary tabular-nums transition-all duration-150 placeholder:text-fg-muted focus:bg-input-bg-focus focus:ring-1 focus:ring-brand/25 focus:outline-none",
  ghost:
    "bg-transparent outline-none data-[editing=true]:bg-[color:rgba(255,255,255,0.06)] data-[editing=true]:shadow-[0_0_0_1px_var(--input-accent)]",
} as const

type InputVariant = keyof typeof INPUT_VARIANTS

function Input({
  className,
  type,
  variant = "default",
  ...props
}: React.ComponentProps<"input"> & { variant?: InputVariant }) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(INPUT_VARIANTS[variant], className)}
      {...props}
    />
  )
}

export { Input }
export type { InputVariant }
