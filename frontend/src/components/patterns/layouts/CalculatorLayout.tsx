import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";

/**
 * Calculator page: a fixed-width inputs column on the left, results on the
 * right (a column of cards). Stacks below `lg`. Used by Purchase Costs.
 *
 * Edit this file to change the input column width, gaps or breakpoint on every
 * calculator page.
 */
export default function CalculatorLayout({
  inputs,
  children,
  className,
  ...results
}: ComponentProps<"section"> & {
  /** The inputs column (usually one flush SectionCard). */
  inputs: ReactNode;
}) {
  return (
    <div
      data-layout="calculator"
      className={cn("grid grid-cols-1 gap-6 lg:min-h-[640px] lg:grid-cols-[320px_minmax(0,1fr)]", className)}
    >
      <div className="min-w-0">{inputs}</div>
      <section className="flex min-w-0 flex-col gap-6" {...results}>
        {children}
      </section>
    </div>
  );
}
