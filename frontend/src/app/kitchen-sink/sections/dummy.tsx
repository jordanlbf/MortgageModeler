import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

/*
 * Dummy content for the Components page. Deliberately generic: these exist to
 * tune the shared patterns, not to show real features.
 */

export const LINES = [
  { label: "Line item one", value: 48_250 },
  { label: "Line item two", value: 12_400 },
  { label: "Line item three", value: 3_180 },
];
export const LINES_TOTAL = LINES.reduce((sum, l) => sum + l.value, 0);

export function MenuButton() {
  return (
    <Button variant="ghost-icon" className="rounded p-1" aria-label="Card options">
      <MoreHorizontal className="size-4 text-fg-tertiary" aria-hidden="true" />
    </Button>
  );
}

/** A dashed box standing in for content (a chart, a form, an image). */
export function Placeholder({ h = 120, label }: { h?: number; label?: string }) {
  return (
    <div
      className="flex w-full items-center justify-center rounded-lg border border-dashed border-border-subtle text-[12px] text-fg-muted"
      style={{ height: h }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}
