"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDollarsSigned, safeDiv } from "@/lib/formatters";
import TableCell from "@/components/ui/TableCell";
import { yoyPct, growthPct, yoyClass, fmtYoY, getValueClass, getLvrClass } from "./helpers";
import type { SubTableProps } from "./types";

interface Props extends SubTableProps {
  panel: "property" | "position" | "unified";
}

export default function EquityTable({
  yearData,
  showOffset,
  propertyValue,
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
      {/* EQUITY — Property panel (collapsible columns) */}
      {panel === "property" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-medium tracking-[0.12em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-fg-tertiary cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("property") ? 7 : 1}
                onClick={() => toggleGroup("property")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("property") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>property value</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap w-24 text-left px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {isGroupExpanded("property") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Cumulative Capital Growth From Purchase">total growth</th>}
              {isGroupExpanded("property") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Total Growth as % of Purchase Price">gain %</th>}
              {isGroupExpanded("property") && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-col-fade-in" />}
              {isGroupExpanded("property") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Year-on-Year Capital Growth">yoy growth</th>}
              {isGroupExpanded("property") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Year-on-Year Growth %">yoy %</th>}
              {isGroupExpanded("property") && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-col-fade-in" />}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold pr-5 text-right whitespace-nowrap tip" data-tip="Current Property Value">value</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const prevValue = i > 0 ? yearData[i - 1].propertyValue : propertyValue;
              const totalGrowth = y.propertyValue - propertyValue;
              const totalGrowthPct = growthPct(y.propertyValue, propertyValue).toFixed(1);
              const yoyGrowth = y.propertyValue - prevValue;
              const yoyGrowthPct = i > 0
                ? growthPct(y.propertyValue, prevValue).toFixed(1)
                : totalGrowthPct;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-left px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("property") && <TableCell>+{formatDollarsSigned(Math.round(totalGrowth))}</TableCell>}
                  {isGroupExpanded("property") && <TableCell style={{ color: parseFloat(totalGrowthPct) === 0 ? "var(--color-fg-tertiary)" : parseFloat(totalGrowthPct) > 0 ? "var(--color-data-positive)" : "var(--color-data-negative)" }}>{totalGrowthPct}%</TableCell>}
                  {isGroupExpanded("property") && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-col-fade-in" />}
                  {isGroupExpanded("property") && <TableCell>+{formatDollarsSigned(Math.round(yoyGrowth))}</TableCell>}
                  {isGroupExpanded("property") && <TableCell style={{ color: parseFloat(yoyGrowthPct) === 0 ? "var(--color-fg-tertiary)" : parseFloat(yoyGrowthPct) > 0 ? "var(--color-data-positive)" : "var(--color-data-negative)" }}>{yoyGrowthPct}%</TableCell>}
                  {isGroupExpanded("property") && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-col-fade-in" />}
                  <TableCell animated={false} tone="emphasis" className="pr-5 text-sm" style={{ fontWeight: 700 }}>{formatDollarsSigned(Math.round(y.propertyValue))}</TableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* EQUITY — Position panel (collapsible columns) */}
      {panel === "position" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-medium tracking-[0.12em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-fg-tertiary cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("position") ? (showOffset ? 7 : 4) : 1}
                onClick={() => toggleGroup("position")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("position") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>net equity</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              {isGroupExpanded("position") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Current Property Value">prop value</th>}
              {isGroupExpanded("position") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Outstanding Loan Balance">loan balance</th>}
              {isGroupExpanded("position") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Loan-to-Value Ratio">lvr</th>}
              {isGroupExpanded("position") && showOffset && <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Property Value − Loan Balance">prop equity</th>}
              {isGroupExpanded("position") && showOffset && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-col-fade-in" />}
              {isGroupExpanded("position") && showOffset && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Offset Account Balance">offset</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold pr-5 text-right whitespace-nowrap tip" data-tip={showOffset ? "Property Equity + Offset Balance" : "Property Value − Loan Balance"}>net equity</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const lvr = safeDiv(y.loanBalance, y.propertyValue) * 100;
              const propertyEquity = y.propertyValue - y.loanBalance;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("position") && <TableCell>{formatDollarsSigned(Math.round(y.propertyValue))}</TableCell>}
                  {isGroupExpanded("position") && <TableCell className={getValueClass(-y.loanBalance, false, true)}>{formatDollarsSigned(Math.round(-y.loanBalance))}</TableCell>}
                  {isGroupExpanded("position") && <TableCell className={getLvrClass(lvr)}>{lvr.toFixed(1)}%</TableCell>}
                  {isGroupExpanded("position") && showOffset && <TableCell tone="emphasis" style={{ fontWeight: 700 }}>{formatDollarsSigned(Math.round(propertyEquity))}</TableCell>}
                  {isGroupExpanded("position") && showOffset && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-col-fade-in" />}
                  {isGroupExpanded("position") && showOffset && <TableCell>{formatDollarsSigned(Math.round(y.offsetBalanceAtYear))}</TableCell>}
                  <TableCell animated={false} tone="emphasis" className="pr-5 text-sm" style={{ fontWeight: 700 }}>
                    {formatDollarsSigned(Math.round(y.netEquity))}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* EQUITY — Unified (Property + Position in one table) */}
      {panel === "unified" && (() => {
        const propExpanded = isGroupExpanded("property");
        const posExpanded = isGroupExpanded("position");
        const lastYear = yearData[yearData.length - 1];
        const finalValue = lastYear.propertyValue;
        const finalGrowth = lastYear.propertyValue - propertyValue;
        const finalGrowthPct = growthPct(lastYear.propertyValue, propertyValue);
        const finalLoan = lastYear.loanBalance;
        const finalLvr = safeDiv(lastYear.loanBalance, lastYear.propertyValue) * 100;
        const finalPropEq = lastYear.propertyValue - lastYear.loanBalance;
        const finalOffset = lastYear.offsetBalanceAtYear;
        const finalNetEquity = lastYear.netEquity;
        const summaryBorder = { borderTop: "1px solid rgba(45,212,191,0.30)" } as const;

        return (
        <table className="border-collapse tabular-nums text-[13px] leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0" style={{ background: "var(--color-surface-raised)" }}>
              <th className="h-7 box-border px-3 text-center align-bottom" />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-medium tracking-[0.12em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-fg-secondary cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={propExpanded ? 5 : 1}
                onClick={() => toggleGroup("property")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {propExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>property value</span>
                </span>
              </th>
              <th
                className="h-7 box-border pl-6 pr-3 text-center align-bottom text-[10px] font-medium tracking-[0.12em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-fg-secondary cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={posExpanded ? (showOffset ? 5 : 3) : 1}
                onClick={() => toggleGroup("position")}
                style={{ background: "var(--color-cf-wash-strong)" }}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {posExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>net equity</span>
                </span>
              </th>
            </tr>
            {(propExpanded || posExpanded) && (
            <tr className="h-14 border-b border-white/[0.10]" style={{ background: "var(--color-surface-raised)" }}>
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap w-24 text-left px-2.5" />
              {/* Property detail columns */}
              {propExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Cumulative Growth $">total $</th>}
              {propExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Cumulative Growth %">total %</th>}
              {propExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Year-on-Year Growth $">yoy $</th>}
              {propExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Year-on-Year Growth %">yoy %</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold text-right whitespace-nowrap tip" data-tip="Current Property Value">value</th>
              {/* Position detail columns */}
              {posExpanded && <th className="h-14 box-border align-middle pl-6 pr-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" style={{ background: "var(--color-cf-wash-strong)" }} data-tip="Outstanding Loan Balance">loan</th>}
              {posExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" style={{ background: "var(--color-cf-wash-strong)" }} data-tip="Loan-to-Value Ratio">lvr</th>}
              {posExpanded && showOffset && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" style={{ background: "var(--color-cf-wash-strong)" }} data-tip="Property Equity">prop eq.</th>}
              {posExpanded && showOffset && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" style={{ background: "var(--color-cf-wash-strong)" }} data-tip="Offset Balance">offset</th>}
              <th className={`h-14 box-border align-middle ${!posExpanded ? "pl-6 pr-5" : "px-3 pr-5"} text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold text-right whitespace-nowrap tip`} style={{ background: "var(--color-cf-wash-strong)" }} data-tip={showOffset ? "Property Equity + Offset" : "Property − Loan"}>net equity</th>
            </tr>
            )}
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const prevValue = i > 0 ? yearData[i - 1].propertyValue : propertyValue;
              const totalGrowth = y.propertyValue - propertyValue;
              const totalGrowthPct = growthPct(y.propertyValue, propertyValue).toFixed(1);
              const yoyGrowth = y.propertyValue - prevValue;
              const yoyGrowthPct = i > 0 ? growthPct(y.propertyValue, prevValue).toFixed(1) : totalGrowthPct;
              const lvr = safeDiv(y.loanBalance, y.propertyValue) * 100;
              const propertyEquity = y.propertyValue - y.loanBalance;
              const isCollapsed = !propExpanded && !posExpanded;
              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-left px-2.5">{formatYearCell(y.year, i, isMilestone)}</td>
                  {/* Property detail cells */}
                  {propExpanded && <TableCell tone="emphasis">+{formatDollarsSigned(Math.round(totalGrowth))}</TableCell>}
                  {propExpanded && <TableCell style={{ color: parseFloat(totalGrowthPct) === 0 ? "var(--color-fg-tertiary)" : parseFloat(totalGrowthPct) > 0 ? "var(--color-data-positive)" : "var(--color-data-negative)", opacity: parseFloat(totalGrowthPct) > 0 ? 0.8 : 1 }}>{totalGrowthPct}%</TableCell>}
                  {propExpanded && <TableCell tone="emphasis">+{formatDollarsSigned(Math.round(yoyGrowth))}</TableCell>}
                  {propExpanded && <TableCell style={{ color: parseFloat(yoyGrowthPct) === 0 ? "var(--color-fg-tertiary)" : parseFloat(yoyGrowthPct) > 0 ? "var(--color-data-positive)" : "var(--color-data-negative)", opacity: parseFloat(yoyGrowthPct) > 0 ? 0.8 : 1 }}>{yoyGrowthPct}%</TableCell>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "text-[15px] px-4" : ""}`}>
                    <span className="font-semibold" style={{ color: "var(--color-fg-primary)" }}>{formatDollarsSigned(Math.round(y.propertyValue))}</span>
                    {isCollapsed && (
                      <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(parseFloat(yoyGrowthPct))}`}>{fmtYoY(parseFloat(yoyGrowthPct))}</span>
                    )}
                  </td>
                  {/* Position detail cells */}
                  {posExpanded && <td className={`h-[52px] box-border pl-6 pr-3 text-right align-middle border-b border-b-white/[0.07] cf-zone animate-col-fade-in ${getValueClass(-y.loanBalance, false, true)}`}>{formatDollarsSigned(Math.round(-y.loanBalance))}</td>}
                  {posExpanded && <TableCell className={`cf-zone ${getLvrClass(lvr)}`}>{lvr.toFixed(1)}%</TableCell>}
                  {posExpanded && showOffset && <TableCell className="cf-zone" style={{ fontWeight: 600, color: "var(--color-fg-primary)" }}>{formatDollarsSigned(Math.round(propertyEquity))}</TableCell>}
                  {posExpanded && showOffset && <TableCell tone="emphasis" className="cf-zone">{formatDollarsSigned(Math.round(y.offsetBalanceAtYear))}</TableCell>}
                  <td className={`h-[52px] box-border ${!posExpanded ? "pl-6 pr-5" : "px-3 pr-5"} text-right align-middle border-b border-b-white/[0.07] cf-zone ${isCollapsed ? "text-[15px] font-bold tracking-tight" : "text-[13px]"}`}>
                    <span className="font-bold text-data-positive">{formatDollarsSigned(Math.round(y.netEquity))}</span>
                    {isCollapsed && (() => {
                      const prevEquity = i > 0 ? yearData[i-1].netEquity : y.netEquity;
                      const eqYoY = yoyPct(y.netEquity, prevEquity);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(eqYoY)}`}>{fmtYoY(eqYoY)}</span>;
                    })()}
                  </td>
                </tr>
              );
            })}
            {/* Summary row — final values at end of period */}
            <tr className="row-summary">
              <td className="box-border align-middle pl-[18px] text-left" style={summaryBorder}>
                <span className="text-[10.5px] tracking-[0.14em] uppercase text-fg-secondary font-medium">{yearData.length}-yr end</span>
              </td>
              {propExpanded && (
                <td className="box-border px-3 text-right align-middle text-fg-primary font-medium text-[15px]" style={summaryBorder}>
                  +{formatDollarsSigned(Math.round(finalGrowth))}
                </td>
              )}
              {propExpanded && (
                <td className="box-border px-3 text-right align-middle font-medium text-[15px]" style={{ ...summaryBorder, color: finalGrowthPct === 0 ? "var(--color-fg-tertiary)" : finalGrowthPct > 0 ? "var(--color-data-positive)" : "var(--color-data-negative)", opacity: finalGrowthPct > 0 ? 0.8 : 1 }}>
                  {finalGrowthPct.toFixed(1)}%
                </td>
              )}
              {propExpanded && (
                <td className="box-border px-3 text-right align-middle text-fg-tertiary text-[15px]" style={summaryBorder}>—</td>
              )}
              {propExpanded && (
                <td className="box-border px-3 text-right align-middle text-fg-tertiary text-[15px]" style={summaryBorder}>—</td>
              )}
              <td className="box-border px-3 text-right align-middle text-[15px]" style={summaryBorder}>
                <span className="font-semibold text-fg-primary">{formatDollarsSigned(Math.round(finalValue))}</span>
              </td>
              {posExpanded && (
                <td className="box-border pl-6 pr-3 text-right align-middle text-data-negative opacity-85 font-medium text-[15px]" style={{ ...summaryBorder, background: "var(--color-cf-wash-strong)" }}>
                  {formatDollarsSigned(Math.round(-finalLoan))}
                </td>
              )}
              {posExpanded && (
                <td className={`box-border px-3 text-right align-middle font-medium text-[15px] ${getLvrClass(finalLvr)}`} style={{ ...summaryBorder, background: "var(--color-cf-wash-strong)" }}>
                  {finalLvr.toFixed(1)}%
                </td>
              )}
              {posExpanded && showOffset && (
                <td className="box-border px-3 text-right align-middle text-fg-primary font-medium text-[15px]" style={{ ...summaryBorder, background: "var(--color-cf-wash-strong)" }}>
                  {formatDollarsSigned(Math.round(finalPropEq))}
                </td>
              )}
              {posExpanded && showOffset && (
                <td className="box-border px-3 text-right align-middle text-fg-primary font-medium text-[15px]" style={{ ...summaryBorder, background: "var(--color-cf-wash-strong)" }}>
                  {formatDollarsSigned(Math.round(finalOffset))}
                </td>
              )}
              <td className={`box-border ${!posExpanded ? "pl-6 pr-5" : "px-3 pr-5"} text-right align-middle text-[15px]`} style={{ ...summaryBorder, background: "var(--color-cf-wash-strong)" }}>
                <span className="font-bold text-data-positive">{formatDollarsSigned(Math.round(finalNetEquity))}</span>
              </td>
            </tr>
          </tbody>
        </table>
        );
      })()}
    </>
  );
}
