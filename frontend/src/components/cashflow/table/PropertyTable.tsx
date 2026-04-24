"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { t } from "@/lib/theme";
import type { SubTableProps } from "./types";

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
    <table className="w-full text-[12px]">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider sticky left-0 z-[1]" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Year</th>
          {show("rent") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Rent</th>}
          {show("holding") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l" style={{ color: t.fg.tertiary, background: t.surface.subtle, borderColor: t.border.subtle }}>Holding</th>}
          {show("depr") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Depr.</th>}
          {show("netGearing") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.secondary, background: t.surface.subtle, fontWeight: 600 }}>Net gearing</th>}
          {show("taxSaved") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l" style={{ color: t.fg.tertiary, background: t.surface.subtle, borderColor: t.border.subtle }}>Tax saved</th>}
          {show("netCashflow") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l" style={{ color: t.brand.default, background: t.surface.subtle, fontWeight: 600, borderColor: t.border.subtle }}>Net cashflow</th>}
        </tr>
      </thead>
      <tbody>
        {yearData.map((y, i) => {
          const isSelected = getRowClass(y.year).includes("bg-brand");

          const holding = y.interestPortion + y.ongoingCosts;
          const depr = y.depDiv43 + y.depDiv40;
          const netGearing = y.rentalIncome - holding - depr;

          return (
            <tr key={y.year} className={getRowClass(y.year)} {...getRowHandlers(y.year)}>
              <td className="px-3 py-2 text-left text-[12px] font-medium sticky left-0 z-[1] border-t" style={{ color: isSelected ? t.brand.default : t.fg.primary, background: isSelected ? t.surface.hover : t.card.base, borderColor: t.border.subtle }}>
                {formatYearCell(y.year, i)}
              </td>
              {show("rent") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.fg.primary, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(y.rentalIncome))}
                </td>
              )}
              {show("holding") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t border-l" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(holding))}
                </td>
              )}
              {show("depr") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(depr))}
                </td>
              )}
              {show("netGearing") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: netGearing < 0 ? t.data.negative : t.fg.primary, fontWeight: 500, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(netGearing))}
                </td>
              )}
              {show("taxSaved") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t border-l" style={{ color: t.data.positive, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(y.taxSaved))}
                </td>
              )}
              {show("netCashflow") && (
                <td className="px-3 py-2 text-right text-[13px] tabular-nums border-t border-l" style={{ color: t.data.positive, fontWeight: 600, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(y.propertyCashflow))}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
