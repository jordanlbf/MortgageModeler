"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDollarsSigned } from "@/lib/formatters";
import TableCell from "@/components/ui/TableCell";
import { DEPRECIATION_COLOR } from "@/lib/theme";
import { yoyPct } from "./helpers";
import DeltaPill from "@/components/ui/DeltaPill";
import type { SubTableProps } from "./types";

interface Props extends SubTableProps {
  panel: "holding" | "depreciation" | "totals" | "unified";
}

export default function DeductionsTable({
  yearData,
  isInvestment,
  depColor,
  isGroupExpanded,
  toggleGroup,
  isRowVisible,
  isMilestoneYear,
  formatYearCell,
  getRowClass,
  getRowHandlers,
  panel,
}: Props) {
  return (
    <>
      {/* DEDUCTIONS — Holding costs panel (collapsible columns) */}
      {panel === "holding" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="col-group-h col-group-h--clickable px-3 text-fg-tertiary"
                colSpan={isGroupExpanded("holding") ? (isInvestment ? 5 : 4) : 1}
                onClick={() => toggleGroup("holding")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("holding") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>holding costs</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-strong">
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap w-24 text-left px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-default" />
              {isGroupExpanded("holding") && isInvestment && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Loan Interest Paid">interest</th>}
              {isGroupExpanded("holding") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Council + Water Rates">rates</th>}
              {isGroupExpanded("holding") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Building & Landlord Insurance">insurance</th>}
              {isGroupExpanded("holding") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Maintenance & Repairs">maint.</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold pr-5 text-right whitespace-nowrap tip" data-tip="Holding Costs Subtotal">subtotal</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingTotal = isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-left px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("holding") && isInvestment && <TableCell className="text-data-negative/65">{formatDollarsSigned(Math.round(y.interestPortion))}</TableCell>}
                  {isGroupExpanded("holding") && <TableCell className="text-data-negative/65">{formatDollarsSigned(Math.round(y.councilRates + y.waterRates))}</TableCell>}
                  {isGroupExpanded("holding") && <TableCell className="text-data-negative/65">{formatDollarsSigned(Math.round(y.insurance))}</TableCell>}
                  {isGroupExpanded("holding") && <TableCell className="text-data-negative/65">{formatDollarsSigned(Math.round(y.maintenance + y.strataFees))}</TableCell>}
                  <TableCell animated={false} className="pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-data-negative)" }}>
                    {formatDollarsSigned(Math.round(holdingTotal))}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* DEDUCTIONS — Depreciation panel (collapsible columns) */}
      {panel === "depreciation" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th
                className="col-group-h col-group-h--clickable px-3 text-fg-tertiary"
                colSpan={isGroupExpanded("depreciation") ? 3 : 1}
                onClick={() => toggleGroup("depreciation")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("depreciation") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>depreciation</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-strong">
              {isGroupExpanded("depreciation") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Division 43 — Capital Works Deduction">div 43</th>}
              {isGroupExpanded("depreciation") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Division 40 — Plant & Equipment Depreciation">div 40</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold pr-5 text-right whitespace-nowrap tip" data-tip="Depreciation Subtotal">subtotal</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const depTotal = y.depDiv43 + y.depDiv40;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("depreciation") && <TableCell style={{ color: depColor, opacity: 0.7 }}>{formatDollarsSigned(Math.round(y.depDiv43))}</TableCell>}
                  {isGroupExpanded("depreciation") && <TableCell style={{ color: depColor, opacity: 0.7 }}>{formatDollarsSigned(Math.round(y.depDiv40))}</TableCell>}
                  <TableCell animated={false} className="pr-5 text-sm" style={{ fontWeight: 700, color: depColor }}>
                    {formatDollarsSigned(Math.round(depTotal))}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* DEDUCTIONS — Totals panel (collapsible columns) */}
      {panel === "totals" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th
                className="col-group-h col-group-h--clickable px-3 text-fg-tertiary"
                colSpan={isGroupExpanded("totals") ? (isInvestment ? 3 : 2) : 1}
                onClick={() => toggleGroup("totals")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("totals") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>{isInvestment ? "deductions" : "expenses"}</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-strong">
              {isGroupExpanded("totals") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Interest + Ongoing Costs">holding</th>}
              {isGroupExpanded("totals") && isInvestment && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Div 43 + Div 40">depr.</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold pr-5 text-right whitespace-nowrap tip" data-tip={isInvestment ? "Total Deductions" : "Total Expenses"}>{isInvestment ? "total ded." : "total exp."}</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingTotal = isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts;
              const depTotal = y.depDiv43 + y.depDiv40;
              const grandTotal = isInvestment ? holdingTotal + depTotal : holdingTotal;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("totals") && <TableCell style={{ color: "var(--color-data-negative)" }}>{formatDollarsSigned(Math.round(holdingTotal))}</TableCell>}
                  {isGroupExpanded("totals") && isInvestment && <TableCell style={{ color: depColor }}>{formatDollarsSigned(Math.round(depTotal))}</TableCell>}
                  <TableCell animated={false} className="pr-5 text-sm" style={{ fontWeight: 700, color: isInvestment ? DEPRECIATION_COLOR : "var(--color-data-negative)" }}>
                    {formatDollarsSigned(Math.round(grandTotal))}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* DEDUCTIONS — Unified (Holding + Depreciation + Totals in one table) */}
      {panel === "unified" && (() => {
        const holdExpanded = isGroupExpanded("holding");
        const depExpanded = isGroupExpanded("depreciation");
        const totalColor = isInvestment ? DEPRECIATION_COLOR : "var(--color-data-negative)";
        const totals = yearData.reduce((acc, y) => {
          const holding = isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts;
          const depr = y.depDiv43 + y.depDiv40;
          return {
            interest: acc.interest + y.interestPortion,
            rates: acc.rates + y.councilRates + y.waterRates,
            insurance: acc.insurance + y.insurance,
            maint: acc.maint + y.maintenance,
            holding: acc.holding + holding,
            div43: acc.div43 + y.depDiv43,
            div40: acc.div40 + y.depDiv40,
            depr: acc.depr + depr,
            grand: acc.grand + (isInvestment ? holding + depr : holding),
          };
        }, { interest: 0, rates: 0, insurance: 0, maint: 0, holding: 0, div43: 0, div40: 0, depr: 0, grand: 0 });
        const summaryBorder = { borderTop: "1px solid color-mix(in srgb, var(--color-brand) 30%, transparent)" } as const;

        return (
        <table className="border-collapse tabular-nums text-[13px] leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0" style={{ background: "var(--color-surface-raised)" }}>
              <th className="h-7 box-border px-3 text-center align-bottom" />
              <th
                className="col-group-h col-group-h--clickable px-3 text-fg-secondary"
                colSpan={holdExpanded ? (isInvestment ? 5 : 4) : 1}
                onClick={() => toggleGroup("holding")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {holdExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>holding costs</span>
                </span>
              </th>
              {isInvestment && (
                <th
                  className="col-group-h col-group-h--clickable pl-6 pr-3 text-fg-secondary"
                  colSpan={depExpanded ? 3 : 1}
                  onClick={() => toggleGroup("depreciation")}
                >
                  <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                    {depExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span>depreciation</span>
                  </span>
                </th>
              )}
              <th
                className="col-group-h pl-6 pr-3 text-fg-secondary"
                style={{ background: "var(--color-out-tint-raised)" }}
              >
                {isInvestment ? "deductions" : "expenses"}
              </th>
            </tr>
            {(holdExpanded || depExpanded) && (
            <tr className="h-14 border-b border-default" style={{ background: "var(--color-surface-raised)" }}>
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap w-24 text-left px-2.5" />
              {/* Holding detail columns */}
              {holdExpanded && isInvestment && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Loan Interest Paid">interest</th>}
              {holdExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Council + Water Rates">rates</th>}
              {holdExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Building & Landlord Insurance">insurance</th>}
              {holdExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Maintenance & Repairs">maint.</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold text-right whitespace-nowrap tip" data-tip="Holding Costs Subtotal">subtotal</th>
              {/* Depreciation detail columns (investment only) */}
              {isInvestment && depExpanded && <th className="h-14 box-border align-middle pl-6 pr-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Division 43 — Capital Works">div 43</th>}
              {isInvestment && depExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Division 40 — Plant & Equipment">div 40</th>}
              {isInvestment && <th className={`h-14 box-border align-middle ${!depExpanded ? "pl-6 pr-3" : "px-3"} text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold text-right whitespace-nowrap tip`} data-tip="Depreciation Subtotal">subtotal</th>}
              {/* Total */}
              <th className="h-14 box-border align-middle pl-6 pr-5 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold text-right whitespace-nowrap tip" style={{ background: "var(--color-out-tint-raised)" }} data-tip={isInvestment ? "Total Deductions" : "Total Expenses"}>{isInvestment ? "total ded." : "total exp."}</th>
            </tr>
            )}
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingTotal = isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts;
              const depTotal = y.depDiv43 + y.depDiv40;
              const grandTotal = isInvestment ? holdingTotal + depTotal : holdingTotal;
              const isCollapsed = !holdExpanded && !depExpanded;
              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-left px-2.5">{formatYearCell(y.year, i, isMilestone)}</td>
                  {/* Holding detail cells */}
                  {holdExpanded && isInvestment && <TableCell style={{ color: "var(--color-data-negative)" }}>{formatDollarsSigned(Math.round(y.interestPortion))}</TableCell>}
                  {holdExpanded && <TableCell style={{ color: "var(--color-data-negative)" }}>{formatDollarsSigned(Math.round(y.councilRates + y.waterRates))}</TableCell>}
                  {holdExpanded && <TableCell style={{ color: "var(--color-data-negative)" }}>{formatDollarsSigned(Math.round(y.insurance))}</TableCell>}
                  {holdExpanded && <TableCell style={{ color: "var(--color-data-negative)" }}>{formatDollarsSigned(Math.round(y.maintenance))}</TableCell>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "text-[15px] px-4" : ""}`}>
                    <span className="font-semibold text-data-negative">{formatDollarsSigned(Math.round(holdingTotal))}</span>
                    {isCollapsed && (() => {
                      const prevHolding = i > 0 ? (isInvestment ? yearData[i-1].interestPortion + yearData[i-1].ongoingCosts : yearData[i-1].ongoingCosts) : holdingTotal;
                      const holdYoY = yoyPct(holdingTotal, prevHolding);
                      return <DeltaPill value={holdYoY} direction="negative" />;
                    })()}
                  </td>
                  {/* Depreciation detail cells (investment only) */}
                  {isInvestment && depExpanded && <td className="h-[52px] box-border pl-6 pr-3 text-right align-middle border-b border-b-white/[0.07] animate-col-fade-in" style={{ color: depColor, opacity: 0.7 }}>{formatDollarsSigned(Math.round(y.depDiv43))}</td>}
                  {isInvestment && depExpanded && <TableCell style={{ color: depColor, opacity: 0.7 }}>{formatDollarsSigned(Math.round(y.depDiv40))}</TableCell>}
                  {isInvestment && <td className={`h-[52px] box-border ${!depExpanded ? "pl-6 pr-3" : "px-3"} text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "text-[15px] px-4" : ""}`} style={{ color: depColor }}>
                    <span className="font-semibold">{formatDollarsSigned(Math.round(depTotal))}</span>
                    {isCollapsed && (() => {
                      const prevDep = i > 0 ? yearData[i-1].depDiv43 + yearData[i-1].depDiv40 : depTotal;
                      const depYoY = yoyPct(depTotal, prevDep);
                      return <DeltaPill value={depYoY} direction="negative" />;
                    })()}
                  </td>}
                  {/* Total */}
                  <td className={`h-[52px] box-border pl-6 pr-5 text-right align-middle border-b border-b-white/[0.07] out-zone ${isCollapsed ? "text-[15px] font-bold tracking-tight" : "text-[13px]"}`} style={{ color: totalColor }}>
                    <span className="font-bold">{formatDollarsSigned(Math.round(grandTotal))}</span>
                    {isCollapsed && (() => {
                      const prevGrand = i > 0 ? (() => { const py = yearData[i-1]; const ph = isInvestment ? py.interestPortion + py.ongoingCosts : py.ongoingCosts; const pd = py.depDiv43 + py.depDiv40; return isInvestment ? ph + pd : ph; })() : grandTotal;
                      const grandYoY = yoyPct(grandTotal, prevGrand);
                      return <DeltaPill value={grandYoY} direction="negative" />;
                    })()}
                  </td>
                </tr>
              );
            })}
            {/* Summary row — fixed totals across all visible years */}
            <tr className="row-summary">
              <td className="box-border align-middle pl-[18px] text-left" style={summaryBorder}>
                <span className="text-[10.5px] tracking-[0.14em] uppercase text-fg-secondary font-medium">{yearData.length}-yr total</span>
              </td>
              {holdExpanded && isInvestment && (
                <td className="box-border px-3 text-right align-middle text-data-negative opacity-85 font-medium text-[15px]" style={summaryBorder}>{formatDollarsSigned(Math.round(totals.interest))}</td>
              )}
              {holdExpanded && (
                <td className="box-border px-3 text-right align-middle text-data-negative opacity-85 font-medium text-[15px]" style={summaryBorder}>{formatDollarsSigned(Math.round(totals.rates))}</td>
              )}
              {holdExpanded && (
                <td className="box-border px-3 text-right align-middle text-data-negative opacity-85 font-medium text-[15px]" style={summaryBorder}>{formatDollarsSigned(Math.round(totals.insurance))}</td>
              )}
              {holdExpanded && (
                <td className="box-border px-3 text-right align-middle text-data-negative opacity-85 font-medium text-[15px]" style={summaryBorder}>{formatDollarsSigned(Math.round(totals.maint))}</td>
              )}
              <td className="box-border px-3 text-right align-middle text-[15px]" style={summaryBorder}>
                <span className="font-semibold text-data-negative">{formatDollarsSigned(Math.round(totals.holding))}</span>
              </td>
              {isInvestment && depExpanded && (
                <td className="box-border pl-6 pr-3 text-right align-middle font-medium text-[15px]" style={{ ...summaryBorder, color: depColor, opacity: 0.7 }}>{formatDollarsSigned(Math.round(totals.div43))}</td>
              )}
              {isInvestment && depExpanded && (
                <td className="box-border px-3 text-right align-middle font-medium text-[15px]" style={{ ...summaryBorder, color: depColor, opacity: 0.7 }}>{formatDollarsSigned(Math.round(totals.div40))}</td>
              )}
              {isInvestment && (
                <td className={`box-border ${!depExpanded ? "pl-6 pr-3" : "px-3"} text-right align-middle text-[15px]`} style={{ ...summaryBorder, color: depColor }}>
                  <span className="font-semibold">{formatDollarsSigned(Math.round(totals.depr))}</span>
                </td>
              )}
              <td className="box-border pl-6 pr-5 text-right align-middle text-[15px]" style={{ ...summaryBorder, background: "var(--color-out-tint-raised)", color: totalColor }}>
                <span className="font-bold">{formatDollarsSigned(Math.round(totals.grand))}</span>
              </td>
            </tr>
          </tbody>
        </table>
        );
      })()}
    </>
  );
}
