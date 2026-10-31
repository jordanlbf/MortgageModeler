import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";

/**
 * Section title typography, shared by every card heading.
 * - `default`: 20px semibold sentence case (Purchase Costs).
 * - `brand`: 20px semibold uppercase in brand teal (Tax).
 */
const TITLE = {
  default: "text-[20px] leading-tight font-semibold tracking-[-0.01em] text-fg-primary",
  brand: "text-[20px] leading-tight font-semibold uppercase tracking-widest text-brand",
} as const;

export function SectionTitle({
  as: Tag = "h2",
  variant = "default",
  className,
  ...props
}: ComponentProps<"h2"> & { as?: "h1" | "h2" | "h3"; variant?: keyof typeof TITLE }) {
  return <Tag data-slot="section-title" className={cn(TITLE[variant], className)} {...props} />;
}

/**
 * The app's standard card: raised surface, 16px radius, title row (title left,
 * `action` right) above the body. `flush` drops the body padding so children
 * can run edge to edge (e.g. sections with their own dividers); the title row
 * keeps its padding.
 *
 * Edit this file to restyle every titled card in the app at once.
 */
export default function SectionCard({
  title,
  titleAs = "h2",
  titleId,
  action,
  flush = false,
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Card>, "title" | "variant"> & {
  title?: ReactNode;
  titleAs?: "h1" | "h2" | "h3";
  titleId?: string;
  /** Right side of the title row: a status pill, button, menu… */
  action?: ReactNode;
  flush?: boolean;
}) {
  return (
    <Card
      variant="panel"
      data-pattern="section-card"
      className={cn("flex flex-col rounded-2xl bg-surface-raised", flush ? "gap-0" : "gap-5 p-6", className)}
      {...props}
    >
      {(title || action) && (
        <div className={cn("flex items-center justify-between gap-4", flush && "px-6 pt-6 pb-5")}>
          {title && <SectionTitle as={titleAs} id={titleId}>{title}</SectionTitle>}
          {action}
        </div>
      )}
      {children}
    </Card>
  );
}
