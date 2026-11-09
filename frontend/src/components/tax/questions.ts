import type { TaxInputs, TaxMoneyField } from "@/hooks/useTaxState";
import { formatDollars } from "@/lib/formatters";

/** One money line under a question. */
export type TaxField = { key: TaxMoneyField; label: string; hint?: string };

/**
 * A yes/no question on the income timeline. A "yes" opens its `fields`, or
 * sets its `flag` input; a "no" clears them.
 */
export type TaxQuestion = {
  id: string;
  /** Asked while it's the open question. */
  ask: string;
  /** Once answered (or still ahead), the question shrinks to this. */
  short: string;
  help?: string;
  fields?: TaxField[];
  flag?: "phi" | "sapto";
  /** A total shown under fields, when there are several. */
  summary?: (i: TaxInputs) => string | null;
};

const PROPERTY: TaxField[] = [
  { key: "rental", label: "Annual rent" },
  { key: "rentalDeductions", label: "Property expenses", hint: "Loan interest, rates, insurance and depreciation." },
];
const SAVINGS: TaxField[] = [
  { key: "interest", label: "Interest" },
  { key: "dividend", label: "Dividends" },
  { key: "franking", label: "Franking credits" },
];
const GAINS: TaxField[] = [
  { key: "capitalGainShort", label: "Held under a year" },
  { key: "capitalGainLong", label: "Held over a year", hint: "Only half of this is taxed." },
];
const SUPER: TaxField[] = [
  { key: "salSac", label: "Salary sacrificed to super" },
  { key: "rfb", label: "Reportable fringe benefits" },
];

const sum = (i: TaxInputs, fields: TaxField[]) => fields.reduce((a, f) => a + i[f.key], 0);
const total = (fields: TaxField[]) => (i: TaxInputs) => (sum(i, fields) > 0 ? formatDollars(sum(i, fields)) : null);

/** Asked in this order, most common first, after salary. */
export const TAX_QUESTIONS: TaxQuestion[] = [
  {
    id: "property", short: "Investment property", ask: "Do you own an investment property?",
    fields: PROPERTY,
    summary: (i) => {
      if (!i.rental && !i.rentalDeductions) return null;
      const n = i.rental - i.rentalDeductions;
      return n < 0 ? `${formatDollars(-n)} loss` : n > 0 ? `${formatDollars(n)} profit` : "Breaks even";
    },
  },
  { id: "savings", short: "Interest or dividends", ask: "Any interest or dividends?", help: "From savings accounts, term deposits or shares.", fields: SAVINGS, summary: total(SAVINGS) },
  { id: "gains", short: "Capital gains", ask: "Did you sell anything for a profit?", help: "Shares, crypto or property: capital gains.", fields: GAINS, summary: total(GAINS) },
  { id: "work", short: "Work expenses", ask: "Any work expenses to claim?", help: "Costs you paid yourself for your job.", fields: [{ key: "workDeductions", label: "Amount to claim" }] },
  { id: "help", short: "HELP debt", ask: "Do you have a HELP or student debt?", fields: [{ key: "hecsBal", label: "Balance owing" }] },
  {
    id: "super", short: "Super or fringe benefits", ask: "Do you salary sacrifice or get fringe benefits?",
    help: "Less common. They’re added back for HELP and the surcharge.", fields: SUPER, summary: total(SUPER),
  },
  { id: "phi", short: "Private hospital cover", ask: "Do you have private hospital cover?", help: "Without it, higher earners pay an extra surcharge.", flag: "phi" },
  { id: "sapto", short: "Seniors offset", ask: "Are you a senior or pensioner?", help: "You may get the seniors and pensioners offset.", flag: "sapto" },
];

/** Whether a question's figures or flag are already filled in. */
export const isFilled = (q: TaxQuestion, i: TaxInputs) => (q.flag ? i[q.flag] : sum(i, q.fields ?? []) > 0);

/**
 * Answers to start from. Blank inputs: none, so the questions are asked.
 * Inputs that already hold figures (a saved or sample set): all answered,
 * "yes" where something is filled in.
 */
export function initialAnswers(i: TaxInputs): Record<string, boolean> {
  const started = i.salary > 0 || TAX_QUESTIONS.some((q) => isFilled(q, i));
  return started ? Object.fromEntries(TAX_QUESTIONS.map((q) => [q.id, isFilled(q, i)])) : {};
}

/** A folded answer in a few words: "$5,900 loss", "$35,000", "Yes" or "No". */
export function answerSummary(q: TaxQuestion, yes: boolean, i: TaxInputs): string {
  if (!yes) return "No";
  if (q.flag || !q.fields) return "Yes";
  return q.summary?.(i) ?? (sum(i, q.fields) > 0 ? formatDollars(sum(i, q.fields)) : "Yes, $0 so far");
}
