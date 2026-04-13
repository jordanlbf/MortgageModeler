"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { formatCurrencyCf, getMarginalTaxRate } from "@/lib/cashflow-calculations";

interface Props {
  yearData: YearData[];
  viewMode: ViewMode;
  selectedYear: number;
  hoveredYear: number | null;
  isInvestment: boolean;
  hasOffset: boolean;
  propertyValue: number;
  propertyPanel?: "gearing" | "cashflow";
  equityPanel?: "property" | "position";
  showExpandButton?: boolean;
  expandedMilestones?: Set<number>;
  onExpandedChange?: (expanded: Set<number>) => void;
  onSelectYear: (year: number) => void;
  onHoverYear: (year: number | null) => void;
}

export default function CashflowDataTable({
  yearData, viewMode, selectedYear, hoveredYear, isInvestment,
  hasOffset, propertyValue, propertyPanel, equityPanel, showExpandButton = true,
  expandedMilestones: externalExpanded, onExpandedChange,
  onSelectYear, onHoverYear,
}: Props) {
  const baseYear = new Date().getFullYear();
  const showOffset = hasOffset && yearData.some(y => y.offsetBalanceAtYear > 0);

  // Expansion state - use external if provided, otherwise local
  const [localExpanded, setLocalExpanded] = useState<Set<number>>(new Set());
  const expandedMilestones = externalExpanded ?? localExpanded;
  const setExpandedMilestones = onExpandedChange ?? setLocalExpanded;

  // Milestone years: 1, 6, 11, 16, 21, 26
  const isMilestoneYear = (year: number) => year === 1 || (year - 1) % 5 === 0;
  const getMilestoneForYear = (year: number) => {
    if (year === 1) return 1;
    return Math.floor((year - 1) / 5) * 5 + 1;
  };

  // Toggle expansion (manual)
  const toggleMilestone = (milestone: number) => {
    setExpandedMilestones(prev => {
      const next = new Set(prev);
      if (next.has(milestone)) next.delete(milestone);
      else next.add(milestone);
      return next;
    });
  };

  // Determine if a row should be visible - default to collapsed
  const isRowVisible = (year: number) => {
    if (isMilestoneYear(year)) return true;

    const milestone = getMilestoneForYear(year);

    // Only show if expanded
    if (expandedMilestones.has(milestone)) return true;

    return false;
  };

  // Get years that belong to a milestone group (years 2-5 after the milestone)
  const getGroupYears = (milestone: number) => {
    const endYear = milestone + 4;
    return yearData.filter(y => y.year > milestone && y.year <= endYear);
  };

  // Generate row handlers - no hover, only click
  const getRowHandlers = (year: number, isMilestone: boolean) => ({
    onClick: () => {
      if (isMilestone) {
        toggleMilestone(year);
      }
      onSelectYear(year);
    },
    onMouseEnter: () => onHoverYear(year),
    onMouseLeave: () => onHoverYear(null),
  });

  // Format year cell — circle badge + calendar year + expansion indicator
  const formatYearCell = (year: number, index: number, isMilestoneRow = false) => {
    const cal = baseYear + index;
    const isSelected = year === selectedYear;
    const isHovered = year === hoveredYear && !isSelected;
    const milestone = getMilestoneForYear(year);
    const isExpanded = expandedMilestones.has(milestone);
    const groupYears = getGroupYears(year);
    const hasGroupYears = groupYears.length > 0;

    const showChevron = isMilestoneRow && hasGroupYears;

    return (
      <span className="cft-year-cell cft-year-badge-wrap">
        {showChevron && (
          <span className="cft-expand-chevron">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}
        <span className={`cft-year-badge ${isSelected ? "cft-year-badge-selected" : isHovered ? "cft-year-badge-hovered" : ""}`}>
          {year}
        </span>
        <span className="cft-year-badge-cal">{cal}</span>
      </span>
    );
  };

  // Determine value styling tier: result (teal), outflow (muted red), or neutral
  const getValueClass = (value: number, isResult = false, isOutflow = false, isTaxSaved = false) => {
    if (isResult) return value < 0 ? "cft-val-negative" : "cft-val-result";
    if (isTaxSaved && value > 0) return "cft-val-result";
    if (isOutflow) return "cft-val-outflow";
    return "cft-val-neutral";
  };

  // LVR conditional styling
  const getLvrClass = (lvr: number) => {
    if (lvr > 80) return "cft-lvr-danger";
    if (lvr > 60) return "cft-lvr-moderate";
    return "cft-lvr-healthy";
  };

  // Row class helper for selected/hovered states
  const isSecondPanel = propertyPanel === "cashflow" || equityPanel === "position";

  const getRowClass = (year: number, isMilestoneRow = false) => {
    const isSelected = year === selectedYear;
    const isHovered = year === hoveredYear && !isSelected;
    const isExpandable = isMilestoneRow;
    const isChildRow = !isMilestoneRow && !isMilestoneYear(year);
    return `cft-row cft-sep-shadow ${isSelected ? "cft-row-active" : ""} ${isHovered ? "cft-row-hover" : ""} ${isExpandable ? "cft-row-expandable" : ""} ${isMilestoneRow ? "cft-row-milestone" : ""} ${isChildRow ? "cft-row-child" : ""}`;
  };

  return (
    <div className="cft-outer">
      {showExpandButton && (
        <button
          className="cft-expand-all-btn"
          onClick={() => {
            if (expandedMilestones.size > 0) {
              setExpandedMilestones(new Set());
            } else {
              setExpandedMilestones(new Set([1, 6, 11, 16, 21, 26]));
            }
          }}
          title={expandedMilestones.size > 0 ? "Collapse all" : "Expand all"}
        >
          {expandedMilestones.size > 0 ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
      )}
    <div className="cft-wrap">
      {/* SUMMARY TABLE */}
      {viewMode === "summary" && (
        <table className="cft-table cft-table-wide">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th className="cft-group-cell cft-group-label cft-group-income" colSpan={isInvestment ? 5 : 3}>income</th>
              <th className="cft-group-divider" />
              <th className="cft-group-cell cft-group-label cft-group-costs" colSpan={4}>outgoings</th>
              <th className="cft-group-divider" />
              <th className="cft-group-cell cft-group-label cft-group-net" />
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              <th className="cft-th cft-tip" data-tip="Annual Salary (grows with capital growth rate)">salary</th>
              <th className="cft-th cft-tip" data-tip="Year-on-Year Salary Growth">gain %</th>
              {isInvestment && <th className="cft-th cft-tip" data-tip="Annual Rental Income (grows with capital growth rate)">rent</th>}
              {isInvestment && <th className="cft-th cft-tip" data-tip="Year-on-Year Rent Growth">gain %</th>}
              <th className="cft-th cft-th-agg cft-tip" data-tip="Salary + Rent">total income</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-tip" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>
              <th className="cft-th cft-tip" data-tip="Interest + Principal">repayments</th>
              <th className="cft-th cft-tip" data-tip="Income Tax (incl. Medicare Levy)">tax</th>
              <th className="cft-th cft-th-agg cft-tip" data-tip="Holding + Repayments + Tax">total costs</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-th-result cft-tip" data-tip="Total Income − Total Costs">annual cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const prevSalary = i > 0 ? yearData[i - 1].salary : y.salary;
              const prevRent = i > 0 ? yearData[i - 1].rentalIncome : y.rentalIncome;
              const salaryGain = prevSalary > 0 ? ((y.salary / prevSalary - 1) * 100).toFixed(1) : "0.0";
              const rentGain = prevRent > 0 ? ((y.rentalIncome / prevRent - 1) * 100).toFixed(1) : "0.0";
              const totalIncome = y.salary + (isInvestment ? y.rentalIncome : 0);
              const totalCosts = y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc;
              const annualCashflow = totalIncome - totalCosts;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.salary))}</td>
                  <td className="cft-td" style={{ color: parseFloat(salaryGain) > 0 ? "var(--cf-positive)" : "var(--cf-text-dim)" }}>{salaryGain}%</td>
                  {isInvestment && <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  {isInvestment && <td className="cft-td" style={{ color: parseFloat(rentGain) > 0 ? "var(--cf-positive)" : "var(--cf-text-dim)" }}>{rentGain}%</td>}
                  <td className="cft-td cft-val-neutral">{formatCurrencyCf(Math.round(totalIncome))}</td>
                  <td className="cft-td-divider" />
                  <td className={`cft-td ${getValueClass(-y.ongoingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-y.ongoingCosts))}</td>
                  <td className={`cft-td ${getValueClass(-y.loanRepayment, false, true)}`}>{formatCurrencyCf(Math.round(-y.loanRepayment))}</td>
                  <td className={`cft-td ${getValueClass(-y.incomeTaxCalc, false, true)}`}>{formatCurrencyCf(Math.round(-y.incomeTaxCalc))}</td>
                  <td className={`cft-td ${getValueClass(-totalCosts, true)}`}>{formatCurrencyCf(Math.round(-totalCosts))}</td>
                  <td className="cft-td-divider" />
                  <td className={`cft-td cft-td-result ${annualCashflow >= 0 ? "cft-val-positive" : "cft-val-negative"}`}>
                    {formatCurrencyCf(Math.round(annualCashflow))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* TAX TABLE — standalone view */}
      {viewMode === "tax" && (
        <table className="cft-table cft-table-wide">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th className="cft-group-cell cft-group-label cft-group-tax" colSpan={5}>tax</th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              <th className="cft-th cft-tip" data-tip="Taxable Income">taxable inc.</th>
              <th className="cft-th cft-tip" data-tip="Marginal Tax Rate Band">bracket</th>
              <th className="cft-th cft-tip" data-tip="Income Tax (incl. Medicare Levy)">income tax</th>
              <th className="cft-th cft-tip" data-tip="Tax Without Property Deductions">tax w/o prop.</th>
              <th className="cft-th cft-th-result cft-tip" data-tip="Difference Between Tax With and Without Property">tax saved</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const taxableIncome = y.grossIncome - y.totalDeductionsForTax;
              const bracket = getMarginalTaxRate(taxableIncome);
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(taxableIncome))}</td>
                  <td className="cft-td cft-val-dim">{(bracket * 100).toFixed(bracket % 0.01 === 0 ? 0 : 1)}%</td>
                  <td className={`cft-td ${getValueClass(-y.incomeTaxCalc, false, true)}`}>{formatCurrencyCf(Math.round(-y.incomeTaxCalc))}</td>
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(-y.incomeTaxWithout))}</td>
                  <td className={`cft-td cft-td-result ${getValueClass(y.taxSaved, true)}`}>
                    {y.taxSaved > 0 ? "+" : ""}{formatCurrencyCf(Math.round(y.taxSaved))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}


      {/* PROPERTY TABLE — Gearing panel */}
      {viewMode === "property" && isInvestment && propertyPanel === "gearing" && (
        <table className="cft-table cft-table-narrow">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th className="cft-group-cell cft-group-label cft-group-tax" colSpan={4}>gearing</th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              <th className="cft-th cft-tip" data-tip="Annual Rental Income">rent</th>
              <th className="cft-th cft-tip" data-tip="Interest + Ongoing Costs">holding</th>
              <th className="cft-th cft-tip" data-tip="Div 43 + Div 40 Depreciation">depreciation</th>
              <th className="cft-th cft-th-result cft-tip" data-tip="Rent − Holding − Depreciation (negative = negatively geared)">net gearing</th>
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
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>
                  <td className={`cft-td ${getValueClass(-holdingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-holdingCosts))}</td>
                  <td className={`cft-td ${getValueClass(-depreciation, false, true)}`}>{formatCurrencyCf(Math.round(-depreciation))}</td>
                  <td className={`cft-td cft-td-result ${netGearing >= 0 ? "cft-val-positive" : "cft-val-negative"}`}>{formatCurrencyCf(Math.round(netGearing))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — Cashflow panel */}
      {viewMode === "property" && isInvestment && propertyPanel === "cashflow" && (
        <table className="cft-table cft-table-narrow">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell cft-group-label cft-group-net" colSpan={4}>cashflow</th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-tip" data-tip="Annual Rental Income">rent</th>
              <th className="cft-th cft-th-agg cft-tip" data-tip="Holding + Repayments">total costs</th>
              <th className="cft-th cft-tip" data-tip="Tax Benefit From Property Deductions">tax saved</th>
              <th className="cft-th cft-th-result cft-tip" data-tip="Rent − Total Costs + Tax Saved">cashflow</th>
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
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>
                  <td className={`cft-td ${getValueClass(-totalCosts, false, true)}`}>{formatCurrencyCf(Math.round(-totalCosts))}</td>
                  <td className="cft-td" style={{ color: "var(--cf-positive)" }}>{y.taxSaved > 0 ? "+" : ""}{formatCurrencyCf(Math.round(y.taxSaved))}</td>
                  <td className={`cft-td cft-td-result ${y.propertyCashflow >= 0 ? "cft-val-positive" : "cft-val-negative"}`}>
                    {formatCurrencyCf(Math.round(y.propertyCashflow))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — PPOR */}
      {viewMode === "property" && !isInvestment && (
        <table className="cft-table cft-table-mid">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th className="cft-group-cell cft-group-label cft-group-costs" colSpan={2}>costs</th>
              <th className="cft-group-divider" />
              <th className="cft-group-cell cft-group-label cft-group-costs" colSpan={2}>loan</th>
              <th className="cft-group-divider" />
              <th className="cft-group-cell cft-group-label cft-group-net" />
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              <th className="cft-th cft-tip" data-tip="Council, Water, Insurance, Maintenance, Strata">holding</th>
              <th className="cft-th cft-tip" data-tip="Interest Portion of Loan Repayment">interest</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-tip" data-tip="Principal Portion of Loan Repayment">principal</th>
              <th className="cft-th cft-th-agg cft-tip" data-tip="Interest + Principal">repayments</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-th-result cft-tip" data-tip="Annual Property Cashflow">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  <td className={`cft-td ${getValueClass(-y.ongoingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-y.ongoingCosts))}</td>
                  <td className={`cft-td ${getValueClass(-y.interestPortion, false, true)}`}>{formatCurrencyCf(Math.round(-y.interestPortion))}</td>
                  <td className="cft-td-divider" />
                  <td className={`cft-td ${getValueClass(-y.principalPortion, false, true)}`}>{formatCurrencyCf(Math.round(-y.principalPortion))}</td>
                  <td className="cft-td cft-val-neutral">{formatCurrencyCf(Math.round(-(y.interestPortion + y.principalPortion)))}</td>
                  <td className="cft-td-divider" />
                  <td className={`cft-td cft-td-result ${getValueClass(y.propertyCashflow, true)}`}>
                    {formatCurrencyCf(Math.round(y.propertyCashflow))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* EQUITY — Property panel */}
      {viewMode === "equity" && equityPanel === "property" && (
        <table className="cft-table cft-table-mid">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th className="cft-group-cell cft-group-label cft-group-income" colSpan={9}>property</th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              <th className="cft-th cft-tip" data-tip="Cumulative Capital Growth From Purchase">total growth</th>
              <th className="cft-th cft-tip" data-tip="Total Growth as % of Purchase Price">gain %</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-tip" data-tip="Year-on-Year Capital Growth">yoy growth</th>
              <th className="cft-th cft-tip" data-tip="Year-on-Year Growth %">yoy %</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-th-result cft-tip" data-tip="Current Property Value">value</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const prevValue = i > 0 ? yearData[i - 1].propertyValue : propertyValue;
              const totalGrowth = y.propertyValue - propertyValue;
              const totalGrowthPct = ((y.propertyValue / propertyValue - 1) * 100).toFixed(1);
              const yoyGrowth = y.propertyValue - prevValue;
              const yoyGrowthPct = i > 0
                ? ((y.propertyValue / prevValue - 1) * 100).toFixed(1)
                : totalGrowthPct;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  <td className="cft-td cft-val-dim">+{formatCurrencyCf(Math.round(totalGrowth))}</td>
                  <td className="cft-td" style={{ color: parseFloat(totalGrowthPct) >= 0 ? "var(--cf-positive)" : "var(--cf-negative)" }}>{totalGrowthPct}%</td>
                  <td className="cft-td-divider" />
                  <td className="cft-td cft-val-dim">+{formatCurrencyCf(Math.round(yoyGrowth))}</td>
                  <td className="cft-td" style={{ color: parseFloat(yoyGrowthPct) >= 0 ? "var(--cf-positive)" : "var(--cf-negative)" }}>{yoyGrowthPct}%</td>
                  <td className="cft-td-divider" />
                  <td className="cft-td cft-td-result" style={{ fontWeight: 700, color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(y.propertyValue))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* EQUITY — Position panel */}
      {viewMode === "equity" && equityPanel === "position" && (
        <table className="cft-table cft-table-mid">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell cft-group-label cft-group-position" colSpan={showOffset ? 7 : 6}>position</th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-tip" data-tip="Current Property Value">prop value</th>
              <th className="cft-th cft-tip" data-tip="Outstanding Loan Balance">loan balance</th>
              <th className="cft-th cft-th-agg cft-tip" data-tip="Property Value − Loan Balance">prop equity</th>
              <th className="cft-th cft-th-agg cft-tip" data-tip="Loan-to-Value Ratio">lvr</th>
              <th className="cft-th-divider" />
              {showOffset && <th className="cft-th cft-tip" data-tip="Offset Account Balance">offset</th>}
              <th className="cft-th cft-th-result cft-tip" data-tip="Property Equity + Offset Balance">net equity</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const lvr = y.loanBalance / y.propertyValue * 100;
              const propertyEquity = y.propertyValue - y.loanBalance;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.propertyValue))}</td>
                  <td className={`cft-td ${getValueClass(-y.loanBalance, false, true)}`}>{formatCurrencyCf(Math.round(-y.loanBalance))}</td>
                  <td className="cft-td" style={{ fontWeight: 700, color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(propertyEquity))}</td>
                  <td className={`cft-td ${getLvrClass(lvr)}`} style={{ fontWeight: 700 }}>{lvr.toFixed(1)}%</td>
                  <td className="cft-td-divider" />
                  {showOffset && <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.offsetBalanceAtYear))}</td>}
                  <td className="cft-td cft-td-result" style={{ fontWeight: 700, color: "var(--cf-text)" }}>
                    {formatCurrencyCf(Math.round(y.netEquity))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* DEDUCTIONS TABLE */}
      {viewMode === "deductions" && (
        <table className="cft-table cft-table-wide">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th className="cft-group-cell cft-group-label cft-group-tax" colSpan={isInvestment ? 5 : 4}>holding costs</th>
              {isInvestment && (
                <>
                  <th className="cft-group-divider" />
                  <th className="cft-group-cell cft-group-label cft-group-depreciation" colSpan={3}>depreciation</th>
                </>
              )}
              <th className="cft-group-divider" />
              <th className="cft-group-cell cft-group-label cft-group-net" />
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              {isInvestment && <th className="cft-th cft-tip" data-tip="Loan Interest Paid">interest</th>}
              <th className="cft-th cft-tip" data-tip="Council + Water Rates">rates</th>
              <th className="cft-th cft-tip" data-tip="Building & Landlord Insurance">insurance</th>
              <th className="cft-th cft-tip" data-tip="Maintenance & Repairs">maint.</th>
              <th className="cft-th cft-th-agg cft-tip" data-tip="Holding Costs Subtotal">subtotal</th>
              {isInvestment && (
                <>
                  <th className="cft-th-divider" />
                  <th className="cft-th cft-tip" data-tip="Division 43 — Capital Works Deduction">div 43</th>
                  <th className="cft-th cft-tip" data-tip="Division 40 — Plant & Equipment Depreciation">div 40</th>
                  <th className="cft-th cft-th-agg cft-tip" data-tip="Depreciation Subtotal">subtotal</th>
                </>
              )}
              <th className="cft-th-divider" />
              <th className="cft-th cft-th-result cft-tip" data-tip={isInvestment ? "Total Deductions" : "Total Expenses"}>{isInvestment ? "total ded." : "total exp."}</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              if (!isRowVisible(y.year)) return null;
              const isMilestone = isMilestoneYear(y.year);
              const holdingTotal = isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts;
              const depTotal = y.depDiv43 + y.depDiv40;
              const grandTotal = isInvestment ? holdingTotal + depTotal : holdingTotal;
              return (
                <tr key={y.year} className={getRowClass(y.year, isMilestone)} {...getRowHandlers(y.year, isMilestone)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i, isMilestone)}</td><td className="cft-td-divider" />
                  {isInvestment && <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.interestPortion))}</td>}
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.councilRates + y.waterRates))}</td>
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.insurance))}</td>
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.maintenance + y.strataFees))}</td>
                  <td className="cft-td cft-val-neutral">{formatCurrencyCf(Math.round(holdingTotal))}</td>
                  {isInvestment && (
                    <>
                      <td className="cft-td-divider" />
                      <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.depDiv43))}</td>
                      <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.depDiv40))}</td>
                      <td className="cft-td cft-val-neutral">{formatCurrencyCf(Math.round(depTotal))}</td>
                    </>
                  )}
                  <td className="cft-td-divider" />
                  <td className="cft-td cft-td-result" style={{ fontWeight: 700, color: "var(--cf-text)" }}>
                    {formatCurrencyCf(Math.round(grandTotal))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
    </div>
  );
}
