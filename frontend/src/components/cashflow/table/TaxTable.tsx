"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { getMarginalTaxRate } from "@/lib/cashflow-calculations";
import { t } from "@/lib/theme";
import type { SubTableProps } from "./types";

export default function TaxTable({
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
          <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider sticky left-0 z-[1] w-16" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Year</th>
          {show("holding") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Holding</th>}
          {show("interest") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Interest</th>}
          {show("depr") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Depr.</th>}
          {show("totalDed") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.secondary, background: t.surface.subtle, fontWeight: 600 }}>Total ded.</th>}
          {show("taxSaved") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l" style={{ color: t.fg.tertiary, background: t.surface.subtle, borderColor: t.border.subtle }}>Tax effect</th>}
          {show("bracket") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Bracket</th>}
          {show("netTaxCost") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l" style={{ color: t.brand.default, background: t.surface.subtle, fontWeight: 600, borderColor: t.border.subtle }}>Net tax cost</th>}
        </tr>
      </thead>
      <tbody>
        {yearData.map((y, i) => {
          const isSelected = getRowClass(y.year).includes("bg-brand");

          const depr = y.depDiv43 + y.depDiv40;
          const totalDed = y.ongoingCosts + y.interestPortion + depr;
          const taxableIncome = y.grossIncome - y.totalDeductionsForTax;
          const bracket = getMarginalTaxRate(taxableIncome);

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
              {show("interest") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.fg.primary, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(y.interestPortion))}
                </td>
              )}
              {show("depr") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.fg.primary, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(depr))}
                </td>
              )}
              {show("totalDed") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.fg.primary, fontWeight: 500, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(totalDed))}
                </td>
              )}
              {show("taxSaved") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t border-l" style={{ color: y.taxSaved > 0 ? t.data.positive : y.taxSaved < 0 ? t.data.negative : t.fg.primary, borderColor: t.border.subtle }}>
                  {y.taxSaved > 0 ? "+" : ""}{formatDollarsSigned(Math.round(y.taxSaved))}
                </td>
              )}
              {show("bracket") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.fg.primary, borderColor: t.border.subtle }}>
                  {(bracket * 100).toFixed(bracket % 0.01 === 0 ? 0 : 1)}%
                </td>
              )}
              {show("netTaxCost") && (
                <td className="px-3 py-2 text-right text-[13px] tabular-nums border-t border-l" style={{ color: t.data.negative, fontWeight: 600, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(y.incomeTaxCalc))}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
