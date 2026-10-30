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
 * - `form` (ours, was the global `.form-input`): 44px bordered field on
 *   surface-raised, 15px medium tabular figures. Hover: border-strong +
 *   surface-hover. Focus: brand 50% border, brand 5% wash and a 3px
 *   focus-ring shadow. Placeholder fg-secondary 40%, weight 400.
 *
 * - `bar` (ours): compact 30px centred field on a white/.04 wash, 15px
 *   semibold tabular figures (Grants filter bar). Hover white/10 border +
 *   6% wash; focus brand 40% border + 2px brand-10% ring.
 *
 * - `underline` (ours): transparent inline field with a 1px bottom border
 *   that appears on hover (zinc-700) and turns brand on focus. 14px
 *   fg-secondary, placeholder fg-muted 50% (cashflow wizard EditableRow and
 *   depreciation rows). Width, alignment and tabular figures from the caller.
 *
 * Custom variants get none of the stock classes, so they render exactly as
 * the hand-rolled inputs they replaced.
 */
const INPUT_VARIANTS = {
  default:
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  filled:
    "rounded-lg border-0 bg-input-bg px-4 py-3 text-base font-medium text-fg-primary tabular-nums transition-all duration-150 placeholder:text-fg-muted focus:bg-input-bg-focus focus:ring-1 focus:ring-brand/25 focus:outline-none",
  form:
    "h-11 w-full rounded-lg border border-border-default bg-surface-raised px-4 text-[15px] font-medium text-fg-primary tabular-nums outline-none [transition:border-color_0.2s_ease,background_0.2s_ease,box-shadow_0.2s_ease] " +
    "hover:border-border-strong hover:bg-surface-hover " +
    "focus:border-[color:color-mix(in_srgb,var(--color-brand)_50%,transparent)] focus:bg-[color:color-mix(in_srgb,var(--color-brand)_5%,transparent)] focus:shadow-[0_0_0_3px_var(--color-focus-ring)] " +
    "placeholder:font-normal placeholder:text-[color:color-mix(in_srgb,var(--color-fg-secondary)_40%,transparent)]",
  bar:
    "h-[30px] w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 text-center text-[15px] font-semibold text-fg-primary/90 tabular-nums outline-none transition-all duration-150 hover:border-white/10 hover:bg-white/[0.06] focus:border-brand/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-brand)_10%,transparent)] placeholder:font-normal placeholder:text-fg-secondary/35",
  underline:
    "border-b border-transparent bg-transparent py-1 text-sm text-fg-secondary transition-colors placeholder:text-fg-muted/50 hover:border-zinc-700 focus:border-brand focus:outline-none",
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
