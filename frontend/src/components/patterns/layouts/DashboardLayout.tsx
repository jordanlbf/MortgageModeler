import type { ReactNode } from "react";
import { cn } from "cn";

/**
 * Dashboard page: a strip of KPI cards over the main content (charts, tables),
 * with an optional side panel on wide screens. Stacks below `xl`.
 *
 * Edit this file to change dashboard spacing, the KPI strip or the side panel
 * width everywhere.
 */
export default function DashboardLayout({
  kpis,
  side,
  children,
  className,
}: {
  /** KPI cards (usually StatCards); they share the row equally. */
  kpis?: ReactNode;
  /** Side panel content (e.g. a summary card). */
  side?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-layout="dashboard"
      className={cn("grid grid-cols-1 gap-6", side && "xl:grid-cols-[minmax(0,1fr)_340px]", className)}
    >
      <div className="flex min-w-0 flex-col gap-6">
        {kpis && <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">{kpis}</div>}
        {children}
      </div>
      {side && <div className="flex min-w-0 flex-col gap-6">{side}</div>}
    </div>
  );
}
