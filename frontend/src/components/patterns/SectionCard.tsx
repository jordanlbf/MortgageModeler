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

/** Padding per size; `flush` keeps it on the title row only. */
const PAD = {
  default: { body: "gap-5 p-6", head: "px-6 pt-6 pb-5" },
  sm: { body: "gap-3 px-5 py-4", head: "px-5 pt-4 pb-3" },
} as const;

/**
 * The app's standard card: raised surface, 16px radius, title row (title and
 * optional `description` left, `action` right) above the body.
 * - `size="sm"`: tighter padding, for KPI tiles and small stat cards.
 * - `flush`: no body padding, so children run edge to edge (e.g. sections with
 *   their own dividers, a table); the title row keeps its padding.
 *
 * Edit this file to restyle every card in the app at once.
 */
export default function SectionCard({
  title,
  titleAs = "h2",
  titleId,
  description,
  action,
  size = "default",
  flush = false,
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Card>, "title" | "variant"> & {
  title?: ReactNode;
  titleAs?: "h1" | "h2" | "h3";
  titleId?: string;
  /** One line under the title. */
  description?: ReactNode;
  /** Right side of the title row: a status pill, button, menu… */
  action?: ReactNode;
  size?: keyof typeof PAD;
  flush?: boolean;
}) {
  const pad = PAD[size];
  return (
    <Card
      variant="panel"
      data-pattern="section-card"
      data-size={size}
      className={cn("flex flex-col rounded-2xl bg-surface-raised", flush ? "gap-0" : pad.body, className)}
      {...props}
    >
      {(title || action) && (
        <div className={cn("flex items-start justify-between gap-4", flush && pad.head)}>
          <div className="flex min-w-0 flex-col gap-1">
            {title && (
              <SectionTitle as={titleAs} id={titleId} className={size === "sm" ? "text-[15px]" : undefined}>
                {title}
              </SectionTitle>
            )}
            {description && <p className="text-[13px] text-fg-tertiary">{description}</p>}
          </div>
          {action && <div className="flex min-h-6 shrink-0 items-center">{action}</div>}
        </div>
      )}
      {children}
    </Card>
  );
}
