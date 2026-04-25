"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { t } from "@/lib/theme";
import type { SubTableProps } from "./types";

export default function SummaryTable({
  yearData,
  isInvestment,
  formatYearCell,
  getRowClass,
  getRowHandlers,
  visibleCols = {},
}: SubTableProps) {
  const show = (key: string) => visibleCols[key] !== false;

  return (
    <table className="w-full text-[12px] table-fixed">
      <thead>
        <tr>
          <th
            className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider sticky left-0 z-10 w-16"
            style={{ color: t.fg.tertiary, background: t.surface.subtle }}
          >
            Year
          </th>
          {show("salary") && (
            <th
              className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider"
              style={{ color: t.fg.tertiary, background: t.surface.subtle }}
            >
              Salary
            </th>
          )}
          {show("rent") && isInvestment && (
            <th
              className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider"
              style={{ color: t.fg.tertiary, background: t.surface.subtle }}
            >
              Rent
            </th>
          )}
          {show("totalIn") && (
            <th
              className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider"
              style={{ color: t.fg.secondary, background: t.surface.subtle, fontWeight: 600 }}
            >
              Total in
            </th>
          )}
          {show("holding") && (
            <th
              className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l"
              style={{ color: t.fg.tertiary, background: t.surface.subtle, borderColor: t.border.subtle }}
            >
              Holding
            </th>
          )}
          {show("repay") && (
            <th
              className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider"
              style={{ color: t.fg.tertiary, background: t.surface.subtle }}
            >
              Repay
            </th>
          )}
          {show("tax") && (
            <th
              className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider"
              style={{ color: t.fg.tertiary, background: t.surface.subtle }}
            >
              Tax
            </th>
          )}
          {show("totalOut") && (
            <th
              className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider"
              style={{ color: t.fg.secondary, background: t.surface.subtle, fontWeight: 600 }}
            >
              Total out
            </th>
          )}
          {show("net") && (
            <th
              className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l"
              style={{ color: t.brand.default, background: t.surface.subtle, fontWeight: 600, borderColor: t.border.subtle }}
            >
              Net
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {yearData.map((y, i) => {
          const isSelected = getRowClass(y.year).includes("bg-brand");

          const totalIn = y.salary + (isInvestment ? y.rentalIncome : 0);
          const totalOut = y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc;
          const net = totalIn - totalOut;

          return (
            <tr key={y.year} className={getRowClass(y.year)} {...getRowHandlers(y.year)}>
              <td
                className="px-3 py-2 text-left text-[12px] font-medium sticky left-0 z-10 border-t"
                style={{
                  color: isSelected ? t.brand.default : t.fg.primary,
                  background: isSelected ? t.surface.hover : t.card.base,
                  borderColor: t.border.subtle
                }}
              >
                {formatYearCell(y.year, i)}
              </td>
              {show("salary") && (
                <td
                  className="px-3 py-2 text-right text-[12px] tabular-nums border-t"
                  style={{ color: t.fg.primary, borderColor: t.border.subtle }}
                >
                  {formatDollarsSigned(Math.round(y.salary))}
                </td>
              )}
              {show("rent") && isInvestment && (
                <td
                  className="px-3 py-2 text-right text-[12px] tabular-nums border-t"
                  style={{ color: t.fg.primary, borderColor: t.border.subtle }}
                >
                  {formatDollarsSigned(Math.round(y.rentalIncome))}
                </td>
              )}
              {show("totalIn") && (
                <td
                  className="px-3 py-2 text-right text-[12px] tabular-nums border-t"
                  style={{ color: t.fg.primary, fontWeight: 500, borderColor: t.border.subtle }}
                >
                  {formatDollarsSigned(Math.round(totalIn))}
                </td>
              )}
              {show("holding") && (
                <td
                  className="px-3 py-2 text-right text-[12px] tabular-nums border-t border-l"
                  style={{ color: t.data.negative, borderColor: t.border.subtle }}
                >
                  {formatDollarsSigned(-Math.round(y.ongoingCosts))}
                </td>
              )}
              {show("repay") && (
                <td
                  className="px-3 py-2 text-right text-[12px] tabular-nums border-t"
                  style={{ color: t.data.negative, borderColor: t.border.subtle }}
                >
                  {formatDollarsSigned(-Math.round(y.loanRepayment))}
                </td>
              )}
              {show("tax") && (
                <td
                  className="px-3 py-2 text-right text-[12px] tabular-nums border-t"
                  style={{ color: t.data.negative, borderColor: t.border.subtle }}
                >
                  {formatDollarsSigned(-Math.round(y.incomeTaxCalc))}
                </td>
              )}
              {show("totalOut") && (
                <td
                  className="px-3 py-2 text-right text-[12px] tabular-nums border-t"
                  style={{ color: t.data.negative, fontWeight: 500, borderColor: t.border.subtle }}
                >
                  {formatDollarsSigned(-Math.round(totalOut))}
                </td>
              )}
              {show("net") && (
                <td
                  className="px-3 py-2 text-right text-[13px] tabular-nums border-t border-l"
                  style={{ color: t.data.positive, fontWeight: 600, borderColor: t.border.subtle }}
                >
                  {formatDollarsSigned(Math.round(net))}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
