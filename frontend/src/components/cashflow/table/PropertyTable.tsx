"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { yoyPct, fmtYoY, thClass, tdClass, gainCls } from "./helpers";
import type { SubTableProps } from "./types";

export default function PropertyTable({
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
    <table className="w-full border-collapse text-[13px] tabular-nums">
      <thead>
        <tr>
          <th className={thClass("default", { first: true })}>Year</th>
          <th className={thClass()}>Rent</th>
          <th className={thClass("default", { groupStart: true })}>Holding</th>
          <th className={thClass()}>Depr.</th>
          <th className={thClass("total")}>Net gearing</th>
          <th className={thClass("default", { groupStart: true })}>Tax saved</th>
          <th className={thClass("net", { groupStart: true })}>Net cashflow</th>
        </tr>
      </thead>
      <tbody>
        {yearData.map((y, i) => {
          if (!isRowVisible(y.year)) return null;
          const isMs = isMilestoneYear(y.year);
          const prev = i > 0 ? yearData[i - 1] : null;

          const holding = y.interestPortion + y.ongoingCosts;
          const depr = y.depDiv43 + y.depDiv40;
          const netGearing = y.rentalIncome - holding - depr;

          const prevGearing = prev
            ? prev.rentalIncome - (prev.interestPortion + prev.ongoingCosts) - (prev.depDiv43 + prev.depDiv40)
            : 0;
          const gearingYoY = prev ? yoyPct(netGearing, prevGearing) : 0;
          const taxSavedYoY = prev ? yoyPct(y.taxSaved, prev.taxSaved) : 0;
          const cfYoY = prev ? yoyPct(y.propertyCashflow, prev.propertyCashflow) : 0;

          return (
            <tr key={y.year} className={getRowClass(y.year, isMs)} {...getRowHandlers(y.year, isMs)}>
              <td className={tdClass("default", { isMs, first: true })}>{formatYearCell(y.year, i, isMs)}</td>
              <td className={tdClass("default", { isMs })}>{formatDollarsSigned(Math.round(y.rentalIncome))}</td>
              <td className={tdClass("out", { isMs, groupStart: true })}>{formatDollarsSigned(-Math.round(holding))}</td>
              <td className={tdClass("out", { isMs })}>{formatDollarsSigned(-Math.round(depr))}</td>
              <td className={tdClass(netGearing < 0 ? "totalOut" : "total", { isMs })}>
                {formatDollarsSigned(Math.round(netGearing))}
                {prev && <span className={gainCls}>{fmtYoY(gearingYoY)}</span>}
              </td>
              <td className={tdClass("default", { isMs, groupStart: true })}>
                {formatDollarsSigned(Math.round(y.taxSaved))}
                {prev && <span className={gainCls}>{fmtYoY(taxSavedYoY)}</span>}
              </td>
              <td className={tdClass("net", { isMs, groupStart: true })}>
                {formatDollarsSigned(Math.round(y.propertyCashflow))}
                {prev && <span className={gainCls}>{fmtYoY(cfYoY)}</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
