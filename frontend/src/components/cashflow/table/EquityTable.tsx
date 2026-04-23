"use client";

import { formatDollarsSigned, safeDiv } from "@/lib/formatters";
import { yoyPct, fmtYoY, getLvrColor, thClass, thStyle, tdClass, tdStyle, gainCls, gainStyle } from "./helpers";
import type { SubTableProps } from "./types";

export default function EquityTable({
  yearData,
  showOffset,
  isRowVisible,
  isMilestoneYear,
  formatYearCell,
  getRowClass,
  getRowHandlers,
}: SubTableProps) {
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr>
          <th className={thClass("default", { first: true })} style={thStyle("default", { first: true })}>Year</th>
          <th className={thClass("total")} style={thStyle("total")}>Property value</th>
          <th className={thClass("default", { groupStart: true })} style={thStyle()}>Loan balance</th>
          {showOffset && <th className={thClass()} style={thStyle()}>Offset balance</th>}
          <th className={thClass("net", { groupStart: true })} style={thStyle("net")}>Net equity</th>
          <th className={thClass()} style={thStyle()}>LVR</th>
        </tr>
      </thead>
      <tbody>
        {yearData.map((y, i) => {
          if (!isRowVisible(y.year)) return null;
          const isMs = isMilestoneYear(y.year);
          const prev = i > 0 ? yearData[i - 1] : null;
          const lvr = safeDiv(y.loanBalance, y.propertyValue) * 100;

          const valueYoY = prev ? yoyPct(y.propertyValue, prev.propertyValue) : 0;
          const equityYoY = prev ? yoyPct(y.netEquity, prev.netEquity) : 0;

          return (
            <tr key={y.year} className={getRowClass(y.year, isMs)} {...getRowHandlers(y.year, isMs)}>
              <td className={tdClass("default", { isMs, first: true })} style={tdStyle("default", { isMs, first: true })}>
                {formatYearCell(y.year, i, isMs)}
              </td>
              <td className={tdClass("total", { isMs })} style={tdStyle("total", { isMs })}>
                {formatDollarsSigned(Math.round(y.propertyValue))}
                {prev && <span className={gainCls} style={gainStyle}>{fmtYoY(valueYoY)}</span>}
              </td>
              <td className={tdClass("out", { isMs, groupStart: true })} style={tdStyle("out", { isMs })}>
                {formatDollarsSigned(-Math.round(y.loanBalance))}
              </td>
              {showOffset && (
                <td className={tdClass("default", { isMs })} style={tdStyle("default", { isMs })}>
                  {formatDollarsSigned(Math.round(y.offsetBalanceAtYear))}
                </td>
              )}
              <td className={tdClass("net", { isMs, groupStart: true })} style={tdStyle("net", { isMs })}>
                {formatDollarsSigned(Math.round(y.netEquity))}
                {prev && <span className={gainCls} style={gainStyle}>{fmtYoY(equityYoY)}</span>}
              </td>
              <td className={tdClass("default", { isMs })} style={{ ...tdStyle("default", { isMs }), color: getLvrColor(lvr) }}>
                {lvr.toFixed(1)}%
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
