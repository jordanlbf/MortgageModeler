"use client";

import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { formatDollars } from "@/lib/formatters";

/** Dollar figure that tweens to its new value; "—" for null. */
export function Money({ value }: { value: number | null }) {
  const v = useAnimatedValue(value ?? 0, 400);
  if (value === null) return <span className="text-fg-muted">—</span>;
  return <>{formatDollars(Math.round(v)) || "$0"}</>;
}
