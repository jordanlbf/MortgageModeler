"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { yoyPct, fmtYoY, thClass, tdClass, gainCls } from "./helpers";
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
    <table className="w-full border-collapse text-[13px] tabular-nums">
      <thead>
        <tr>
          <th className={thClass("default", { first: true })}>Year</th>
          <th className={thClass()}>Salary</th>
          {isInvestment && <th className={thClass()}>Rent</th>}
          <th className={thClass("total")}>Total in</th>
          <th className={thClass("default", { groupStart: true })}>Holding</th>
          <th className={thClass()}>Repay</th>
          <th className={thClass()}>Tax</th>
          <th className={thClass("total")}>Total out</th>
          <th className={thClass("net", { groupStart: true })}>Net</th>
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
              <td className={tdClass("default", { isMs, first: true })}>{formatYearCell(y.year, i, isMs)}</td>
              <td className={tdClass("default", { isMs })}>{formatDollarsSigned(Math.round(y.salary))}</td>
              {isInvestment && <td className={tdClass("default", { isMs })}>{formatDollarsSigned(Math.round(y.rentalIncome))}</td>}
              <td className={tdClass("total", { isMs })}>{formatDollarsSigned(Math.round(totalIn))}</td>
              <td className={tdClass("out", { isMs, groupStart: true })}>
                {formatDollarsSigned(-Math.round(y.ongoingCosts))}
                {prev && <span className={gainCls}>{fmtYoY(holdingYoY)}</span>}
              </td>
              <td className={tdClass("out", { isMs })}>{formatDollarsSigned(-Math.round(y.loanRepayment))}</td>
              <td className={tdClass("out", { isMs })}>
                {formatDollarsSigned(-Math.round(y.incomeTaxCalc))}
                {prev && <span className={gainCls}>{fmtYoY(taxYoY)}</span>}
              </td>
              <td className={tdClass("totalOut", { isMs })}>{formatDollarsSigned(-Math.round(totalOut))}</td>
              <td className={tdClass("net", { isMs, groupStart: true })}>
                {formatDollarsSigned(Math.round(net))}
                {prev && <span className={gainCls}>{fmtYoY(netYoY)}</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
