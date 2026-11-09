import { formatDollars } from "@/lib/formatters";

/** Whole dollars, "$0" for zero. */
export const money = (n: number) => formatDollars(Math.round(n)) || "$0";

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/** 246 → "20 years 6 months". */
export function span(months: number) {
  const y = Math.floor(months / 12), m = months % 12;
  return [y > 0 && plural(y, "year"), m > 0 && plural(m, "month")].filter(Boolean).join(" ") || "0 months";
}

/** 246 → "20 yrs 6 mo", for tight spots (timeline ticks, comparison cells). */
export function spanShort(months: number) {
  const y = Math.floor(months / 12), m = months % 12;
  return [y > 0 && `${y} yr${y === 1 ? "" : "s"}`, m > 0 && `${m} mo`].filter(Boolean).join(" ") || "0 mo";
}

/** 246 → "20y 6m", for a figure in a tight row. */
export function spanTiny(months: number) {
  const y = Math.floor(months / 12), m = months % 12;
  return [y > 0 && `${y}y`, m > 0 && `${m}m`].filter(Boolean).join(" ") || "0m";
}
