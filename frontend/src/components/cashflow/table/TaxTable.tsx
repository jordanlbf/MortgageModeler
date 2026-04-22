"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDollarsSigned } from "@/lib/formatters";
import TableCell from "@/components/ui/TableCell";
import { getMarginalTaxRate, getBracketColor } from "@/lib/cashflow-calculations";
import { yoyPct, getValueClass } from "./helpers";
import DeltaPill from "@/components/ui/DeltaPill";
import type { SubTableProps } from "./types";

interface Props extends SubTableProps {
  panel: "deductions" | "tax" | "unified";
}

export default function TaxTable({
  yearData,
  panel,
  isGroupExpanded,
  toggleGroup,
  isRowVisible,
  isMilestoneYear,
  formatYearCell,
  getRowClass,
  getRowHandlers,
}: Props) {
  return (
    <>
      {panel === "deductions" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th className="h-7 box-border px-3 text-center align-bottom" colSpan={2} />
              <th
                className="col-group-h col-group-h--clickable px-3 text-fg-tertiary"
                colSpan={isGroupExpanded("deductions") ? 4 : 1}
                onClick={() => toggleGroup("deductions")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("deductions") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>deductions</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-strong">
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap w-24 text-left px-2.5" /><th className="w-0 max-w-0 p-0 border-l border-default" />
              {isGroupExpanded("deductions") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>}
              {isGroupExpanded("deductions") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Loan Interest Paid">interest</th>}
              {isGroupExpanded("deductions") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Div 43 + Div 40 Depreciation">depr.</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold pr-5 text-right whitespace-nowrap tip" data-tip="Total Deductible Expenses">total ded.</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const depreciation = y.depDiv43 + y.depDiv40;
              const totalDeductions = y.ongoingCosts + y.interestPortion + depreciation;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-left px-2.5">{formatYearCell(y.year, i, isMilestone)}</td><td className="w-0 max-w-0 p-0 border-l border-l-white/[0.1] border-b border-b-white/[0.07]" />
                  {isGroupExpanded("deductions") && <TableCell>{formatDollarsSigned(Math.round(y.ongoingCosts))}</TableCell>}
                  {isGroupExpanded("deductions") && <TableCell>{formatDollarsSigned(Math.round(y.interestPortion))}</TableCell>}
                  {isGroupExpanded("deductions") && <TableCell>{formatDollarsSigned(Math.round(depreciation))}</TableCell>}
                  <TableCell animated={false} tone="emphasis" className="pr-5 text-sm" style={{ fontWeight: 700 }}>
                    {formatDollarsSigned(Math.round(totalDeductions))}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* TAX — Tax panel (collapsible columns) */}
      {panel === "tax" && (
        <table className="border-collapse tabular-nums text-xs leading-[1.4] whitespace-nowrap w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0">
              <th
                className="col-group-h col-group-h--clickable px-3 text-fg-tertiary"
                colSpan={isGroupExpanded("tax") ? 6 : 1}
                onClick={() => toggleGroup("tax")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {isGroupExpanded("tax") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>tax</span>
                </span>
              </th>
            </tr>
            <tr className="h-14 border-b border-strong">
              {isGroupExpanded("tax") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Salary + Rental Income">total income</th>}
              {isGroupExpanded("tax") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Total Deductible Expenses">deductions</th>}
              {isGroupExpanded("tax") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Tax Saved From Property Deductions">benefit</th>}
              {isGroupExpanded("tax") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Income After Deductions">taxable inc.</th>}
              {isGroupExpanded("tax") && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-tertiary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Marginal Tax Rate Band">bracket</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold pr-5 text-right whitespace-nowrap tip" data-tip="Income Tax (incl. Medicare Levy)">total tax</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const totalIncome = y.salary + y.rentalIncome;
              const depreciation = y.depDiv43 + y.depDiv40;
              const totalDeductions = y.ongoingCosts + y.interestPortion + depreciation;
              const taxableIncome = y.grossIncome - y.totalDeductionsForTax;
              const bracket = getMarginalTaxRate(taxableIncome);
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  {isGroupExpanded("tax") && <TableCell>{formatDollarsSigned(Math.round(totalIncome))}</TableCell>}
                  {isGroupExpanded("tax") && <TableCell className={getValueClass(-totalDeductions, false, true)}>{formatDollarsSigned(Math.round(-totalDeductions))}</TableCell>}
                  {isGroupExpanded("tax") && <TableCell style={{ color: "var(--color-data-positive)" }}>
                    {y.taxSaved > 0 ? `(+${formatDollarsSigned(Math.round(y.taxSaved))})` : "—"}
                  </TableCell>}
                  {isGroupExpanded("tax") && <TableCell>{formatDollarsSigned(Math.round(taxableIncome))}</TableCell>}
                  {isGroupExpanded("tax") && <TableCell style={{ color: getBracketColor(bracket) }}>{(bracket * 100).toFixed(bracket % 0.01 === 0 ? 0 : 1)}%</TableCell>}
                  <TableCell animated={false} className="pr-5 text-sm" style={{ fontWeight: 700, color: "var(--color-data-negative)" }}>
                    {formatDollarsSigned(Math.round(-y.incomeTaxCalc))}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* TAX — Unified (Deductions + Tax in one table) */}
      {panel === "unified" && (() => {
        const dedExpanded = isGroupExpanded("deductions");
        const taxExpanded = isGroupExpanded("tax");
        const totals = yearData.reduce((acc, y) => {
          const depr = y.depDiv43 + y.depDiv40;
          const totalDed = y.ongoingCosts + y.interestPortion + depr;
          return {
            holding: acc.holding + y.ongoingCosts,
            interest: acc.interest + y.interestPortion,
            depr: acc.depr + depr,
            totalDed: acc.totalDed + totalDed,
            income: acc.income + (y.salary + y.rentalIncome),
            benefit: acc.benefit + y.taxSaved,
            tax: acc.tax + y.incomeTaxCalc,
          };
        }, { holding: 0, interest: 0, depr: 0, totalDed: 0, income: 0, benefit: 0, tax: 0 });
        const summaryBorder = { borderTop: "1px solid rgba(45,212,191,0.30)" } as const;

        return (
        <table className="border-collapse tabular-nums text-[13px] leading-[1.4] whitespace-nowrap w-full min-w-full table-auto">
          <thead>
            <tr className="h-7 border-b-0" style={{ background: "var(--color-surface-raised)" }}>
              <th className="h-7 box-border px-3 text-center align-bottom" />
              <th
                className="col-group-h col-group-h--clickable px-3 text-fg-secondary"
                colSpan={dedExpanded ? 4 : 1}
                onClick={() => toggleGroup("deductions")}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {dedExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>deductions</span>
                </span>
              </th>
              <th
                className="col-group-h col-group-h--clickable pl-6 pr-3 text-fg-secondary"
                colSpan={taxExpanded ? 6 : 1}
                onClick={() => toggleGroup("tax")}
                style={{ background: "var(--color-out-tint-raised)" }}
              >
                <span className="inline-flex items-center gap-1.5 [&_svg]:opacity-50 [&_svg]:transition-[opacity,transform] [&_svg]:duration-150 [&_svg]:shrink-0">
                  {taxExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>tax</span>
                </span>
              </th>
            </tr>
            {(dedExpanded || taxExpanded) && (
            <tr className="h-14 border-b border-default" style={{ background: "var(--color-surface-raised)" }}>
              <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap w-24 text-left px-2.5" />
              {/* Deductions detail columns */}
              {dedExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Ongoing Holding Costs">holding</th>}
              {dedExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Loan Interest Paid">interest</th>}
              {dedExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" data-tip="Div 43 + Div 40">depr.</th>}
              <th className="h-14 box-border align-middle px-3 text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold text-right whitespace-nowrap tip" data-tip="Total Deductible Expenses">total ded.</th>
              {/* Tax detail columns */}
              {taxExpanded && <th className="h-14 box-border align-middle pl-6 pr-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" style={{ background: "var(--color-out-tint-raised)" }} data-tip="Salary + Rent">income</th>}
              {taxExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" style={{ background: "var(--color-out-tint-raised)" }} data-tip="Total Deductions">ded.</th>}
              {taxExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" style={{ background: "var(--color-out-tint-raised)" }} data-tip="Tax Benefit From Deductions">benefit</th>}
              {taxExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" style={{ background: "var(--color-out-tint-raised)" }} data-tip="Income After Deductions">taxable</th>}
              {taxExpanded && <th className="h-14 box-border align-middle px-3 text-[11px] font-normal tracking-[0.02em] capitalize text-fg-secondary text-right whitespace-nowrap tip animate-col-fade-in" style={{ background: "var(--color-out-tint-raised)" }} data-tip="Marginal Tax Rate">bracket</th>}
              <th className={`h-14 box-border align-middle ${!taxExpanded ? "pl-6 pr-5" : "px-3 pr-5"} text-[11px] tracking-[0.02em] capitalize text-fg-secondary font-bold text-right whitespace-nowrap tip`} style={{ background: "var(--color-out-tint-raised)" }} data-tip="Income Tax (incl. Medicare Levy)">total tax</th>
            </tr>
            )}
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const depreciation = y.depDiv43 + y.depDiv40;
              const totalDeductions = y.ongoingCosts + y.interestPortion + depreciation;
              const totalIncome = y.salary + y.rentalIncome;
              const taxableIncome = y.grossIncome - y.totalDeductionsForTax;
              const bracket = getMarginalTaxRate(taxableIncome);
              const isCollapsed = !dedExpanded && !taxExpanded;
              return (
                <tr key={y.year} className={`${getRowClass(y.year, isMilestone)} ${isCollapsed ? "h-14" : ""}`} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] w-24 text-left px-2.5">{formatYearCell(y.year, i, isMilestone)}</td>
                  {/* Deductions detail cells */}
                  {dedExpanded && <TableCell tone="emphasis">{formatDollarsSigned(Math.round(y.ongoingCosts))}</TableCell>}
                  {dedExpanded && <TableCell tone="emphasis">{formatDollarsSigned(Math.round(y.interestPortion))}</TableCell>}
                  {dedExpanded && <TableCell tone="emphasis">{formatDollarsSigned(Math.round(depreciation))}</TableCell>}
                  <td className={`h-[52px] box-border px-3 text-right align-middle border-b border-b-white/[0.07] ${isCollapsed ? "text-[15px] px-4" : ""}`}>
                    <span className="font-bold text-fg-primary">{formatDollarsSigned(Math.round(totalDeductions))}</span>
                    {isCollapsed && (() => {
                      const prevDed = i > 0 ? (() => { const py = yearData[i-1]; return py.ongoingCosts + py.interestPortion + py.depDiv43 + py.depDiv40; })() : totalDeductions;
                      const dedYoY = yoyPct(totalDeductions, prevDed);
                      return <DeltaPill value={dedYoY} direction="negative" />;
                    })()}
                  </td>
                  {/* Tax detail cells */}
                  {taxExpanded && <td className="h-[52px] box-border pl-6 pr-3 text-right align-middle border-b border-b-white/[0.07] out-zone text-fg-primary animate-col-fade-in">{formatDollarsSigned(Math.round(totalIncome))}</td>}
                  {taxExpanded && <TableCell className={`out-zone ${getValueClass(-totalDeductions, false, true)}`}>{formatDollarsSigned(Math.round(-totalDeductions))}</TableCell>}
                  {taxExpanded && <TableCell className="out-zone" style={{ color: "var(--color-data-positive)" }}>
                    {y.taxSaved > 0 ? `+${formatDollarsSigned(Math.round(y.taxSaved))}` : "—"}
                  </TableCell>}
                  {taxExpanded && <TableCell tone="emphasis" className="out-zone">{formatDollarsSigned(Math.round(taxableIncome))}</TableCell>}
                  {taxExpanded && <TableCell className="out-zone" style={{ color: getBracketColor(bracket) }}>{(bracket * 100).toFixed(bracket % 0.01 === 0 ? 0 : 1)}%</TableCell>}
                  <td className={`h-[52px] box-border ${!taxExpanded ? "pl-6 pr-5" : "px-3 pr-5"} text-right align-middle border-b border-b-white/[0.07] out-zone ${isCollapsed ? "text-[15px] font-bold tracking-tight" : "text-[13px]"}`}>
                    <span className="font-bold text-data-negative">{formatDollarsSigned(Math.round(-y.incomeTaxCalc))}</span>
                    {isCollapsed && (() => {
                      const prevTax = i > 0 ? yearData[i-1].incomeTaxCalc : y.incomeTaxCalc;
                      const taxYoY = yoyPct(y.incomeTaxCalc, prevTax);
                      return <DeltaPill value={taxYoY} direction="negative" />;
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
              {dedExpanded && (
                <td className="box-border px-3 text-right align-middle text-fg-primary font-medium text-[15px]" style={summaryBorder}>{formatDollarsSigned(Math.round(totals.holding))}</td>
              )}
              {dedExpanded && (
                <td className="box-border px-3 text-right align-middle text-fg-primary font-medium text-[15px]" style={summaryBorder}>{formatDollarsSigned(Math.round(totals.interest))}</td>
              )}
              {dedExpanded && (
                <td className="box-border px-3 text-right align-middle text-fg-primary font-medium text-[15px]" style={summaryBorder}>{formatDollarsSigned(Math.round(totals.depr))}</td>
              )}
              <td className="box-border px-3 text-right align-middle text-[15px]" style={summaryBorder}>
                <span className="font-semibold text-fg-primary">{formatDollarsSigned(Math.round(totals.totalDed))}</span>
              </td>
              {taxExpanded && (
                <td className="box-border pl-6 pr-3 text-right align-middle text-fg-primary font-medium text-[15px]" style={{ ...summaryBorder, background: "var(--color-out-tint-raised)" }}>{formatDollarsSigned(Math.round(totals.income))}</td>
              )}
              {taxExpanded && (
                <td className="box-border px-3 text-right align-middle text-data-negative opacity-85 font-medium text-[15px]" style={{ ...summaryBorder, background: "var(--color-out-tint-raised)" }}>{formatDollarsSigned(Math.round(-totals.totalDed))}</td>
              )}
              {taxExpanded && (
                <td className="box-border px-3 text-right align-middle text-data-positive font-medium text-[15px]" style={{ ...summaryBorder, background: "var(--color-out-tint-raised)" }}>{formatDollarsSigned(Math.round(totals.benefit))}</td>
              )}
              {taxExpanded && (
                <td className="box-border px-3 text-right align-middle text-fg-tertiary text-[15px]" style={{ ...summaryBorder, background: "var(--color-out-tint-raised)" }}>—</td>
              )}
              {taxExpanded && (
                <td className="box-border px-3 text-right align-middle text-fg-tertiary text-[15px]" style={{ ...summaryBorder, background: "var(--color-out-tint-raised)" }}>—</td>
              )}
              <td className={`box-border ${!taxExpanded ? "pl-6 pr-5" : "px-3 pr-5"} text-right align-middle text-[15px]`} style={{ ...summaryBorder, background: "var(--color-out-tint-raised)" }}>
                <span className="font-bold text-data-negative">{formatDollarsSigned(Math.round(-totals.tax))}</span>
              </td>
            </tr>
          </tbody>
        </table>
        );
      })()}
    </>
  );
}
