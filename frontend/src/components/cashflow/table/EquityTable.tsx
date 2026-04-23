"use client";

import { formatDollarsSigned, safeDiv } from "@/lib/formatters";
import { yoyPct, fmtYoY, getLvrClass, thClass, tdClass, gainCls } from "./helpers";
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
    <table className="w-full border-collapse text-[13px] tabular-nums">
      <thead>
        <tr>
          <th className={thClass("default", { first: true })}>Year</th>
          <th className={thClass("total")}>Property value</th>
          <th className={thClass("default", { groupStart: true })}>Loan balance</th>
          {showOffset && <th className={thClass()}>Offset balance</th>}
          <th className={thClass("net", { groupStart: true })}>Net equity</th>
          <th className={thClass()}>LVR</th>
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
              <td className={tdClass("default", { isMs, first: true })}>{formatYearCell(y.year, i, isMs)}</td>
              <td className={tdClass("total", { isMs })}>
                {formatDollarsSigned(Math.round(y.propertyValue))}
                {prev && <span className={gainCls}>{fmtYoY(valueYoY)}</span>}
              </td>
              <td className={tdClass("out", { isMs, groupStart: true })}>
                {formatDollarsSigned(-Math.round(y.loanBalance))}
              </td>
              {showOffset && (
                <td className={tdClass("default", { isMs })}>
                  {formatDollarsSigned(Math.round(y.offsetBalanceAtYear))}
                </td>
              )}
              <td className={tdClass("net", { isMs, groupStart: true })}>
                {formatDollarsSigned(Math.round(y.netEquity))}
                {prev && <span className={gainCls}>{fmtYoY(equityYoY)}</span>}
              </td>
              <td className={`${tdClass("default", { isMs })} ${getLvrClass(lvr)}`}>{lvr.toFixed(1)}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
