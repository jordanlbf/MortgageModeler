import type { ComponentProps } from "react";
import { cn } from "cn";

/**
 * Section title typography, shared by every card heading.
 * - `default`: 20px semibold sentence case (Purchase Costs).
 * - `brand`: 20px semibold uppercase in brand teal (Tax).
 */
const TITLE = {
  default: "text-[20px] leading-tight font-semibold tracking-[-0.01em] text-fg-primary",
  brand: "text-[20px] leading-tight font-semibold uppercase tracking-widest text-brand",
} as const;

export default function SectionTitle({
  as: Tag = "h2",
  variant = "default",
  className,
  ...props
}: ComponentProps<"h2"> & { as?: "h1" | "h2" | "h3"; variant?: keyof typeof TITLE }) {
  return <Tag data-slot="section-title" className={cn(TITLE[variant], className)} {...props} />;
}
