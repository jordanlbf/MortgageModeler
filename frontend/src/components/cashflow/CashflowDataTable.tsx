"use client";

import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { formatCurrencyCf } from "@/lib/cashflow-calculations";

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
  onSelectYear: (year: number) => void;
  onHoverYear: (year: number | null) => void;
}

export default function CashflowDataTable({
  yearData, viewMode, selectedYear, hoveredYear, isInvestment,
  hasOffset, propertyValue, propertyPanel, equityPanel, onSelectYear, onHoverYear,
}: Props) {
  const baseYear = new Date().getFullYear();
  const showOffset = hasOffset && yearData.some(y => y.offsetBalanceAtYear > 0);

  // Format year cell — locked to variant B: "Yr N · YYYY" with monospace alignment
  const formatYearCell = (year: number, index: number) => {
    const cal = baseYear + index;
    return (
      <span className="cft-year-cell cft-year-b">
        <span className="cft-year-b-yr">Year {year}</span>
        <span className="cft-year-b-dot">·</span>
        <span className="cft-year-b-cal">{cal}</span>
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

  const getRowClass = (year: number) => {
    const isSelected = year === selectedYear;
    const isHovered = year === hoveredYear && year !== selectedYear;
    return `cft-row ${isSelected ? "cft-row-active" : ""} ${isHovered ? "cft-row-hover" : ""}`;
  };

  return (
    <div className="cft-outer">
    <div className="cft-wrap">
      {/* SUMMARY TABLE */}
      {viewMode === "summary" && (
        <table className="cft-table">
          <thead>
            {/* Group headers */}
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th className="cft-group-cell cft-group-label cft-group-income" colSpan={isInvestment ? 4 : 3}>income</th>
              <th className="cft-group-divider" />
              <th className="cft-group-cell cft-group-label cft-group-tax" colSpan={1}>tax</th>
              <th className="cft-group-divider" />
              <th className="cft-group-cell cft-group-label cft-group-costs" colSpan={3}>costs</th>
              <th className="cft-group-divider" />
              <th className="cft-group-cell cft-group-label cft-group-net" />
            </tr>
            {/* Column headers */}
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              <th className="cft-th">salary</th>
              {isInvestment && <th className="cft-th">rent</th>}
              <th className="cft-th">prop. ded.</th>
              <th className="cft-th cft-th-agg">taxable inc.</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-th-agg">tax payable</th>
              <th className="cft-th-divider" />
              <th className="cft-th">holding</th>
              <th className="cft-th">principal</th>
              <th className="cft-th cft-th-agg">total costs</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-th-result">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              const holdingCosts = y.interestPortion + y.ongoingCosts;
              const taxableIncome = y.grossIncome - y.totalDeductionsForTax;
              const totalCosts = holdingCosts + y.principalPortion;
              return (
                <tr key={y.year} className={getRowClass(y.year)}
                  onClick={() => onSelectYear(y.year)}
                  onMouseEnter={() => onHoverYear(y.year)}
                  onMouseLeave={() => onHoverYear(null)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i)}</td><td className="cft-td-divider" />
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.salary))}</td>
                  {isInvestment && <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  <td className={`cft-td ${getValueClass(-y.totalDeductionsForTax, false, true)}`}>{formatCurrencyCf(Math.round(-y.totalDeductionsForTax))}</td>
                  <td className="cft-td cft-val-neutral">{formatCurrencyCf(Math.round(taxableIncome))}</td>
                  <td className="cft-td-divider" />
                  <td className={`cft-td ${getValueClass(-y.incomeTaxCalc, true)}`}>{formatCurrencyCf(Math.round(-y.incomeTaxCalc))}</td>
                  <td className="cft-td-divider" />
                  <td className={`cft-td ${getValueClass(-holdingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-holdingCosts))}</td>
                  <td className={`cft-td ${getValueClass(-y.principalPortion, false, true)}`}>{formatCurrencyCf(Math.round(-y.principalPortion))}</td>
                  <td className={`cft-td ${getValueClass(-totalCosts, true)}`}>{formatCurrencyCf(Math.round(-totalCosts))}</td>
                  <td className="cft-td-divider" />
                  <td className={`cft-td cft-td-result ${getValueClass(y.netCashflow, true)}`}>
                    {formatCurrencyCf(Math.round(y.netCashflow))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — Gearing panel */}
      {viewMode === "property" && isInvestment && propertyPanel === "gearing" && (
        <table className="cft-table">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th className="cft-group-cell cft-group-label cft-group-tax" colSpan={5}>gearing</th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              <th className="cft-th">rent</th>
              <th className="cft-th">holding</th>
              <th className="cft-th cft-th-agg">net gearing</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-th-agg">tax saved</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              const holdingCosts = y.interestPortion + y.ongoingCosts;
              return (
                <tr key={y.year} className={getRowClass(y.year)}
                  onClick={() => onSelectYear(y.year)}
                  onMouseEnter={() => onHoverYear(y.year)}
                  onMouseLeave={() => onHoverYear(null)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i)}</td><td className="cft-td-divider" />
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>
                  <td className={`cft-td ${getValueClass(-holdingCosts, false, true)}`}>{formatCurrencyCf(Math.round(-holdingCosts))}</td>
                  <td className={`cft-td ${getValueClass(y.gearing, true)}`}>{formatCurrencyCf(Math.round(y.gearing))}</td>
                  <td className="cft-td-divider" />
                  <td className="cft-td cft-val-positive">{y.taxSaved > 0 ? "+" : ""}{formatCurrencyCf(Math.round(y.taxSaved))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE — Cashflow panel */}
      {viewMode === "property" && isInvestment && propertyPanel === "cashflow" && (
        <table className="cft-table">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell cft-group-label cft-group-net" colSpan={4}>cashflow</th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th">rent</th>
              <th className="cft-th cft-th-agg">total costs</th>
              <th className="cft-th">tax saved</th>
              <th className="cft-th cft-th-result">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              const holdingCosts = y.interestPortion + y.ongoingCosts;
              const totalCosts = holdingCosts + y.principalPortion;
              return (
                <tr key={y.year} className={getRowClass(y.year)}
                  onClick={() => onSelectYear(y.year)}
                  onMouseEnter={() => onHoverYear(y.year)}
                  onMouseLeave={() => onHoverYear(null)}>
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.rentalIncome))}</td>
                  <td className={`cft-td ${getValueClass(-totalCosts, true)}`}>{formatCurrencyCf(Math.round(-totalCosts))}</td>
                  <td className="cft-td cft-val-positive">{y.taxSaved > 0 ? "+" : ""}{formatCurrencyCf(Math.round(y.taxSaved))}</td>
                  <td className={`cft-td cft-td-result ${getValueClass(y.propertyCashflow, true)}`}>
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
        <table className="cft-table">
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
              <th className="cft-th">holding</th>
              <th className="cft-th">interest</th>
              <th className="cft-th-divider" />
              <th className="cft-th">principal</th>
              <th className="cft-th cft-th-agg">repayments</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-th-result">cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => (
              <tr key={y.year} className={`cft-row ${y.year === selectedYear ? "cft-row-active" : ""}`}
                onClick={() => onSelectYear(y.year)}>
                <td className="cft-td cft-td-year">{formatYearCell(y.year, i)}</td><td className="cft-td-divider" />
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
            ))}
          </tbody>
        </table>
      )}

      {/* EQUITY — Property panel */}
      {viewMode === "equity" && equityPanel === "property" && (
        <table className="cft-table">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell" colSpan={2} />
              <th className="cft-group-cell cft-group-label cft-group-income" colSpan={9}>property</th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th cft-th-year" /><th className="cft-th-divider" />
              <th className="cft-th">total growth</th>
              <th className="cft-th">gain %</th>
              <th className="cft-th-divider" />
              <th className="cft-th">yoy growth</th>
              <th className="cft-th">yoy %</th>
              <th className="cft-th-divider" />
              <th className="cft-th cft-th-result">value</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              const prevValue = i > 0 ? yearData[i - 1].propertyValue : propertyValue;
              const totalGrowth = y.propertyValue - propertyValue;
              const totalGrowthPct = ((y.propertyValue / propertyValue - 1) * 100).toFixed(1);
              const yoyGrowth = y.propertyValue - prevValue;
              const yoyGrowthPct = i > 0
                ? ((y.propertyValue / prevValue - 1) * 100).toFixed(1)
                : totalGrowthPct;
              return (
                <tr key={y.year} className={getRowClass(y.year)}
                  onClick={() => onSelectYear(y.year)}
                  onMouseEnter={() => onHoverYear(y.year)}
                  onMouseLeave={() => onHoverYear(null)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i)}</td><td className="cft-td-divider" />
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
        <table className="cft-table">
          <thead>
            <tr className="cft-group-row">
              <th className="cft-group-cell cft-group-label cft-group-position" colSpan={showOffset ? 7 : 6}>position</th>
            </tr>
            <tr className="cft-header-row">
              <th className="cft-th">prop value</th>
              <th className="cft-th">loan balance</th>
              <th className="cft-th cft-th-agg">prop equity</th>
              <th className="cft-th cft-th-agg">lvr</th>
              <th className="cft-th-divider" />
              {showOffset && <th className="cft-th">offset</th>}
              <th className="cft-th cft-th-result">net equity</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              const lvr = y.loanBalance / y.propertyValue * 100;
              const propertyEquity = y.propertyValue - y.loanBalance;
              return (
                <tr key={y.year} className={getRowClass(y.year)}
                  onClick={() => onSelectYear(y.year)}
                  onMouseEnter={() => onHoverYear(y.year)}
                  onMouseLeave={() => onHoverYear(null)}>
                  <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.propertyValue))}</td>
                  <td className={`cft-td ${getValueClass(-y.loanBalance, false, true)}`}>{formatCurrencyCf(Math.round(-y.loanBalance))}</td>
                  <td className="cft-td" style={{ fontWeight: 700, color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(propertyEquity))}</td>
                  <td className={`cft-td ${getLvrClass(lvr)}`} style={{ fontWeight: 700 }}>{lvr.toFixed(1)}%</td>
                  <td className="cft-td-divider" />
                  {showOffset && <td className="cft-td cft-val-dim">{formatCurrencyCf(Math.round(y.offsetBalanceAtYear))}</td>}
                  <td className="cft-td cft-td-result cft-val-result">
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
        <table className="cft-table">
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
              {isInvestment && <th className="cft-th">interest</th>}
              <th className="cft-th">rates</th>
              <th className="cft-th">insurance</th>
              <th className="cft-th">maint.</th>
              <th className="cft-th cft-th-agg">subtotal</th>
              {isInvestment && (
                <>
                  <th className="cft-th-divider" />
                  <th className="cft-th">div 43</th>
                  <th className="cft-th">div 40</th>
                  <th className="cft-th cft-th-agg">subtotal</th>
                </>
              )}
              <th className="cft-th-divider" />
              <th className="cft-th cft-th-result">{isInvestment ? "total ded." : "total exp."}</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              const holdingTotal = isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts;
              const depTotal = y.depDiv43 + y.depDiv40;
              const grandTotal = isInvestment ? holdingTotal + depTotal : holdingTotal;
              return (
                <tr key={y.year} className={getRowClass(y.year)}
                  onClick={() => onSelectYear(y.year)}
                  onMouseEnter={() => onHoverYear(y.year)}
                  onMouseLeave={() => onHoverYear(null)}>
                  <td className="cft-td cft-td-year">{formatYearCell(y.year, i)}</td><td className="cft-td-divider" />
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
                  <td className="cft-td cft-td-result cft-val-result">
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
