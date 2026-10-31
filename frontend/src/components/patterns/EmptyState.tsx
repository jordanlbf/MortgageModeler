import type { ReactNode } from "react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";

/**
 * Nothing to show yet: icon, one-line title, short reason, optional action.
 * `tone="error"` tints the icon for a failed load.
 *
 * Edit this file to restyle every empty state in the app at once.
 */
export default function EmptyState({
  icon,
  title,
  body,
  action,
  tone = "default",
  className,
}: {
  icon: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "error";
  className?: string;
}) {
  return (
    <Card
      variant="panel"
      data-pattern="empty-state"
      className={cn("flex flex-col items-center gap-2 rounded-2xl bg-surface-raised px-6 py-8 text-center", className)}
    >
      <span
        className={cn(
          "mb-1 flex size-10 items-center justify-center rounded-full",
          tone === "error" ? "bg-status-error-bg text-status-error" : "bg-surface-hover text-fg-tertiary",
        )}
      >
        {icon}
      </span>
      <span className="text-[15px] font-semibold text-fg-primary">{title}</span>
      {body && <span className="text-[13px] text-fg-tertiary">{body}</span>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
