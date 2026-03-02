/**
 * Application constants — frequency mappings and input parsers.
 */

import type { Frequency } from "@/lib/types";

export const PERIODS_PER_YEAR: Record<Frequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
};

export const FREQ_LABELS: Record<Frequency, string> = {
  weekly: "week",
  fortnightly: "fortnight",
  monthly: "month",
};

export const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
];

/** Strip a formatted currency string to a plain number. */
export const parseCurrency = (s: string) => Number(s.replace(/[^0-9.]/g, ""));

/** Strip a formatted percent string to a plain number. */
export const parsePercent = (s: string) => Number(s.replace(/[^0-9.]/g, ""));

/** Strip a formatted years string to a plain number. */
export const parseYears = (s: string) => Number(s.replace(/[^0-9]/g, ""));
