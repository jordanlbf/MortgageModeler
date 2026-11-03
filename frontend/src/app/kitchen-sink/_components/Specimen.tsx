import { cn } from "cn";

/**
 * A plain raised surface to show blocks on. Deliberately not a SectionCard, so
 * the Blocks page shows blocks alone, without any card styling.
 */
export default function Specimen({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-lg bg-surface-raised p-5", className)}>{children}</div>;
}
