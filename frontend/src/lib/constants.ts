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
const parseNumeric = (s: string) => Number(s.replace(/[^0-9.]/g, ""));

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
  { id: "tax", title: "Tax Calculator", desc: "Income tax & take-home pay", icon: "🧮", active: true },
  { id: "ppor-vs-rent", title: "PPOR vs Rent", desc: "Buy or keep renting?", icon: "⚖️", active: true, badge: "Beta" },
  { id: "grants", title: "Government Grants", desc: "First home buyer schemes & eligibility", icon: "🏛️", active: true },
  { id: "purchase-costs", title: "Purchase Costs", desc: "Upfront costs, stamp duty & grants", icon: "🧾", active: true },
  { id: "cashflow", title: "Cashflow", desc: "Cost of holding & equity over time", icon: "💸", active: true },
  { id: "offset-impact", title: "Offset Impact", desc: "See how offsets save interest", icon: "🏦", active: false },
  { id: "rate-changes", title: "Rate Changes", desc: "Model variable rate shifts", icon: "📈", active: false },
  { id: "equity-growth", title: "Equity Growth", desc: "Track property value over time", icon: "🏠", active: false },
  { id: "tax-deductions", title: "Tax & Deductions", desc: "Investment property tax benefits", icon: "🧾", active: false },
];

/** Per-tool brand colours — used on the homepage card grid. */
export const TOOL_COLORS: Record<string, { primary: string; glow: string }> = {
  amortisation:     { primary: "#2dd4bf", glow: "rgba(45,212,191,0.08)" },
  tax:              { primary: "#60a5fa", glow: "rgba(96,165,250,0.08)" },
  "ppor-vs-rent":   { primary: "#a78bfa", glow: "rgba(167,139,250,0.08)" },
  grants:           { primary: "#34d399", glow: "rgba(52,211,153,0.08)" },
  "purchase-costs": { primary: "#f59e0b", glow: "rgba(245,158,11,0.08)" },
  cashflow:         { primary: "#fb7185", glow: "rgba(251,113,133,0.08)" },
  "offset-impact":  { primary: "#fb923c", glow: "rgba(251,146,60,0.08)" },
  "rate-changes":   { primary: "#f87171", glow: "rgba(248,113,113,0.08)" },
  "equity-growth":  { primary: "#38bdf8", glow: "rgba(56,189,248,0.08)" },
  "tax-deductions": { primary: "#facc15", glow: "rgba(250,204,21,0.08)" },
};
