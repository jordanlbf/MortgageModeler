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

/** Strip a formatted string to a plain number (keeps digits and decimal point). */
export const parseNumeric = (s: string) => Number(s.replace(/[^0-9.]/g, ""));

export const parseCurrency = parseNumeric;
export const parsePercent = parseNumeric;

/** Strip a formatted years string to a plain number. */
export const parseYears = (s: string) => Number(s.replace(/[^0-9]/g, ""));

/** Tool definitions — used by homepage grid and placeholder pages. */
export interface Tool {
  id: string;
  title: string;
  desc: string;   // shown on placeholder page
  icon: string;   // emoji fallback for placeholder page; homepage uses SVG
  active: boolean;
  badge?: string;  // custom badge label (defaults to "Live" / "Soon")
}

export const TOOLS: Tool[] = [
  { id: "amortisation", title: "Amortisation", desc: "Repayments & interest over time", icon: "📊", active: true },
  { id: "ppor-vs-rent", title: "PPOR vs Rent", desc: "Buy or keep renting?", icon: "⚖️", active: true, badge: "Beta" },
  { id: "offset-impact", title: "Offset Impact", desc: "See how offsets save interest", icon: "🏦", active: false },
  { id: "rate-changes", title: "Rate Changes", desc: "Model variable rate shifts", icon: "📈", active: false },
  { id: "equity-growth", title: "Equity Growth", desc: "Track property value over time", icon: "🏠", active: false },
  { id: "tax-deductions", title: "Tax & Deductions", desc: "Investment property tax benefits", icon: "🧾", active: false },
];
