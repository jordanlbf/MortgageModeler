"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { yoyPct, fmtYoY, thClass, tdClass, gainCls } from "./helpers";
import type { SubTableProps } from "./types";

export default function DeductionsTable({
  yearData,
  isInvestment,
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
          <th className={thClass()}>Holding</th>
          {isInvestment && <th className={thClass()}>Interest</th>}
          {isInvestment && <th className={thClass("default", { groupStart: true })}>Div 43</th>}
          {isInvestment && <th className={thClass()}>Div 40</th>}
          {isInvestment && <th className={thClass("total")}>Total depreciation</th>}
          <th className={thClass("net", { groupStart: true })}>
            {isInvestment ? "Total deductions" : "Total expenses"}
          </th>
        </tr>
      </thead>
      <tbody>
        {yearData.map((y, i) => {
          if (!isRowVisible(y.year)) return null;
          const isMs = isMilestoneYear(y.year);
          const prev = i > 0 ? yearData[i - 1] : null;

          const depr = y.depDiv43 + y.depDiv40;
          const totalDed = isInvestment ? y.ongoingCosts + y.interestPortion + depr : y.ongoingCosts;

          const prevDepr = prev ? prev.depDiv43 + prev.depDiv40 : 0;
          const prevTotalDed = prev
            ? (isInvestment ? prev.ongoingCosts + prev.interestPortion + prevDepr : prev.ongoingCosts)
            : 0;

          const holdingYoY = prev ? yoyPct(y.ongoingCosts, prev.ongoingCosts) : 0;
          const interestYoY = prev ? yoyPct(y.interestPortion, prev.interestPortion) : 0;
          const deprYoY = prev ? yoyPct(depr, prevDepr) : 0;
          const totalDedYoY = prev ? yoyPct(totalDed, prevTotalDed) : 0;

          return (
            <tr key={y.year} className={getRowClass(y.year, isMs)} {...getRowHandlers(y.year, isMs)}>
              <td className={tdClass("default", { isMs, first: true })}>{formatYearCell(y.year, i, isMs)}</td>
              <td className={tdClass("default", { isMs })}>
                {formatDollarsSigned(Math.round(y.ongoingCosts))}
                {prev && <span className={gainCls}>{fmtYoY(holdingYoY)}</span>}
              </td>
              {isInvestment && (
                <td className={tdClass("default", { isMs })}>
                  {formatDollarsSigned(Math.round(y.interestPortion))}
                  {prev && <span className={gainCls}>{fmtYoY(interestYoY)}</span>}
                </td>
              )}
              {isInvestment && (
                <td className={tdClass("default", { isMs, groupStart: true })}>{formatDollarsSigned(Math.round(y.depDiv43))}</td>
              )}
              {isInvestment && <td className={tdClass("default", { isMs })}>{formatDollarsSigned(Math.round(y.depDiv40))}</td>}
              {isInvestment && (
                <td className={tdClass("total", { isMs })}>
                  {formatDollarsSigned(Math.round(depr))}
                  {prev && <span className={gainCls}>{fmtYoY(deprYoY)}</span>}
                </td>
              )}
              <td className={tdClass("net", { isMs, groupStart: true })}>
                {formatDollarsSigned(Math.round(totalDed))}
                {prev && <span className={gainCls}>{fmtYoY(totalDedYoY)}</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
