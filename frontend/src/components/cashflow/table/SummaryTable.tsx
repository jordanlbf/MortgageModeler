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
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
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
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap w-24 text-left px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-white/[0.1]" />
              {isGroupExpanded("income") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Salary (grows with capital growth rate)">salary</th>}
              {isGroupExpanded("income") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Salary Growth">gain %</th>}
              {isGroupExpanded("income") && isInvestment && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income (grows with capital growth rate)">rent</th>}
              {isGroupExpanded("income") && isInvestment && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Rent Growth">gain %</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-white/85 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Salary + Rent">total income</th>
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
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-left px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("income") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-foreground animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.salary))}</td>}
                  {isGroupExpanded("income") && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(salaryGain) > 0 ? "var(--color-positive)" : "var(--color-faint)", opacity: parseFloat(salaryGain) > 0 ? 0.8 : 1 }}>{salaryGain}%</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-foreground animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.rentalIncome))}</td>}
                  {isGroupExpanded("income") && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(rentGain) > 0 ? "var(--color-positive)" : "var(--color-faint)", opacity: parseFloat(rentGain) > 0 ? 0.8 : 1 }}>{rentGain}%</td>}
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
                className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-subtle cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03]"
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
              {isGroupExpanded("outgoings") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>}
              {isGroupExpanded("outgoings") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Interest + Principal">repayments</th>}
              {isGroupExpanded("outgoings") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Income Tax (incl. Medicare Levy)">tax</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-white/85 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Holding + Repayments + Tax">total costs</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y) => {
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
              <th className="h-7 box-border px-3 text-center align-bottom text-[10px] font-semibold tracking-[0.06em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[3px] before:rounded-b-sm before:bg-current before:opacity-75 text-accent" colSpan={3}>cashflow</th>
            </tr>
            <tr className="h-14 border-b border-white/[0.12]">
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Salary + Rent">total income</th>
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Holding + Repayments + Tax">total costs</th>
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-white/85 font-bold pr-5 text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Total Income − Total Costs">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const totalIncome = y.salary + (isInvestment ? y.rentalIncome : 0);
              const totalCosts = y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc;
              const annualCashflow = totalIncome - totalCosts;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] text-foreground">{formatDollarsSigned(Math.round(totalIncome))}</td>
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
      {panel === "unified" && (() => {
        const totals = yearData.reduce((acc, y) => ({
          income: acc.income + y.salary + (isInvestment ? y.rentalIncome : 0),
          costs: acc.costs + y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc,
          salary: acc.salary + y.salary,
          rent: acc.rent + (isInvestment ? y.rentalIncome : 0),
          holding: acc.holding + y.ongoingCosts,
          repay: acc.repay + y.loanRepayment,
          tax: acc.tax + y.incomeTaxCalc,
        }), { income: 0, costs: 0, salary: 0, rent: 0, holding: 0, repay: 0, tax: 0 });
        const totalCashflow = totals.income - totals.costs;
        const ogExpanded = isGroupExpanded("outgoings");
        const incExpanded = isGroupExpanded("income");

        return (
        <table className="border-collapse tabular-nums text-[13px] leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            {/* Group header row */}
            <tr className="h-11 border-b-0" style={{ background: "var(--color-surface-raised)" }}>
              <th className="h-11 box-border pb-2 px-3 text-center align-bottom" />
              <th
                className="h-11 box-border pb-2 px-3 text-center align-bottom text-[10.5px] font-medium tracking-[0.14em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[2.5px] before:rounded-b-sm before:bg-current text-accent cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03] [&_svg]:opacity-70 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 hover:[&_svg]:opacity-100"
                colSpan={incExpanded ? (isInvestment ? 5 : 3) : 1}
                onClick={() => toggleGroup("income")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:shrink-0">
                  {incExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>income</span>
                </span>
              </th>
              <th
                className="h-11 box-border pb-2 pl-6 pr-3 text-center align-bottom text-[10.5px] font-medium tracking-[0.14em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[2.5px] before:rounded-b-sm before:bg-current text-subtle cursor-pointer transition-[background] duration-150 ease-in-out select-none hover:bg-white/[0.03] out-zone [&_svg]:opacity-70 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 hover:[&_svg]:opacity-100"
                colSpan={ogExpanded ? 4 : 1}
                onClick={() => toggleGroup("outgoings")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:shrink-0">
                  {ogExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>outgoings</span>
                </span>
              </th>
              <th className="h-11 box-border pb-2 pl-6 pr-3 text-center align-bottom text-[10.5px] font-medium tracking-[0.14em] uppercase relative before:content-[''] before:absolute before:top-0 before:left-2 before:right-2 before:h-[2.5px] before:rounded-b-sm before:bg-current text-accent cf-zone">
                cashflow
              </th>
            </tr>
            {(incExpanded || ogExpanded) && (
            <tr className="h-14 border-b border-white/[0.10]" style={{ background: "var(--color-surface-raised)" }}>
              <th className="h-14 box-border align-middle text-[12px] font-normal tracking-[0.02em] capitalize text-subtle whitespace-nowrap w-[100px] pl-[18px] text-left" />
              {/* Income detail columns */}
              {incExpanded && <th className="h-14 box-border align-middle px-3 text-[12px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Salary">salary</th>}
              {incExpanded && <th className="h-14 box-border align-middle px-3 text-[12px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Salary Growth">gain %</th>}
              {incExpanded && isInvestment && <th className="h-14 box-border align-middle px-3 text-[12px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Annual Rental Income">rent</th>}
              {incExpanded && isInvestment && <th className="h-14 box-border align-middle px-3 text-[12px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Year-on-Year Rent Growth">gain %</th>}
              <th className="h-14 box-border align-middle px-3 text-[12px] tracking-[0.02em] capitalize text-white/85 font-semibold text-right whitespace-nowrap relative cursor-default after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Salary + Rent">total</th>
              {/* Outgoings detail columns */}
              {ogExpanded && <th className="h-14 box-border align-middle pl-6 pr-3 text-[12px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default out-zone after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>}
              {ogExpanded && <th className="h-14 box-border align-middle px-3 text-[12px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default out-zone after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Interest + Principal">repay</th>}
              {ogExpanded && <th className="h-14 box-border align-middle px-3 text-[12px] font-normal tracking-[0.02em] capitalize text-subtle text-right whitespace-nowrap relative cursor-default out-zone after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100 animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" data-tip="Income Tax (incl. Medicare Levy)">tax</th>}
              <th className={`h-14 box-border align-middle ${!ogExpanded ? "pl-6 pr-3" : "px-3"} text-[12px] tracking-[0.02em] capitalize text-white/85 font-semibold text-right whitespace-nowrap relative cursor-default out-zone after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100`} data-tip="Holding + Repayments + Tax">total</th>
              {/* Cashflow result */}
              <th className="h-14 box-border align-middle pl-6 pr-5 text-[12px] tracking-[0.02em] capitalize text-white/85 font-semibold text-right whitespace-nowrap relative cursor-default cf-zone after:content-[attr(data-tip)] after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:-translate-x-1/2 after:py-[5px] after:px-[10px] after:rounded-md after:bg-zinc-900/95 after:border after:border-zinc-500/15 after:text-zinc-100/85 after:text-[11px] after:font-normal after:tracking-normal after:normal-case after:whitespace-nowrap after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-150 after:ease-in-out after:z-10 hover:after:opacity-100" data-tip="Total Income − Total Costs">net</th>
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

              const prevIncome = i > 0 ? yearData[i - 1].salary + (isInvestment ? yearData[i - 1].rentalIncome : 0) : totalIncome;
              const prevCosts = i > 0 ? yearData[i - 1].ongoingCosts + yearData[i - 1].loanRepayment + yearData[i - 1].incomeTaxCalc : totalCosts;
              const incomeYoY = yoyPct(totalIncome, prevIncome);
              const costsYoY = yoyPct(totalCosts, prevCosts);

              const isCollapsed = !incExpanded && !ogExpanded;

              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border align-middle border-b border-b-white/[0.04] w-[100px] pl-[18px] text-left">{formatYearCell(y.year, i, isMilestone)}</td>
                  {/* Income detail cells */}
                  {incExpanded && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.04] text-foreground animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.salary))}</td>}
                  {incExpanded && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.04] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(salaryGain) > 0 ? "var(--color-positive)" : "var(--color-faint)", opacity: parseFloat(salaryGain) > 0 ? 0.8 : 1 }}>{salaryGain}%</td>}
                  {incExpanded && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.04] text-foreground animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]">{formatDollarsSigned(Math.round(y.rentalIncome))}</td>}
                  {incExpanded && isInvestment && <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.04] animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)]" style={{ color: parseFloat(rentGain) > 0 ? "var(--color-positive)" : "var(--color-faint)", opacity: parseFloat(rentGain) > 0 ? 0.8 : 1 }}>{rentGain}%</td>}
                  {/* Income total */}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.04] ${isCollapsed ? "text-[15px] px-4" : ""}`}>
                    <span className="font-semibold" style={{ color: "var(--color-foreground)" }}>{formatDollarsSigned(Math.round(totalIncome))}</span>
                    {isCollapsed && (
                      <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(incomeYoY)}`}>{fmtYoY(incomeYoY)}</span>
                    )}
                  </td>
                  {/* Outgoings detail cells */}
                  {ogExpanded && <td className={`h-[52px] box-border pl-6 pr-3 text-right align-middle border-b border-b-white/[0.04] out-zone animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.ongoingCosts, false, true)}`}>{formatDollarsSigned(Math.round(-y.ongoingCosts))}</td>}
                  {ogExpanded && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.04] out-zone animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.loanRepayment, false, true)}`}>{formatDollarsSigned(Math.round(-y.loanRepayment))}</td>}
                  {ogExpanded && <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.04] out-zone animate-[col-fade-in_0.25s_cubic-bezier(0.16,1,0.3,1)] ${getValueClass(-y.incomeTaxCalc, false, true)}`}>{formatDollarsSigned(Math.round(-y.incomeTaxCalc))}</td>}
                  {/* Outgoings total */}
                  <td className={`h-[52px] box-border ${!ogExpanded ? "pl-6 pr-3" : "px-3"} text-right align-middle border-b border-b-white/[0.04] out-zone ${isCollapsed ? "text-[15px]" : ""}`}>
                    <span className="font-semibold" style={{ color: "var(--color-negative)" }}>{formatDollarsSigned(Math.round(-totalCosts))}</span>
                    {isCollapsed && (
                      <span className={`inline-block ml-2 py-0.5 rounded text-[10px] font-medium tracking-[0.01em] align-middle tabular-nums w-[52px] text-center ${yoyClass(costsYoY, "negative")}`}>{fmtYoY(costsYoY)}</span>
                    )}
                  </td>
                  {/* Cashflow result */}
                  <td className={`h-[52px] box-border pl-6 pr-5 text-right align-middle border-b border-b-white/[0.04] cf-zone ${isCollapsed ? "text-[15px] font-bold tracking-tight" : "text-[13px]"} ${annualCashflow >= 0 ? "text-positive font-bold" : "text-negative font-bold"}`}>
                    <span className="font-bold">{annualCashflow >= 0 ? "+" : ""}{formatDollarsSigned(Math.round(annualCashflow))}</span>
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
            {/* Summary row — fixed totals across all visible years */}
            <tr className="row-summary">
              <td className="box-border align-middle w-[100px] pl-[18px] text-left" style={{ borderTop: "1px solid rgba(45,212,191,0.30)" }}>
                <span className="text-[10.5px] tracking-[0.14em] uppercase text-subtle font-medium">{yearData.length}-yr total</span>
              </td>
              {incExpanded && (
                <td className="box-border px-3 text-right align-middle text-foreground font-medium text-[15px]" style={{ borderTop: "1px solid rgba(45,212,191,0.30)" }}>
                  {formatDollarsSigned(Math.round(totals.salary))}
                </td>
              )}
              {incExpanded && (
                <td className="box-border px-3 text-right align-middle text-faint text-[15px]" style={{ borderTop: "1px solid rgba(45,212,191,0.30)" }}>—</td>
              )}
              {incExpanded && isInvestment && (
                <td className="box-border px-3 text-right align-middle text-foreground font-medium text-[15px]" style={{ borderTop: "1px solid rgba(45,212,191,0.30)" }}>
                  {formatDollarsSigned(Math.round(totals.rent))}
                </td>
              )}
              {incExpanded && isInvestment && (
                <td className="box-border px-3 text-right align-middle text-faint text-[15px]" style={{ borderTop: "1px solid rgba(45,212,191,0.30)" }}>—</td>
              )}
              <td className={`box-border ${!incExpanded && !ogExpanded ? "px-4" : "px-3"} text-right align-middle text-[15px]`} style={{ borderTop: "1px solid rgba(45,212,191,0.30)" }}>
                <span className="font-semibold text-foreground">{formatDollarsSigned(Math.round(totals.income))}</span>
                {!incExpanded && !ogExpanded && <span className="inline-block ml-2 w-[52px]" aria-hidden="true" />}
              </td>
              {ogExpanded && (
                <td className="box-border pl-6 pr-3 text-right align-middle text-negative font-medium out-zone text-[15px]" style={{ borderTop: "1px solid rgba(45,212,191,0.30)" }}>
                  {formatDollarsSigned(Math.round(-totals.holding))}
                </td>
              )}
              {ogExpanded && (
                <td className="box-border px-3 text-right align-middle text-negative font-medium out-zone text-[15px]" style={{ borderTop: "1px solid rgba(45,212,191,0.30)" }}>
                  {formatDollarsSigned(Math.round(-totals.repay))}
                </td>
              )}
              {ogExpanded && (
                <td className="box-border px-3 text-right align-middle text-negative font-medium out-zone text-[15px]" style={{ borderTop: "1px solid rgba(45,212,191,0.30)" }}>
                  {formatDollarsSigned(Math.round(-totals.tax))}
                </td>
              )}
              <td className={`box-border ${!ogExpanded ? "pl-6 pr-3" : "px-3"} text-right align-middle out-zone text-[15px]`} style={{ borderTop: "1px solid rgba(45,212,191,0.30)" }}>
                <span className="font-semibold text-negative">{formatDollarsSigned(Math.round(-totals.costs))}</span>
                {!incExpanded && !ogExpanded && <span className="inline-block ml-2 w-[52px]" aria-hidden="true" />}
              </td>
              <td className="box-border pl-6 pr-5 text-right align-middle text-[15px] cf-zone" style={{ borderTop: "1px solid rgba(45,212,191,0.30)" }}>
                <span className="font-bold text-positive">{formatDollarsSigned(Math.round(totalCashflow))}</span>
                {!incExpanded && !ogExpanded && <span className="inline-block ml-2 w-[52px]" aria-hidden="true" />}
              </td>
            </tr>
          </tbody>
        </table>
        );
      })()}
    </>
  );
}
