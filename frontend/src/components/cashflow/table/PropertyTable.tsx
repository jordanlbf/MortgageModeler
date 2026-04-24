"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { t } from "@/lib/theme";
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
  getRowClass,
  getRowHandlers,
  visibleCols = {},
}: SubTableProps) {
  if (!isInvestment) return null;

  const show = (key: string) => visibleCols[key] !== false;

  return (
    <table className="w-full text-[12px] table-fixed">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider sticky left-0 z-10 w-16" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Year</th>

          {/* ── Gearing (tax) view ─── */}
          {show("rent")       && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Rent</th>}
          {show("deductions") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Deductions</th>}
          {show("netGearing") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.secondary, background: t.surface.subtle, fontWeight: 600 }}>Gearing</th>}

          {/* ── Cashflow view (divider) ─── */}
          {show("taxSaved")    && (
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l-2" style={{ color: t.fg.tertiary, background: t.surface.subtle, borderColor: t.border.default }}>
              <span className="relative group inline-block cursor-help">
                Tax
                <span
                  className="invisible group-hover:visible absolute top-full right-0 mt-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap normal-case tracking-normal text-[11px] font-normal z-50 pointer-events-none"
                  style={{ background: t.card.elevated, color: t.fg.primary, border: `1px solid ${t.border.default}`, boxShadow: t.elevation.raised }}
                >
                  Tax refund (+) or additional tax (−)
                </span>
              </span>
            </th>
          )}
          {show("rent")        && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Rent</th>}
          {show("costs")       && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Costs</th>}
          {show("repayments")  && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Repayments</th>}
          {show("netCashflow") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.brand.default, background: t.surface.subtle, fontWeight: 600 }}>Cashflow</th>}
        </tr>
      </thead>
      <tbody>
        {yearData.map((y, i) => {
          const isSelected = getRowClass(y.year).includes("bg-brand");

          // Backend-authoritative aggregates. `totalDeductions` already folds
          // ongoing + interest + depreciation (Div 43 + Div 40) + borrowing-cost
          // amortisation; `rentalLossOrGain` already = rent − totalDeductions.
          const deductions = y.totalDeductions;
          const netGearing = y.rentalLossOrGain;

          // Cash-side math: real outflows only (no depreciation). Repayments =
          // loanRepayment = interest + principal (what leaves the bank).
          const netCashflow = y.rentalIncome - y.ongoingCosts - y.loanRepayment + y.taxSaved;

          return (
            <tr key={y.year} className={getRowClass(y.year)} {...getRowHandlers(y.year)}>
              <td className="px-3 py-2 text-left text-[12px] font-medium sticky left-0 z-10 border-t" style={{ color: isSelected ? t.brand.default : t.fg.primary, background: isSelected ? t.surface.hover : t.card.base, borderColor: t.border.subtle }}>
                {formatYearCell(y.year, i)}
              </td>

              {/* ── Gearing view ─── */}
              {show("rent") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.positive, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(y.rentalIncome))}
                </td>
              )}
              {show("deductions") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(deductions))}
                </td>
              )}
              {show("netGearing") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: signedColor(netGearing), fontWeight: 600, borderColor: t.border.subtle }}>
                  {signedValue(netGearing)}
                </td>
              )}

              {/* ── Cashflow view (divider) ─── */}
              {show("taxSaved") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t border-l-2" style={{ color: signedColor(y.taxSaved), borderColor: t.border.default }}>
                  {signedValue(y.taxSaved)}
                </td>
              )}
              {show("rent") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.positive, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(y.rentalIncome))}
                </td>
              )}
              {show("costs") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(y.ongoingCosts))}
                </td>
              )}
              {show("repayments") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(y.loanRepayment))}
                </td>
              )}
              {show("netCashflow") && (
                <td className="px-3 py-2 text-right text-[13px] tabular-nums border-t" style={{ color: signedColor(netCashflow), fontWeight: 600, borderColor: t.border.subtle }}>
                  {signedValue(netCashflow)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
