"use client"

import * as React from "react"
import { cn } from "cn"
import { Slider as SliderPrimitive } from "radix-ui"

/**
 * Slider variants:
 * - `default` (stock shadcn).
 * - `accent` (ours, was ui/Slider's track): 16px hit area, 2px inset track on
 *   border-default, range = accent at 50%, 10px surface-raised thumb dot.
 *   Accent colour: `--slider-accent` (inherited CSS custom property,
 *   defaults to brand).
 *
 * Parity note: the old slider *meant* to draw a 2px accent-80% ring on the
 * thumb, but its class was built as `border-[2px]${…}` in a template literal,
 * which Tailwind's scanner never extracted, so no border ever rendered. The
 * shipped look is a borderless surface-raised dot that masks the track, and
 * that is what this variant reproduces. Adding the ring is a deliberate
 * design change (needs new baselines): add
 * `before:border-2 before:border-[color:color-mix(in_srgb,var(--slider-accent,var(--color-brand))_80%,transparent)]`.
 *
 * Thumb overhang (inventory risk R1): Radix keeps a thumb inside the track by
 * offsetting it by up to half its measured width. The `accent` thumb element
 * is therefore 0×0 and draws its circle with a `::before` centred on the
 * value, so Radix's offset is 0 and the circle overhangs the track ends by
 * 5px, exactly like the old hand-rolled slider.
 */
const STOCK = {
  root: "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
  track:
    "relative grow overflow-hidden rounded-full bg-muted data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1",
  range:
    "absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full",
  thumb:
    "relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50",
}

const ACCENT = {
  root: "relative flex h-4 w-full cursor-pointer touch-none items-center select-none data-disabled:cursor-default",
  track:
    "relative h-[2px] w-full grow rounded-full bg-border-default shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]",
  range:
    "absolute h-full rounded-full bg-[color:color-mix(in_srgb,var(--slider-accent,var(--color-brand))_50%,transparent)]",
  thumb:
    "relative block size-0 outline-none " +
    "before:pointer-events-none before:absolute before:top-0 before:left-0 before:size-[10px] before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-surface-raised before:content-[''] " +
    "focus-visible:before:shadow-[0_0_0_3px_var(--color-focus-ring)]",
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  variant = "default",
  thumbProps,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  variant?: "default" | "accent"
  /** Extra props for every thumb (the focusable `role="slider"` element), e.g. aria-valuetext. */
  thumbProps?: React.ComponentProps<typeof SliderPrimitive.Thumb>
}) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )
  const s = variant === "accent" ? ACCENT : STOCK

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      data-variant={variant}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(s.root, className)}
      {...props}
    >
      <SliderPrimitive.Track data-slot="slider-track" className={s.track}>
        <SliderPrimitive.Range data-slot="slider-range" className={s.range} />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          {...thumbProps}
          className={cn(s.thumb, thumbProps?.className)}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
