"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { t } from "@/lib/theme";
import type { SubTableProps } from "./types";

export default function CostsTable({
  yearData,
  formatYearCell,
  getRowClass,
  getRowHandlers,
  visibleCols = {},
}: SubTableProps) {
  // A column is shown if (a) it's toggled on in the drawer AND
  // (b) at least one year has a non-zero value for it. Avoids rendering a
  // column of all-zero cells when the property has no strata / no management
  // / no landlord insurance etc.
  const hasAny = {
    councilRates:      yearData.some((y) => y.councilRates > 0),
    waterRates:        yearData.some((y) => y.waterRates > 0),
    buildingInsurance: yearData.some((y) => y.insurance > 0),
    landlordInsurance: yearData.some((y) => y.landlordInsurance > 0),
    maintenance:       yearData.some((y) => y.maintenance > 0),
    strataFees:        yearData.some((y) => y.strataFees > 0),
    managementFee:     yearData.some((y) => y.managementFee > 0),
    totalCosts:        true,
  } as const;

  const show = (key: keyof typeof hasAny) =>
    visibleCols[key] !== false && hasAny[key];

  return (
    <table className="w-full text-[12px] table-fixed">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider sticky left-0 z-[1] w-16" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Year</th>
          {show("councilRates")      && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Council</th>}
          {show("waterRates")        && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Water</th>}
          {show("buildingInsurance") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Building ins.</th>}
          {show("landlordInsurance") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Landlord ins.</th>}
          {show("maintenance")       && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Maintenance</th>}
          {show("strataFees")        && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Strata</th>}
          {show("managementFee")     && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Management</th>}
          {show("totalCosts")        && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l" style={{ color: t.brand.default, background: t.surface.subtle, fontWeight: 600, borderColor: t.border.subtle }}>Total</th>}
        </tr>
      </thead>
      <tbody>
        {yearData.map((y, i) => {
          const isSelected = getRowClass(y.year).includes("bg-brand");

          return (
            <tr key={y.year} className={getRowClass(y.year)} {...getRowHandlers(y.year)}>
              <td className="px-3 py-2 text-left text-[12px] font-medium sticky left-0 z-[1] border-t" style={{ color: isSelected ? t.brand.default : t.fg.primary, background: isSelected ? t.surface.hover : t.card.base, borderColor: t.border.subtle }}>
                {formatYearCell(y.year, i)}
              </td>
              {show("councilRates") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(y.councilRates))}
                </td>
              )}
              {show("waterRates") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(y.waterRates))}
                </td>
              )}
              {show("buildingInsurance") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(y.insurance))}
                </td>
              )}
              {show("landlordInsurance") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(y.landlordInsurance))}
                </td>
              )}
              {show("maintenance") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(y.maintenance))}
                </td>
              )}
              {show("strataFees") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(y.strataFees))}
                </td>
              )}
              {show("managementFee") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(y.managementFee))}
                </td>
              )}
              {show("totalCosts") && (
                <td className="px-3 py-2 text-right text-[13px] tabular-nums border-t border-l" style={{ color: t.data.negative, fontWeight: 600, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(y.ongoingCosts))}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
