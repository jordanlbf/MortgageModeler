"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDollarsSigned, safeDiv } from "@/lib/formatters";
import { yoyPct, growthPct, yoyClass, fmtYoY, getValueClass, getLvrClass } from "./helpers";
import type { SubTableProps } from "./types";

interface Props extends SubTableProps {
  panel: "property" | "position" | "unified";
}

export default function EquityTable({
  yearData,
  isInvestment,
  showOffset,
  propertyValue,
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
      {/* EQUITY — Property panel (collapsible columns) */}
      {panel === "property" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
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
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Cumulative Capital Growth From Purchase">total growth</th>}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Total Growth as % of Purchase Price">gain %</th>}
              {isGroupExpanded("property") && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Capital Growth">yoy growth</th>}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Growth %">yoy %</th>}
              {isGroupExpanded("property") && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Current Property Value">value</th>
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
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">+{formatDollarsSigned(Math.round(totalGrowth))}</td>}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(totalGrowthPct) === 0 ? "var(--color-faint)" : parseFloat(totalGrowthPct) > 0 ? "var(--color-positive)" : "var(--color-negative)" }}>{totalGrowthPct}%</td>}
                  {isGroupExpanded("property") && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">+{formatDollarsSigned(Math.round(yoyGrowth))}</td>}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(yoyGrowthPct) === 0 ? "var(--color-faint)" : parseFloat(yoyGrowthPct) > 0 ? "var(--color-positive)" : "var(--color-negative)" }}>{yoyGrowthPct}%</td>}
                  {isGroupExpanded("property") && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-foreground)" }}>{formatDollarsSigned(Math.round(y.propertyValue))}</td>
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
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-blue-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
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
              {isGroupExpanded("position") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Current Property Value">prop value</th>}
              {isGroupExpanded("position") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Outstanding Loan Balance">loan balance</th>}
              {isGroupExpanded("position") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Loan-to-Value Ratio">lvr</th>}
              {isGroupExpanded("position") && showOffset && <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Property Value − Loan Balance">prop equity</th>}
              {isGroupExpanded("position") && showOffset && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
              {isGroupExpanded("position") && showOffset && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Offset Account Balance">offset</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip={showOffset ? "Property Equity + Offset Balance" : "Property Value − Loan Balance"}>net equity</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const lvr = safeDiv(y.loanBalance, y.propertyValue) * 100;
              const propertyEquity = y.propertyValue - y.loanBalance;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("position") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.propertyValue))}</td>}
                  {isGroupExpanded("position") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.loanBalance, false, true)}`}>{formatDollarsSigned(Math.round(-y.loanBalance))}</td>}
                  {isGroupExpanded("position") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getLvrClass(lvr)}`}>{lvr.toFixed(1)}%</td>}
                  {isGroupExpanded("position") && showOffset && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ fontWeight: 700, color: "var(--color-foreground)" }}>{formatDollarsSigned(Math.round(propertyEquity))}</td>}
                  {isGroupExpanded("position") && showOffset && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
                  {isGroupExpanded("position") && showOffset && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.offsetBalanceAtYear))}</td>}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
                    {formatDollarsSigned(Math.round(y.netEquity))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* EQUITY — Unified (Property + Position in one table) */}
      {panel === "unified" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("property") ? 7 : 1}
                onClick={() => toggleGroup("property")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("property") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>property value</span>
                </span>
              </th>
              <th className="h-7 box-border px-3 text-center align-bottom w-px !p-0 bg-white/[0.1]" />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-blue-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("position") ? (showOffset ? 6 : 3) : 1}
                onClick={() => toggleGroup("position")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("position") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>net equity</span>
                </span>
              </th>
            </tr>
            {(isGroupExpanded("property") || isGroupExpanded("position")) && (
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Property detail columns */}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Cumulative Growth $">total $</th>}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Cumulative Growth %">total %</th>}
              {isGroupExpanded("property") && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Growth $">yoy $</th>}
              {isGroupExpanded("property") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Growth %">yoy %</th>}
              {isGroupExpanded("property") && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Current Property Value">value</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Position detail columns */}
              {isGroupExpanded("position") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Outstanding Loan Balance">loan</th>}
              {isGroupExpanded("position") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Loan-to-Value Ratio">lvr</th>}
              {isGroupExpanded("position") && showOffset && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Property Equity">prop eq.</th>}
              {isGroupExpanded("position") && showOffset && <th className="w-0 max-w-0 p-0 border-l border-white/[0.1] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
              {isGroupExpanded("position") && showOffset && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Offset Balance">offset</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip={showOffset ? "Property Equity + Offset" : "Property − Loan"}>net equity</th>
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
              const isCollapsed = !isGroupExpanded("property") && !isGroupExpanded("position");
              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Property detail cells */}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">+{formatDollarsSigned(Math.round(totalGrowth))}</td>}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(totalGrowthPct) === 0 ? "var(--color-faint)" : parseFloat(totalGrowthPct) > 0 ? "var(--color-positive)" : "var(--color-negative)" }}>{totalGrowthPct}%</td>}
                  {isGroupExpanded("property") && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">+{formatDollarsSigned(Math.round(yoyGrowth))}</td>}
                  {isGroupExpanded("property") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(yoyGrowthPct) === 0 ? "var(--color-faint)" : parseFloat(yoyGrowthPct) > 0 ? "var(--color-positive)" : "var(--color-negative)" }}>{yoyGrowthPct}%</td>}
                  {isGroupExpanded("property") && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "px-4" : ""}`} style={{ fontWeight: 600, color: "var(--color-foreground)" }}>
                    <span className="font-semibold">{formatDollarsSigned(Math.round(y.propertyValue))}</span>
                    {isCollapsed && (
                      <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(parseFloat(yoyGrowthPct))}`}>{fmtYoY(parseFloat(yoyGrowthPct))}</span>
                    )}
                  </td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Position detail cells */}
                  {isGroupExpanded("position") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.loanBalance, false, true)}`}>{formatDollarsSigned(Math.round(-y.loanBalance))}</td>}
                  {isGroupExpanded("position") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getLvrClass(lvr)}`}>{lvr.toFixed(1)}%</td>}
                  {isGroupExpanded("position") && showOffset && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ fontWeight: 600, color: "var(--color-foreground)" }}>{formatDollarsSigned(Math.round(propertyEquity))}</td>}
                  {isGroupExpanded("position") && showOffset && <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" />}
                  {isGroupExpanded("position") && showOffset && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.offsetBalanceAtYear))}</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "pr-5 text-base font-bold tracking-tight" : "pr-5 text-sm"}`} style={{ fontWeight: 700, color: "var(--color-positive)" }}>
                    <span className="font-semibold">{formatDollarsSigned(Math.round(y.netEquity))}</span>
                    {isCollapsed && (() => {
                      const prevEquity = i > 0 ? yearData[i-1].netEquity : y.netEquity;
                      const eqYoY = yoyPct(y.netEquity, prevEquity);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(eqYoY)}`}>{fmtYoY(eqYoY)}</span>;
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
