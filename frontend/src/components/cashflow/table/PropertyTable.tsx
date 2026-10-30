"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { t } from "@/lib/theme";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SubTableProps } from "./types";

function signedColor(v: number): string {
  if (v > 0) return t.data.positive;
  if (v < 0) return t.data.negative;
  return t.fg.primary;
}

function signedValue(v: number): string {
  return (v > 0 ? "+" : "") + formatDollarsSigned(Math.round(v));
}

export default function PropertyTable({
  yearData,
  isInvestment,
  formatYearCell,
  getRowProps,
  visibleCols = {},
}: SubTableProps) {
  if (!isInvestment) return null;

  const show = (key: string) => visibleCols[key] !== false;

  return (
    <Table variant="dense">
      <TableHeader>
        <TableRow>
          <TableHead>Year</TableHead>

          {/* ── Gearing (tax) view ─── */}
          {show("rent")       && <TableHead>Rent</TableHead>}
          {show("deductions") && <TableHead>Deductions</TableHead>}
          {show("netGearing") && <TableHead data-tone="total">Gearing</TableHead>}

          {/* ── Cashflow view (divider) ─── */}
          {show("taxSaved") && (
            <TableHead data-divider="strong">
              {/* Instant CSS hover hint. Deliberately not a Radix Tooltip: its
                  portalled, position:fixed popper is composited by Chrome, so
                  the text loses LCD antialiasing and renders visibly
                  different from this in-flow hint. */}
              <span className="relative group inline-block cursor-help">
                Tax
                <span
                  className="invisible group-hover:visible absolute top-full right-0 mt-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap normal-case tracking-normal text-[11px] font-normal z-50 pointer-events-none"
                  style={{ background: t.card.elevated, color: t.fg.primary, border: `1px solid ${t.border.default}`, boxShadow: t.elevation.raised }}
                >
                  Tax refund (+) or additional tax (−)
                </span>
              </span>
            </TableHead>
          )}
          {show("rent")        && <TableHead>Rent</TableHead>}
          {show("costs")       && <TableHead>Costs</TableHead>}
          {show("repayments")  && <TableHead>Repayments</TableHead>}
          {show("netCashflow") && <TableHead data-tone="net">Cashflow</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {yearData.map((y) => {
          // Backend-authoritative aggregates. `totalDeductions` already folds
          // ongoing + interest + depreciation (Div 43 + Div 40) + borrowing-cost
          // amortisation; `rentalLossOrGain` already = rent − totalDeductions.
          const deductions = y.totalDeductions;
          const netGearing = y.rentalLossOrGain;

          // Cash-side math: real outflows only (no depreciation). Repayments =
          // loanRepayment = interest + principal (what leaves the bank).
          const netCashflow = y.rentalIncome - y.ongoingCosts - y.loanRepayment + y.taxSaved;

          return (
            <TableRow key={y.year} {...getRowProps(y.year)}>
              <TableCell>{formatYearCell(y.year)}</TableCell>

              {/* ── Gearing view ─── */}
              {show("rent") && (
                <TableCell className="text-data-positive">
                  {formatDollarsSigned(Math.round(y.rentalIncome))}
                </TableCell>
              )}
              {show("deductions") && (
                <TableCell className="text-data-negative">
                  {formatDollarsSigned(-Math.round(deductions))}
                </TableCell>
              )}
              {show("netGearing") && (
                <TableCell className="font-semibold" style={{ color: signedColor(netGearing) }}>
                  {signedValue(netGearing)}
                </TableCell>
              )}

              {/* ── Cashflow view (divider) ─── */}
              {show("taxSaved") && (
                <TableCell data-divider="strong" style={{ color: signedColor(y.taxSaved) }}>
                  {signedValue(y.taxSaved)}
                </TableCell>
              )}
              {show("rent") && (
                <TableCell className="text-data-positive">
                  {formatDollarsSigned(Math.round(y.rentalIncome))}
                </TableCell>
              )}
              {show("costs") && (
                <TableCell className="text-data-negative">
                  {formatDollarsSigned(-Math.round(y.ongoingCosts))}
                </TableCell>
              )}
              {show("repayments") && (
                <TableCell className="text-data-negative">
                  {formatDollarsSigned(-Math.round(y.loanRepayment))}
                </TableCell>
              )}
              {show("netCashflow") && (
                <TableCell data-tone="net" style={{ color: signedColor(netCashflow) }}>
                  {signedValue(netCashflow)}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
