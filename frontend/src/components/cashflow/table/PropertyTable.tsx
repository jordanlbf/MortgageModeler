"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDollarsSigned } from "@/lib/formatters";
import TableCell from "@/components/ui/TableCell";
import { yoyPct, yoyClass, fmtYoY, getValueClass } from "./helpers";
import type { SubTableProps } from "./types";

interface Props extends SubTableProps {
  panel?: "gearing" | "cashflow" | "unified";
}

export default function PropertyTable({
  yearData,
  isInvestment,
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
      {isInvestment && panel === "gearing" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-medium tracking-[0.12em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-fg-tertiary cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("gearing") ? 4 : 1}
                onClick={() => toggleGroup("gearing")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("gearing") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>gearing</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap w-24 text-left px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {isGroupExpanded("gearing") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("gearing") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Interest + Ongoing Costs">holding</th>}
              {isGroupExpanded("gearing") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Div 43 + Div 40 Depreciation">depreciation</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold pr-5 text-right whitespace-nowrap tip" data-tip="Rent − Holding − Depreciation (negative = negatively geared)">net gearing</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingCosts = y.interestPortion + y.ongoingCosts;
              const depreciation = y.depDiv43 + y.depDiv40;
              const netGearing = y.rentalIncome - holdingCosts - depreciation;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-left px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("gearing") && <TableCell>{formatDollarsSigned(Math.round(y.rentalIncome))}</TableCell>}
                  {isGroupExpanded("gearing") && <TableCell className={getValueClass(-holdingCosts, false, true)}>{formatDollarsSigned(Math.round(-holdingCosts))}</TableCell>}
                  {isGroupExpanded("gearing") && <TableCell className={getValueClass(-depreciation, false, true)}>{formatDollarsSigned(Math.round(-depreciation))}</TableCell>}
                  <TableCell animated={false} className={`pr-5 text-sm ${netGearing >= 0 ? "text-data-positive font-bold" : "text-data-negative font-bold"}`}>{formatDollarsSigned(Math.round(netGearing))}</TableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — Cashflow panel (collapsible columns) */}
      {isInvestment && panel === "cashflow" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-medium tracking-[0.12em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-fg-tertiary cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("propertyCashflow") ? 4 : 1}
                onClick={() => toggleGroup("propertyCashflow")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("propertyCashflow") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>cashflow</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              {isGroupExpanded("propertyCashflow") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("propertyCashflow") && <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Holding + Repayments">total costs</th>}
              {isGroupExpanded("propertyCashflow") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Tax Benefit From Property Deductions">tax saved</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold pr-5 text-right whitespace-nowrap tip" data-tip="Rent − Total Costs + Tax Saved">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingCosts = y.interestPortion + y.ongoingCosts;
              const totalCosts = holdingCosts + y.principalPortion;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("propertyCashflow") && <TableCell>{formatDollarsSigned(Math.round(y.rentalIncome))}</TableCell>}
                  {isGroupExpanded("propertyCashflow") && <TableCell className={getValueClass(-totalCosts, false, true)}>{formatDollarsSigned(Math.round(-totalCosts))}</TableCell>}
                  {isGroupExpanded("propertyCashflow") && <TableCell style={{ color: "var(--color-data-positive)" }}>{y.taxSaved > 0 ? "+" : ""}{formatDollarsSigned(Math.round(y.taxSaved))}</TableCell>}
                  <TableCell animated={false} className={`pr-5 text-sm ${y.propertyCashflow >= 0 ? "text-data-positive font-bold" : "text-data-negative font-bold"}`}>
                    {formatDollarsSigned(Math.round(y.propertyCashflow))}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — Unified (Gearing + Cashflow in one table) */}
      {isInvestment && panel === "unified" && (() => {
        const gearExpanded = isGroupExpanded("gearing");
        const cfExpanded = isGroupExpanded("propertyCashflow");
        const totals = yearData.reduce((acc, y) => {
          const holding = y.interestPortion + y.ongoingCosts;
          const depr = y.depDiv43 + y.depDiv40;
          return {
            rent: acc.rent + y.rentalIncome,
            holding: acc.holding + holding,
            depr: acc.depr + depr,
            gearing: acc.gearing + (y.rentalIncome - holding - depr),
            cfCosts: acc.cfCosts + (holding + y.principalPortion),
            taxSaved: acc.taxSaved + y.taxSaved,
            cashflow: acc.cashflow + y.propertyCashflow,
          };
        }, { rent: 0, holding: 0, depr: 0, gearing: 0, cfCosts: 0, taxSaved: 0, cashflow: 0 });
        const summaryBorder = { borderTop: "1px solid rgba(45,212,191,0.30)" } as const;

        return (
        <table className="border-collapse tabular-nums text-[13px] leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0" style={{ background: "var(--color-surface-raised)" }}>
              <th className="h-7 box-border px-3 text-center align-bottom" />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-medium tracking-[0.12em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-fg-secondary cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={gearExpanded ? 4 : 1}
                onClick={() => toggleGroup("gearing")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {gearExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>gearing</span>
                </span>
              </th>
              <th
                className="h-7 box-border pl-6 pr-3 text-center align-bottom text-[10px] font-medium tracking-[0.12em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-fg-secondary cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={cfExpanded ? 4 : 1}
                onClick={() => toggleGroup("propertyCashflow")}
                style={{ background: "var(--color-cf-wash-strong)" }}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {cfExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>cashflow</span>
                </span>
              </th>
            </tr>
            {(gearExpanded || cfExpanded) && (
            <tr className="h-14 border-b border-white/[0.10]" style={{ background: "var(--color-surface-raised)" }}>
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap w-24 text-left px-2.5" />
              {/* Gearing detail columns */}
              {gearExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Annual Rental Income">rent</th>}
              {gearExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Interest + Ongoing Costs">holding</th>}
              {gearExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Div 43 + Div 40 Depreciation">depr.</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold text-right whitespace-nowrap tip" data-tip="Rent − Holding − Depreciation">net gearing</th>
              {/* Cashflow detail columns */}
              {cfExpanded && <th className="h-14 box-border align-middle pl-6 pr-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" style={{ background: "var(--color-cf-wash-strong)" }} data-tip="Annual Rental Income">rent</th>}
              {cfExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" style={{ background: "var(--color-cf-wash-strong)" }} data-tip="Holding + Repayments">costs</th>}
              {cfExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" style={{ background: "var(--color-cf-wash-strong)" }} data-tip="Tax Benefit">tax saved</th>}
              <th className={`h-14 box-border align-middle ${!cfExpanded ? "pl-6 pr-5" : "px-3 pr-5"} text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold text-right whitespace-nowrap tip`} style={{ background: "var(--color-cf-wash-strong)" }} data-tip="Rent − Costs + Tax Saved">cashflow</th>
            </tr>
            )}
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingCosts = y.interestPortion + y.ongoingCosts;
              const depreciation = y.depDiv43 + y.depDiv40;
              const netGearing = y.rentalIncome - holdingCosts - depreciation;
              const totalCosts = holdingCosts + y.principalPortion;
              const isCollapsed = !gearExpanded && !cfExpanded;
              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-left px-2.5">{formatYearCell(y.year, i, isMilestone)}</td>
                  {/* Gearing detail cells */}
                  {gearExpanded && <TableCell tone="emphasis">{formatDollarsSigned(Math.round(y.rentalIncome))}</TableCell>}
                  {gearExpanded && <TableCell className={getValueClass(-holdingCosts, false, true)}>{formatDollarsSigned(Math.round(-holdingCosts))}</TableCell>}
                  {gearExpanded && <TableCell className={getValueClass(-depreciation, false, true)}>{formatDollarsSigned(Math.round(-depreciation))}</TableCell>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "text-[15px] px-4" : ""}`}>
                    <span className={`font-bold ${netGearing >= 0 ? "text-data-positive" : "text-data-negative"}`}>{netGearing >= 0 ? "+" : ""}{formatDollarsSigned(Math.round(netGearing))}</span>
                    {isCollapsed && (() => {
                      const prevGearing = i > 0 ? (() => { const py = yearData[i-1]; return py.rentalIncome - (py.interestPortion + py.ongoingCosts) - (py.depDiv43 + py.depDiv40); })() : netGearing;
                      const gearYoY = yoyPct(netGearing, prevGearing);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(gearYoY)}`}>{fmtYoY(gearYoY)}</span>;
                    })()}
                  </td>
                  {/* Cashflow detail cells */}
                  {cfExpanded && <td className="h-[52px] box-border pl-6 pr-3 text-right align-middle border-b border-b-white/[0.07] cf-zone text-fg-primary animate-col-fade-in">{formatDollarsSigned(Math.round(y.rentalIncome))}</td>}
                  {cfExpanded && <TableCell className={`cf-zone ${getValueClass(-totalCosts, false, true)}`}>{formatDollarsSigned(Math.round(-totalCosts))}</TableCell>}
                  {cfExpanded && <TableCell className="cf-zone" style={{ color: "var(--color-data-positive)" }}>{y.taxSaved > 0 ? "+" : ""}{formatDollarsSigned(Math.round(y.taxSaved))}</TableCell>}
                  <td className={`h-[52px] box-border ${!cfExpanded ? "pl-6 pr-5" : "px-3 pr-5"} text-right align-middle border-b border-b-white/[0.07] cf-zone ${isCollapsed ? "text-[15px] font-bold tracking-tight" : "text-[13px]"} ${y.propertyCashflow >= 0 ? "text-data-positive font-bold" : "text-data-negative font-bold"}`}>
                    <span className="font-bold">{y.propertyCashflow >= 0 ? "+" : ""}{formatDollarsSigned(Math.round(y.propertyCashflow))}</span>
                    {isCollapsed && (() => {
                      const prevCf = i > 0 ? yearData[i-1].propertyCashflow : y.propertyCashflow;
                      const cfYoY = yoyPct(y.propertyCashflow, prevCf);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(cfYoY)}`}>{fmtYoY(cfYoY)}</span>;
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
              {gearExpanded && (
                <td className="box-border px-3 text-right align-middle text-fg-primary font-medium text-[15px]" style={summaryBorder}>{formatDollarsSigned(Math.round(totals.rent))}</td>
              )}
              {gearExpanded && (
                <td className="box-border px-3 text-right align-middle text-data-negative opacity-85 font-medium text-[15px]" style={summaryBorder}>{formatDollarsSigned(Math.round(-totals.holding))}</td>
              )}
              {gearExpanded && (
                <td className="box-border px-3 text-right align-middle text-data-negative opacity-85 font-medium text-[15px]" style={summaryBorder}>{formatDollarsSigned(Math.round(-totals.depr))}</td>
              )}
              <td className="box-border px-3 text-right align-middle text-[15px]" style={summaryBorder}>
                <span className={`font-semibold ${totals.gearing >= 0 ? "text-data-positive" : "text-data-negative"}`}>{formatDollarsSigned(Math.round(totals.gearing))}</span>
              </td>
              {cfExpanded && (
                <td className="box-border pl-6 pr-3 text-right align-middle text-fg-primary font-medium text-[15px]" style={{ ...summaryBorder, background: "var(--color-cf-wash-strong)" }}>{formatDollarsSigned(Math.round(totals.rent))}</td>
              )}
              {cfExpanded && (
                <td className="box-border px-3 text-right align-middle text-data-negative opacity-85 font-medium text-[15px]" style={{ ...summaryBorder, background: "var(--color-cf-wash-strong)" }}>{formatDollarsSigned(Math.round(-totals.cfCosts))}</td>
              )}
              {cfExpanded && (
                <td className="box-border px-3 text-right align-middle text-data-positive font-medium text-[15px]" style={{ ...summaryBorder, background: "var(--color-cf-wash-strong)" }}>{formatDollarsSigned(Math.round(totals.taxSaved))}</td>
              )}
              <td className={`box-border ${!cfExpanded ? "pl-6 pr-5" : "px-3 pr-5"} text-right align-middle text-[15px]`} style={{ ...summaryBorder, background: "var(--color-cf-wash-strong)" }}>
                <span className={`font-bold ${totals.cashflow >= 0 ? "text-data-positive" : "text-data-negative"}`}>{formatDollarsSigned(Math.round(totals.cashflow))}</span>
              </td>
            </tr>
          </tbody>
        </table>
        );
      })()}

      {/* PROPERTY TABLE — PPOR */}
      {!isInvestment && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-medium tracking-[0.12em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-fg-tertiary" colSpan={2}>costs</th>
              <th className="w-0 max-w-0 p-0 bg-transparent relative border-l border-white/[0.1]" />
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-medium tracking-[0.12em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-fg-tertiary" colSpan={2}>loan</th>
              <th className="w-0 max-w-0 p-0 bg-transparent relative border-l border-white/[0.1]" />
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-medium tracking-[0.12em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-fg-tertiary" />
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap w-24 text-left px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip" data-tip="Interest Portion of Loan Repayment">interest</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip" data-tip="Principal Portion of Loan Repayment">principal</th>
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold text-right whitespace-nowrap tip" data-tip="Interest + Principal">repayments</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold pr-5 text-right whitespace-nowrap tip" data-tip="Annual Property Cashflow">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-left px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  <TableCell animated={false} className={getValueClass(-y.ongoingCosts, false, true)}>{formatDollarsSigned(Math.round(-y.ongoingCosts))}</TableCell>
                  <TableCell animated={false} className={getValueClass(-y.interestPortion, false, true)}>{formatDollarsSigned(Math.round(-y.interestPortion))}</TableCell>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  <TableCell animated={false} className={getValueClass(-y.principalPortion, false, true)}>{formatDollarsSigned(Math.round(-y.principalPortion))}</TableCell>
                  <TableCell tone="emphasis" animated={false}>{formatDollarsSigned(Math.round(-(y.interestPortion + y.principalPortion)))}</TableCell>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  <TableCell animated={false} className={`pr-5 text-sm ${getValueClass(y.propertyCashflow, true)}`}>
                    {formatDollarsSigned(Math.round(y.propertyCashflow))}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
