import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";
import { Label } from "@/components/ui/label";
import SectionCard from "./SectionCard";

/**
 * The bar at the top of a page, in place of a bare page title: a slim card with
 * a caps `eyebrow` (the tool), the page `title` (an h1) and `actions` on the right.
 *
 * Edit this file to restyle every page's top bar at once.
 */
export default function PageBar({
  eyebrow,
  title,
  titleAs: Title = "h1",
  actions,
  className,
  ...props
}: Omit<ComponentProps<typeof SectionCard>, "title" | "size" | "flush"> & {
  /** Small caps line above the title, e.g. the tool name. */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** The page's h1 by default; lower only where the bar isn't the page's top (e.g. a gallery). */
  titleAs?: "h1" | "h2" | "h3";
  /** Right side: buttons for the whole page. */
  actions?: ReactNode;
}) {
  return (
    <SectionCard
      size="sm"
      data-card="page-bar"
      className={cn("flex-row flex-wrap items-center justify-between gap-x-6", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow && (
          <Label variant="caps" asChild>
            <span>{eyebrow}</span>
          </Label>
        )}
        <Title className="truncate text-[16px] font-semibold text-fg-primary">{title}</Title>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </SectionCard>
  );
}
