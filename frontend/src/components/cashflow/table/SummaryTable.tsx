"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDollarsSigned } from "@/lib/formatters";
import { yoyPct, yoyClass, fmtYoY, getValueClass } from "./helpers";
import type { SubTableProps } from "./types";

interface Props extends SubTableProps {
  panel: "income" | "outgoings" | "cashflow" | "unified";
}

export default function SummaryTable({
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
      {/* SUMMARY — Income panel (collapsible columns) */}
      {panel === "income" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("income") ? (isInvestment ? 5 : 3) : 1}
                onClick={() => toggleGroup("income")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("income") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>income</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {isGroupExpanded("income") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Salary (grows with capital growth rate)">salary</th>}
              {isGroupExpanded("income") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Salary Growth">gain %</th>}
              {isGroupExpanded("income") && isInvestment && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income (grows with capital growth rate)">rent</th>}
              {isGroupExpanded("income") && isInvestment && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Rent Growth">gain %</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Salary + Rent">total income</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const prevSalary = i > 0 ? yearData[i - 1].salary : y.salary;
              const prevRent = i > 0 ? yearData[i - 1].rentalIncome : y.rentalIncome;
              const salaryGain = yoyPct(y.salary, prevSalary).toFixed(1);
              const rentGain = yoyPct(y.rentalIncome, prevRent).toFixed(1);
              const totalIncome = y.salary + (isInvestment ? y.rentalIncome : 0);
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("income") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.salary))}</td>}
                  {isGroupExpanded("income") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(salaryGain) > 0 ? "var(--color-positive)" : "var(--color-faint)" }}>{salaryGain}%</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(rentGain) > 0 ? "var(--color-positive)" : "var(--color-faint)" }}>{rentGain}%</td>}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
                    {formatDollarsSigned(Math.round(totalIncome))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* SUMMARY — Outgoings panel (collapsible columns) */}
      {panel === "outgoings" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-white/[0.35] cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("outgoings") ? 4 : 1}
                onClick={() => toggleGroup("outgoings")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("outgoings") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>outgoings</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              {isGroupExpanded("outgoings") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>}
              {isGroupExpanded("outgoings") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Interest + Principal">repayments</th>}
              {isGroupExpanded("outgoings") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Income Tax (incl. Medicare Levy)">tax</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Holding + Repayments + Tax">total costs</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const totalCosts = y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("outgoings") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.ongoingCosts, false, true)}`}>{formatDollarsSigned(Math.round(-y.ongoingCosts))}</td>}
                  {isGroupExpanded("outgoings") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.loanRepayment, false, true)}`}>{formatDollarsSigned(Math.round(-y.loanRepayment))}</td>}
                  {isGroupExpanded("outgoings") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.incomeTaxCalc, false, true)}`}>{formatDollarsSigned(Math.round(-y.incomeTaxCalc))}</td>}
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-negative)" }}>
                    {formatDollarsSigned(Math.round(-totalCosts))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* SUMMARY — Cashflow panel */}
      {panel === "cashflow" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65" colSpan={3}>cashflow</th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Salary + Rent">total income</th>
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Holding + Repayments + Tax">total costs</th>
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Total Income − Total Costs">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const totalIncome = y.salary + (isInvestment ? y.rentalIncome : 0);
              const totalCosts = y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc;
              const annualCashflow = totalIncome - totalCosts;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2]">{formatDollarsSigned(Math.round(totalIncome))}</td>
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${getValueClass(-totalCosts, false, true)}`}>{formatDollarsSigned(Math.round(-totalCosts))}</td>
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] pr-5 text-sm ${annualCashflow >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>
                    {formatDollarsSigned(Math.round(annualCashflow))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* SUMMARY — Unified table (all columns in one table with collapsible groups) */}
      {panel === "unified" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65 cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("income") ? (isInvestment ? 5 : 3) : 1}
                onClick={() => toggleGroup("income")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("income") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>income</span>
                </span>
              </th>
              <th className="h-7 box-border px-3 text-center align-bottom w-px !p-0 bg-white/[0.1]" />
              <th
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-white/[0.35] cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
                colSpan={isGroupExpanded("outgoings") ? 4 : 1}
                onClick={() => toggleGroup("outgoings")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("outgoings") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>outgoings</span>
                </span>
              </th>
              <th className="h-7 box-border px-3 text-center align-bottom w-px !p-0 bg-white/[0.1]" />
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent/65">cashflow</th>
            </tr>
            {(isGroupExpanded("income") || isGroupExpanded("outgoings")) && (
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap w-24 text-center px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Income detail columns */}
              {isGroupExpanded("income") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Salary">salary</th>}
              {isGroupExpanded("income") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Salary Growth">gain %</th>}
              {isGroupExpanded("income") && isInvestment && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income">rent</th>}
              {isGroupExpanded("income") && isInvestment && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Rent Growth">gain %</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Salary + Rent">total</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Outgoings detail columns */}
              {isGroupExpanded("outgoings") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>}
              {isGroupExpanded("outgoings") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Interest + Principal">repay</th>}
              {isGroupExpanded("outgoings") && <th className="h-12 box-border px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-white/[0.42] text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Income Tax (incl. Medicare Levy)">tax</th>}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Holding + Repayments + Tax">total</th>
              <th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {/* Cashflow result */}
              <th className="h-12 box-border px-3 text-[11px] tracking-[0.02em] capitalize text-white/70 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Total Income − Total Costs">net</th>
            </tr>
            )}
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const prevSalary = i > 0 ? yearData[i - 1].salary : y.salary;
              const prevRent = i > 0 ? yearData[i - 1].rentalIncome : y.rentalIncome;
              const salaryGain = yoyPct(y.salary, prevSalary).toFixed(1);
              const rentGain = yoyPct(y.rentalIncome, prevRent).toFixed(1);
              const totalIncome = y.salary + (isInvestment ? y.rentalIncome : 0);
              const totalCosts = y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc;
              const annualCashflow = totalIncome - totalCosts;

              // Calculate YoY changes for collapsed view
              const prevIncome = i > 0 ? yearData[i - 1].salary + (isInvestment ? yearData[i - 1].rentalIncome : 0) : totalIncome;
              const prevCosts = i > 0 ? yearData[i - 1].ongoingCosts + yearData[i - 1].loanRepayment + yearData[i - 1].incomeTaxCalc : totalCosts;
              const incomeYoY = yoyPct(totalIncome, prevIncome);
              const costsYoY = yoyPct(totalCosts, prevCosts);

              const isCollapsed = !isGroupExpanded("income") && !isGroupExpanded("outgoings");

              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-center px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Income detail cells */}
                  {isGroupExpanded("income") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.salary))}</td>}
                  {isGroupExpanded("income") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(salaryGain) > 0 ? "var(--color-positive)" : "var(--color-faint)" }}>{salaryGain}%</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-[#ccccd2] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(rentGain) > 0 ? "var(--color-positive)" : "var(--color-faint)" }}>{rentGain}%</td>}
                  {/* Income total - larger when collapsed, with YoY indicator */}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "px-4" : ""}`}>
                    <span className="font-semibold" style={{ color: "var(--color-foreground)" }}>{formatDollarsSigned(Math.round(totalIncome))}</span>
                    {isCollapsed && (
                      <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(incomeYoY)}`}>{fmtYoY(incomeYoY)}</span>
                    )}
                  </td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Outgoings detail cells */}
                  {isGroupExpanded("outgoings") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.ongoingCosts, false, true)}`}>{formatDollarsSigned(Math.round(-y.ongoingCosts))}</td>}
                  {isGroupExpanded("outgoings") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.loanRepayment, false, true)}`}>{formatDollarsSigned(Math.round(-y.loanRepayment))}</td>}
                  {isGroupExpanded("outgoings") && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.incomeTaxCalc, false, true)}`}>{formatDollarsSigned(Math.round(-y.incomeTaxCalc))}</td>}
                  {/* Outgoings total - larger when collapsed, with YoY indicator */}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "px-4" : ""}`}>
                    <span className="font-semibold" style={{ color: "var(--color-negative)" }}>{formatDollarsSigned(Math.round(-totalCosts))}</span>
                    {isCollapsed && (
                      <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(costsYoY, "negative")}`}>{fmtYoY(costsYoY)}</span>
                    )}
                  </td>
                  <td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {/* Cashflow result */}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "pr-5 text-base font-bold tracking-tight" : "pr-5 text-sm"} ${annualCashflow >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>
                    <span className="font-semibold">{annualCashflow >= 0 ? "+" : ""}{formatDollarsSigned(Math.round(annualCashflow))}</span>
                    {isCollapsed && (() => {
                      const prevCashflow = i > 0 ? (prevIncome - prevCosts) : annualCashflow;
                      const cashflowYoY = yoyPct(annualCashflow, prevCashflow);
                      return (
                        <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(cashflowYoY)}`}>{fmtYoY(cashflowYoY)}</span>
                      );
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
