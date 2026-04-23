"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { getMarginalTaxRate } from "@/lib/cashflow-calculations";
import { yoyPct, fmtYoY, thClass, thStyle, tdClass, tdStyle, gainCls, gainStyle } from "./helpers";
import type { SubTableProps } from "./types";

export default function TaxTable({
  yearData,
  isInvestment,
  isRowVisible,
  isMilestoneYear,
  formatYearCell,
  getRowClass,
  getRowHandlers,
}: SubTableProps) {
  if (!isInvestment) return null;

  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr>
          <th className={thClass("default", { first: true })} style={thStyle("default", { first: true })}>Year</th>
          <th className={thClass()} style={thStyle()}>Holding</th>
          <th className={thClass()} style={thStyle()}>Interest</th>
          <th className={thClass()} style={thStyle()}>Depr.</th>
          <th className={thClass("total")} style={thStyle("total")}>Total ded.</th>
          <th className={thClass("default", { groupStart: true })} style={thStyle()}>Tax saved</th>
          <th className={thClass()} style={thStyle()}>Bracket</th>
          <th className={thClass("net", { groupStart: true })} style={thStyle("net")}>Net tax cost</th>
        </tr>
      </thead>
      <tbody>
        {yearData.map((y, i) => {
          if (!isRowVisible(y.year)) return null;
          const isMs = isMilestoneYear(y.year);
          const prev = i > 0 ? yearData[i - 1] : null;

          const depr = y.depDiv43 + y.depDiv40;
          const totalDed = y.ongoingCosts + y.interestPortion + depr;
          const taxableIncome = y.grossIncome - y.totalDeductionsForTax;
          const bracket = getMarginalTaxRate(taxableIncome);

          const prevDepr = prev ? prev.depDiv43 + prev.depDiv40 : 0;
          const prevTotalDed = prev ? prev.ongoingCosts + prev.interestPortion + prevDepr : 0;

          const holdingYoY = prev ? yoyPct(y.ongoingCosts, prev.ongoingCosts) : 0;
          const interestYoY = prev ? yoyPct(y.interestPortion, prev.interestPortion) : 0;
          const deprYoY = prev ? yoyPct(depr, prevDepr) : 0;
          const totalDedYoY = prev ? yoyPct(totalDed, prevTotalDed) : 0;
          const taxSavedYoY = prev ? yoyPct(y.taxSaved, prev.taxSaved) : 0;

          return (
            <tr key={y.year} className={getRowClass(y.year, isMs)} {...getRowHandlers(y.year, isMs)}>
              <td className={tdClass("default", { isMs, first: true })} style={tdStyle("default", { isMs, first: true })}>
                {formatYearCell(y.year, i, isMs)}
              </td>
              <td className={tdClass("default", { isMs })} style={tdStyle("default", { isMs })}>
                {formatDollarsSigned(Math.round(y.ongoingCosts))}
                {prev && <span className={gainCls} style={gainStyle}>{fmtYoY(holdingYoY)}</span>}
              </td>
              <td className={tdClass("default", { isMs })} style={tdStyle("default", { isMs })}>
                {formatDollarsSigned(Math.round(y.interestPortion))}
                {prev && <span className={gainCls} style={gainStyle}>{fmtYoY(interestYoY)}</span>}
              </td>
              <td className={tdClass("default", { isMs })} style={tdStyle("default", { isMs })}>
                {formatDollarsSigned(Math.round(depr))}
                {prev && <span className={gainCls} style={gainStyle}>{fmtYoY(deprYoY)}</span>}
              </td>
              <td className={tdClass("total", { isMs })} style={tdStyle("total", { isMs })}>
                {formatDollarsSigned(Math.round(totalDed))}
                {prev && <span className={gainCls} style={gainStyle}>{fmtYoY(totalDedYoY)}</span>}
              </td>
              <td className={tdClass("default", { isMs, groupStart: true })} style={tdStyle("default", { isMs })}>
                {formatDollarsSigned(Math.round(y.taxSaved))}
                {prev && <span className={gainCls} style={gainStyle}>{fmtYoY(taxSavedYoY)}</span>}
              </td>
              <td className={tdClass("default", { isMs })} style={tdStyle("default", { isMs })}>
                {(bracket * 100).toFixed(bracket % 0.01 === 0 ? 0 : 1)}%
              </td>
              <td className={tdClass("totalOut", { isMs, groupStart: true })} style={tdStyle("totalOut", { isMs })}>
                {formatDollarsSigned(-Math.round(y.incomeTaxCalc))}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
