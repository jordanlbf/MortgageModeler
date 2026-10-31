/** Realistic, worst-case sample data for the kitchen sink. No lorem ipsum. */

export const MONEY = {
  zero: 0,
  small: 1_247,
  large: 1_234_567.89,
  negative: -47_382,
} as const;

export const PERCENT = ["0%", "4.2%", "-12.5%", "127.3%"] as const;

export const NULL_VALUE = "—";

/** Includes one name long enough to need truncation. */
export const PROPERTIES = [
  { address: "42 Smith Street, Clayfield QLD 4011", suburb: "Clayfield", value: 1_085_000, loan: 712_400, rate: 6.14, cashflow: 10_310, type: "Owner-occupied" },
  { address: "15 Beach Road, Coolangatta QLD 4225", suburb: "Coolangatta", value: 948_500, loan: 655_000, rate: 6.39, cashflow: -2_140, type: "Investment" },
  { address: "8/120 Collins Street, Indooroopilly QLD 4068", suburb: "Indooroopilly", value: 612_000, loan: 489_600, rate: 6.79, cashflow: -2_105, type: "Interest-only" },
  { address: "Unit 1407, The Waterfront Residences, 33 Remembrance Drive, South Brisbane QLD 4101", suburb: "South Brisbane", value: 1_234_567.89, loan: 987_654, rate: 5.99, cashflow: 0, type: "Investment" },
  { address: "3 Ironbark Court, Toowoomba QLD 4350", suburb: "Toowoomba", value: 538_000, loan: 0, rate: 0, cashflow: 23_960, type: "Owner-occupied" },
] as const;

/** Near, far and yesterday, for relative-time formatting. */
export const DATES = {
  yesterday: "Yesterday",
  near: "In 3 days",
  far: "14 Mar 2041",
} as const;
