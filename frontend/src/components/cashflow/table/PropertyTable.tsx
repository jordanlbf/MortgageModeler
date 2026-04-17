"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDollarsSigned } from "@/lib/formatters";
import { yoyPct, yoyClass, fmtYoY, getValueClass } from "./helpers";
import type { SubTableProps } from "./types";

interface Props extends SubTableProps {
  panel?: "gearing" | "cashflow" | "unified";
}

export default function PropertyTable({
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
      {isInvestment && panel === "gearing" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-amber-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
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
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {isGroupExpanded("gearing") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("gearing") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Interest + Ongoing Costs">holding</th>}
              {isGroupExpanded("gearing") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Div 43 + Div 40 Depreciation">depreciation</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Rent − Holding − Depreciation (negative = negatively geared)">net gearing</th>
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
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("gearing") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("gearing") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-holdingCosts, false, true)}`}>{formatDollarsSigned(Math.round(-holdingCosts))}</td>}
                  {isGroupExpanded("gearing") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-depreciation, false, true)}`}>{formatDollarsSigned(Math.round(-depreciation))}</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm ${netGearing >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>{formatDollarsSigned(Math.round(netGearing))}</td>
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
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
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
              {isGroupExpanded("propertyCashflow") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("propertyCashflow") && <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Holding + Repayments">total costs</th>}
              {isGroupExpanded("propertyCashflow") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Tax Benefit From Property Deductions">tax saved</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Rent − Total Costs + Tax Saved">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingCosts = y.interestPortion + y.ongoingCosts;
              const totalCosts = holdingCosts + y.principalPortion;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("propertyCashflow") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("propertyCashflow") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-totalCosts, false, true)}`}>{formatDollarsSigned(Math.round(-totalCosts))}</td>}
                  {isGroupExpanded("propertyCashflow") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: "var(--color-positive)" }}>{y.taxSaved > 0 ? "+" : ""}{formatDollarsSigned(Math.round(y.taxSaved))}</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm ${y.propertyCashflow >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>
                    {formatDollarsSigned(Math.round(y.propertyCashflow))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — Unified (Gearing + Cashflow in one table) */}
      {isInvestment && panel === "unified" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-amber-400/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("gearing") ? 4 : 1}
                onClick={() => toggleGroup("gearing")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("gearing") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>gearing</span>
                </span>
              </th>
              <th className="h-7 box-border px-3 text-center align-bottom w-px !p-0 bg-white/[0.1]" />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("propertyCashflow") ? 4 : 1}
                onClick={() => toggleGroup("propertyCashflow")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("propertyCashflow") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>cashflow</span>
                </span>
              </th>
            </tr>
            {(isGroupExpanded("gearing") || isGroupExpanded("propertyCashflow")) && (
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Gearing detail columns */}
              {isGroupExpanded("gearing") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("gearing") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Interest + Ongoing Costs">holding</th>}
              {isGroupExpanded("gearing") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Div 43 + Div 40 Depreciation">depr.</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Rent − Holding − Depreciation">net gearing</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Cashflow detail columns */}
              {isGroupExpanded("propertyCashflow") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("propertyCashflow") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Holding + Repayments">costs</th>}
              {isGroupExpanded("propertyCashflow") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Tax Benefit">tax saved</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Rent − Costs + Tax Saved">cashflow</th>
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
              const isCollapsed = !isGroupExpanded("gearing") && !isGroupExpanded("propertyCashflow");
              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Gearing detail cells */}
                  {isGroupExpanded("gearing") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("gearing") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-holdingCosts, false, true)}`}>{formatDollarsSigned(Math.round(-holdingCosts))}</td>}
                  {isGroupExpanded("gearing") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-depreciation, false, true)}`}>{formatDollarsSigned(Math.round(-depreciation))}</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "px-4" : ""} ${netGearing >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>
                    <span className="font-semibold">{netGearing >= 0 ? "+" : ""}{formatDollarsSigned(Math.round(netGearing))}</span>
                    {isCollapsed && (() => {
                      const prevGearing = i > 0 ? (() => { const py = yearData[i-1]; return py.rentalIncome - (py.interestPortion + py.ongoingCosts) - (py.depDiv43 + py.depDiv40); })() : netGearing;
                      const gearYoY = yoyPct(netGearing, prevGearing);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(gearYoY)}`}>{fmtYoY(gearYoY)}</span>;
                    })()}
                  </td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Cashflow detail cells */}
                  {isGroupExpanded("propertyCashflow") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("propertyCashflow") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-totalCosts, false, true)}`}>{formatDollarsSigned(Math.round(-totalCosts))}</td>}
                  {isGroupExpanded("propertyCashflow") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: "var(--color-positive)" }}>{y.taxSaved > 0 ? "+" : ""}{formatDollarsSigned(Math.round(y.taxSaved))}</td>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "pr-5 text-base font-bold tracking-tight" : "pr-5 text-sm"} ${y.propertyCashflow >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>
                    <span className="font-semibold">{y.propertyCashflow >= 0 ? "+" : ""}{formatDollarsSigned(Math.round(y.propertyCashflow))}</span>
                    {isCollapsed && (() => {
                      const prevCf = i > 0 ? yearData[i-1].propertyCashflow : y.propertyCashflow;
                      const cfYoY = yoyPct(y.propertyCashflow, prevCf);
                      return <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(cfYoY)}`}>{fmtYoY(cfYoY)}</span>;
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — PPOR */}
      {!isInvestment && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-white/[0.35]" colSpan={2}>costs</th>
              <th className="w-0 max-w-0 p-0 bg-transparent relative border-l border-white/[0.1]" />
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-white/[0.35]" colSpan={2}>loan</th>
              <th className="w-0 max-w-0 p-0 bg-transparent relative border-l border-white/[0.1]" />
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65" />
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Interest Portion of Loan Repayment">interest</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Principal Portion of Loan Repayment">principal</th>
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Interest + Principal">repayments</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Annual Property Cashflow">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${getValueClass(-y.ongoingCosts, false, true)}`}>{formatDollarsSigned(Math.round(-y.ongoingCosts))}</td>
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${getValueClass(-y.interestPortion, false, true)}`}>{formatDollarsSigned(Math.round(-y.interestPortion))}</td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${getValueClass(-y.principalPortion, false, true)}`}>{formatDollarsSigned(Math.round(-y.principalPortion))}</td>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#f0fdfa]">{formatDollarsSigned(Math.round(-(y.interestPortion + y.principalPortion)))}</td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm ${getValueClass(y.propertyCashflow, true)}`}>
                    {formatDollarsSigned(Math.round(y.propertyCashflow))}
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
