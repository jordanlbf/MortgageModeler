/**
 * Shared domain types.
 *
 * API-specific request/response types stay in api.ts.
 * Types used across multiple components live here.
 */

export type Frequency = "weekly" | "fortnightly" | "monthly";

/** Mapped chart data point used by AmortisationChart. */
export interface ChartDataPoint {
  y: number;
  bal: number;
  int: number;
  eq: number;
  paid: number;
  lvr: number;
  offset: number;
}
