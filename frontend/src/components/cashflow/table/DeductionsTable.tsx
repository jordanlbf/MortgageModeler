"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { t } from "@/lib/theme";
import type { SubTableProps } from "./types";

export default function DeductionsTable({
  yearData,
  isInvestment,
  formatYearCell,
  getRowClass,
  getRowHandlers,
  visibleCols = {},
}: SubTableProps) {
  const show = (key: string) => visibleCols[key] !== false;
  const showInv = (key: string) => isInvestment && show(key);

  return (
    <table className="w-full text-[12px] table-fixed">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider sticky left-0 z-[1] w-16" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Year</th>
          {show("holding") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Holding</th>}
          {showInv("interest") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Interest</th>}
          {showInv("div43") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l" style={{ color: t.fg.tertiary, background: t.surface.subtle, borderColor: t.border.subtle }}>Div 43</th>}
          {showInv("div40") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Div 40</th>}
          {showInv("totalDepr") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.secondary, background: t.surface.subtle, fontWeight: 600 }}>Total depreciation</th>}
          {show("totalDed") && (
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l" style={{ color: t.brand.default, background: t.surface.subtle, fontWeight: 600, borderColor: t.border.subtle }}>
              {isInvestment ? "Total deductions" : "Total expenses"}
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {yearData.map((y, i) => {
          const isSelected = getRowClass(y.year).includes("bg-brand");

          const depr = y.depDiv43 + y.depDiv40;
          const totalDed = isInvestment ? y.ongoingCosts + y.interestPortion + depr : y.ongoingCosts;

          return (
            <tr key={y.year} className={getRowClass(y.year)} {...getRowHandlers(y.year)}>
              <td className="px-3 py-2 text-left text-[12px] font-medium sticky left-0 z-[1] border-t" style={{ color: isSelected ? t.brand.default : t.fg.primary, background: isSelected ? t.surface.hover : t.card.base, borderColor: t.border.subtle }}>
                {formatYearCell(y.year, i)}
              </td>
              {show("holding") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.fg.primary, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(y.ongoingCosts))}
                </td>
              )}
              {showInv("interest") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.fg.primary, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(y.interestPortion))}
                </td>
              )}
              {showInv("div43") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t border-l" style={{ color: t.fg.primary, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(y.depDiv43))}
                </td>
              )}
              {showInv("div40") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.fg.primary, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(y.depDiv40))}
                </td>
              )}
              {showInv("totalDepr") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.fg.primary, fontWeight: 500, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(depr))}
                </td>
              )}
              {show("totalDed") && (
                <td className="px-3 py-2 text-right text-[13px] tabular-nums border-t border-l" style={{ color: t.data.positive, fontWeight: 600, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(totalDed))}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
