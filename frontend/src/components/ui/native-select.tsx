import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

/**
 * NativeSelect variants:
 * - `default` (stock shadcn): wrapper + bordered select + lucide chevron.
 * - `form` (ours, was the global `.form-select`): a bare 44px select (no
 *   wrapper, no icon) on surface-raised with a 1px border-default, 15px
 *   medium text and a 12px chevron drawn as a background image at right
 *   12px. Hover: border-strong + surface-hover; focus: brand 50% border +
 *   3px focus-ring shadow. Pair it with `NativeSelectOption variant="form"`.
 *   Hover changes only background-color, so the chevron stays visible.
 */
const FORM_CHEVRON =
  "bg-[url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2012%2012%27%3E%3Cpath%20d=%27M3%205l3%203%203-3%27%20stroke=%27rgba%28113,113,122,0.55%29%27%20stroke-width=%271.5%27%20fill=%27none%27%20stroke-linecap=%27round%27/%3E%3C/svg%3E)]"

const FORM_SELECT =
  "h-11 w-full cursor-pointer appearance-none rounded-lg border border-border-default bg-surface-raised py-0 pr-8 pl-4 text-[15px] font-medium text-fg-primary outline-none " +
  FORM_CHEVRON +
  " bg-no-repeat bg-[position:right_12px_center] [transition:border-color_0.2s_ease,background-color_0.2s_ease] " +
  "hover:border-border-strong hover:bg-surface-hover " +
  "focus:border-[color:color-mix(in_srgb,var(--color-brand)_50%,transparent)] focus:shadow-[0_0_0_3px_var(--color-focus-ring)]"

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
  variant?: "default" | "form"
}

function NativeSelect({
  className,
  size = "default",
  variant = "default",
  ...props
}: NativeSelectProps) {
  if (variant === "form") {
    return (
      <select
        data-slot="native-select"
        data-variant="form"
        className={cn(FORM_SELECT, className)}
        {...props}
      />
    )
  }
  return (
    <div
      className={cn(
        "group/native-select relative w-fit has-[select:disabled]:opacity-50",
        className
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className="h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm transition-colors outline-none select-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-[size=sm]:py-0.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
        {...props}
      />
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground select-none" aria-hidden="true" data-slot="native-select-icon" />
    </div>
  )
}

function NativeSelectOption({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"option"> & { variant?: "default" | "form" }) {
  return (
    <option
      data-slot="native-select-option"
      className={cn(
        variant === "form"
          ? "bg-surface-app text-fg-primary"
          : "bg-[Canvas] text-[CanvasText]",
        className
      )}
      {...props}
    />
  )
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
