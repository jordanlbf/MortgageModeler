"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { yoyPct, fmtYoY, thClass, thStyle, tdClass, tdStyle, gainCls, gainStyle } from "./helpers";
import type { SubTableProps } from "./types";

export default function SummaryTable({
  yearData,
  isInvestment,
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
          <th className={thClass()} style={thStyle()}>Salary</th>
          {isInvestment && <th className={thClass()} style={thStyle()}>Rent</th>}
          <th className={thClass("total")} style={thStyle("total")}>Total in</th>
          <th className={thClass("default", { groupStart: true })} style={thStyle()}>Holding</th>
          <th className={thClass()} style={thStyle()}>Repay</th>
          <th className={thClass()} style={thStyle()}>Tax</th>
          <th className={thClass("total")} style={thStyle("total")}>Total out</th>
          <th className={thClass("net", { groupStart: true })} style={thStyle("net")}>Net</th>
        </tr>
      </thead>
      <tbody>
        {yearData.map((y, i) => {
          if (!isRowVisible(y.year)) return null;
          const isMs = isMilestoneYear(y.year);
          const prev = i > 0 ? yearData[i - 1] : null;

          const totalIn = y.salary + (isInvestment ? y.rentalIncome : 0);
          const totalOut = y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc;
          const net = totalIn - totalOut;

          const holdingYoY = prev ? yoyPct(y.ongoingCosts, prev.ongoingCosts) : 0;
          const taxYoY = prev ? yoyPct(y.incomeTaxCalc, prev.incomeTaxCalc) : 0;
          const netPrev = prev
            ? prev.salary + (isInvestment ? prev.rentalIncome : 0) - prev.ongoingCosts - prev.loanRepayment - prev.incomeTaxCalc
            : 0;
          const netYoY = prev ? yoyPct(net, netPrev) : 0;

          return (
            <tr key={y.year} className={getRowClass(y.year, isMs)} {...getRowHandlers(y.year, isMs)}>
              <td className={tdClass("default", { isMs, first: true })} style={tdStyle("default", { isMs, first: true })}>
                {formatYearCell(y.year, i, isMs)}
              </td>
              <td className={tdClass("default", { isMs })} style={tdStyle("default", { isMs })}>
                {formatDollarsSigned(Math.round(y.salary))}
              </td>
              {isInvestment && (
                <td className={tdClass("default", { isMs })} style={tdStyle("default", { isMs })}>
                  {formatDollarsSigned(Math.round(y.rentalIncome))}
                </td>
              )}
              <td className={tdClass("total", { isMs })} style={tdStyle("total", { isMs })}>
                {formatDollarsSigned(Math.round(totalIn))}
              </td>
              <td className={tdClass("out", { isMs, groupStart: true })} style={tdStyle("out", { isMs })}>
                {formatDollarsSigned(-Math.round(y.ongoingCosts))}
                {prev && <span className={gainCls} style={gainStyle}>{fmtYoY(holdingYoY)}</span>}
              </td>
              <td className={tdClass("out", { isMs })} style={tdStyle("out", { isMs })}>
                {formatDollarsSigned(-Math.round(y.loanRepayment))}
              </td>
              <td className={tdClass("out", { isMs })} style={tdStyle("out", { isMs })}>
                {formatDollarsSigned(-Math.round(y.incomeTaxCalc))}
                {prev && <span className={gainCls} style={gainStyle}>{fmtYoY(taxYoY)}</span>}
              </td>
              <td className={tdClass("totalOut", { isMs })} style={tdStyle("totalOut", { isMs })}>
                {formatDollarsSigned(-Math.round(totalOut))}
              </td>
              <td className={tdClass("net", { isMs, groupStart: true })} style={tdStyle("net", { isMs })}>
                {formatDollarsSigned(Math.round(net))}
                {prev && <span className={gainCls} style={gainStyle}>{fmtYoY(netYoY)}</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
