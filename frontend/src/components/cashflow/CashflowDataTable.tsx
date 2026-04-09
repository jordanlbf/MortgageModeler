"use client";

import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { formatCurrencyCf } from "@/lib/cashflow-calculations";

interface Props {
  yearData: YearData[];
  viewMode: ViewMode;
  selectedYear: number;
  isInvestment: boolean;
  hasOffset: boolean;
  propertyValue: number;
  onSelectYear: (year: number) => void;
}

export default function CashflowDataTable({
  yearData, viewMode, selectedYear, isInvestment,
  hasOffset, propertyValue, onSelectYear,
}: Props) {
  const baseYear = new Date().getFullYear();
  const showOffset = hasOffset && yearData.some(y => y.offsetBalanceAtYear > 0);

  return (
    <div className="cf-table-wrap">
      {/* SUMMARY TABLE */}
      {viewMode === "summary" && (
        <table className="cf-data-table">
          <thead>
            <tr className="cf-col-header">
              <th className="cf-col-center cf-col-year">Year</th>
              <th className="cf-col-center cf-col-loan-yr">Cal. Year</th>
              <th className="cf-group-divider">Salary</th>
              {isInvestment && <th style={{ color: "rgba(45,212,191,0.6)" }}>Rental Income</th>}
              <th style={{ fontWeight: 600 }}>Gross Income</th>
              <th className="cf-group-divider" style={{ color: "rgba(167,139,250,0.55)" }}>Deductions</th>
              <th style={{ color: "rgba(167,139,250,0.55)" }}>Taxable Income</th>
              <th style={{ color: "rgba(167,139,250,0.55)" }}>Income Tax</th>
              {isInvestment && <th className="cf-col-highlight-tax" style={{ color: "#4ade80", fontWeight: 700 }}>Tax Saved</th>}
              <th className="cf-group-divider" style={{ color: "rgba(45,212,191,0.6)" }}>After-Tax Income</th>
              <th style={{ color: "rgba(245,158,11,0.55)" }}>Holding Costs</th>
              <th style={{ color: "rgba(245,158,11,0.55)" }}>Loan Principal</th>
              <th className="cf-col-highlight" style={{ color: "var(--cf-accent)", fontWeight: 700 }}>Net Cashflow</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              const holdingCosts = y.interestPortion + y.ongoingCosts;
              return (
                <tr key={y.year} className={y.year === selectedYear ? "cf-active-row" : ""}
                  onClick={() => onSelectYear(y.year)}>
                  <td className="cf-col-center">{y.year}</td>
                  <td className="cf-col-center">{baseYear + i}</td>
                  <td className="cf-group-divider">{formatCurrencyCf(Math.round(y.salary))}</td>
                  {isInvestment && <td style={{ color: "var(--cf-accent)" }}>{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  <td style={{ fontWeight: 700, color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(y.grossIncome))}</td>
                  <td className="cf-group-divider cf-col-tax cf-negative">{formatCurrencyCf(Math.round(-y.totalDeductionsForTax))}</td>
                  <td className="cf-col-tax">{formatCurrencyCf(Math.round(y.taxableIncomeCalc))}</td>
                  <td className="cf-col-tax cf-negative">{formatCurrencyCf(Math.round(-y.incomeTaxCalc))}</td>
                  {isInvestment && (
                    <td className="cf-col-highlight-tax" style={{ color: "#4ade80", fontWeight: 600 }}>+{formatCurrencyCf(Math.round(y.taxSaved))}</td>
                  )}
                  <td className="cf-group-divider" style={{ color: "rgba(45,212,191,0.6)" }}>{formatCurrencyCf(Math.round(y.afterTaxIncome))}</td>
                  <td className="cf-col-property cf-negative">{formatCurrencyCf(Math.round(-holdingCosts))}</td>
                  <td className="cf-col-property cf-negative">{formatCurrencyCf(Math.round(-y.principalPortion))}</td>
                  <td className="cf-col-cf-result cf-col-highlight" style={{ color: y.netCashflow < 0 ? "#f87171" : "#4ade80" }}>
                    {formatCurrencyCf(Math.round(y.netCashflow))}
                  </td>
                </tr>
              );
            })}
            <tr className="cf-formula-row">
              <td colSpan={2}></td>
              <td colSpan={isInvestment ? 3 : 2} style={{ color: "rgba(45,212,191,0.4)", textAlign: "center" }}>
                Salary + Rental = Gross
              </td>
              <td colSpan={isInvestment ? 4 : 3} style={{ color: "rgba(167,139,250,0.4)", textAlign: "center" }}>
                Gross &minus; Ded. = Taxable &rarr; Tax
              </td>
              <td colSpan={4} style={{ color: "rgba(45,212,191,0.4)", textAlign: "center" }}>
                After-Tax &minus; Costs &minus; Principal = Net CF
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* PROPERTY TABLE */}
      {viewMode === "property" && (
        <table className="cf-data-table">
          <thead>
            <tr className="cf-col-header">
              <th className="cf-col-center cf-col-year">Year</th>
              <th className="cf-col-center cf-col-loan-yr">Cal. Year</th>
              {isInvestment && <th className="cf-group-divider" style={{ color: "rgba(45,212,191,0.6)" }}>Rental Income</th>}
              {isInvestment ? (
                <th style={{ color: "rgba(245,158,11,0.55)" }}>Holding Costs</th>
              ) : (
                <>
                  <th className="cf-group-divider" style={{ color: "rgba(245,158,11,0.55)" }}>Holding Costs</th>
                  <th style={{ color: "rgba(245,158,11,0.55)" }}>Loan Interest</th>
                  <th style={{ color: "rgba(245,158,11,0.55)" }}>Loan Principal</th>
                  <th style={{ color: "#f59e0b", fontWeight: 600 }}>Total Repayments</th>
                  <th className="cf-col-highlight" style={{ color: "var(--cf-accent)", fontWeight: 700 }}>Property Cashflow</th>
                </>
              )}
              {isInvestment && <th className="cf-group-divider" style={{ color: "rgba(167,139,250,0.55)" }}>Depreciation</th>}
              {isInvestment && <th style={{ color: "#a78bfa", fontWeight: 600 }}>Net Gearing</th>}
              {isInvestment && <th className="cf-group-divider" style={{ color: "rgba(245,158,11,0.55)" }}>Loan Principal</th>}
              {isInvestment && <th className="cf-col-highlight" style={{ color: "var(--cf-accent)", fontWeight: 700 }}>Property Cashflow</th>}
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              const totalCosts = y.interestPortion + y.ongoingCosts;
              const totalDep = y.depDiv43 + y.depDiv40;
              return (
                <tr key={y.year} className={y.year === selectedYear ? "cf-active-row" : ""}
                  onClick={() => onSelectYear(y.year)}>
                  <td className="cf-col-center">{y.year}</td>
                  <td className="cf-col-center">{baseYear + i}</td>
                  {isInvestment && (
                    <td className="cf-group-divider" style={{ color: "var(--cf-accent)" }}>{formatCurrencyCf(Math.round(y.rentalIncome))}</td>
                  )}
                  {isInvestment ? (
                    <>
                      <td className="cf-col-property cf-negative">{formatCurrencyCf(Math.round(-totalCosts))}</td>
                      <td className="cf-group-divider cf-col-tax cf-negative">{formatCurrencyCf(Math.round(-totalDep))}</td>
                      <td style={{ color: y.gearing < 0 ? "#f87171" : "#4ade80", fontWeight: 600 }}>
                        {formatCurrencyCf(Math.round(y.gearing))}
                      </td>
                      <td className="cf-group-divider cf-col-property cf-negative">{formatCurrencyCf(Math.round(-y.principalPortion))}</td>
                      <td className="cf-col-cf-result cf-col-highlight" style={{ color: y.propertyCashflow < 0 ? "#f87171" : "#4ade80" }}>
                        {formatCurrencyCf(Math.round(y.propertyCashflow))}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="cf-group-divider cf-col-property cf-negative">{formatCurrencyCf(Math.round(-y.ongoingCosts))}</td>
                      <td className="cf-col-property cf-negative">{formatCurrencyCf(Math.round(-y.interestPortion))}</td>
                      <td className="cf-col-property cf-negative">{formatCurrencyCf(Math.round(-y.principalPortion))}</td>
                      <td className="cf-col-property-agg cf-negative">{formatCurrencyCf(Math.round(-(y.interestPortion + y.principalPortion)))}</td>
                      <td className="cf-col-cf-result cf-col-highlight" style={{ color: y.propertyCashflow < 0 ? "#f87171" : "#4ade80" }}>
                        {formatCurrencyCf(Math.round(y.propertyCashflow))}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            <tr className="cf-formula-row">
              <td colSpan={2}></td>
              {isInvestment ? (
                <>
                  <td colSpan={2}></td>
                  <td colSpan={2} style={{ color: "rgba(167,139,250,0.4)", textAlign: "center" }}>
                    Rent &minus; Costs &minus; Dep. = Gearing
                  </td>
                  <td colSpan={2} style={{ color: "rgba(45,212,191,0.4)", textAlign: "center" }}>
                    Rent &minus; Costs &minus; Principal = CF
                  </td>
                </>
              ) : (
                <td colSpan={5} style={{ color: "rgba(245,158,11,0.4)", textAlign: "center" }}>
                  Holding Costs + Repayments = Property CF
                </td>
              )}
            </tr>
          </tbody>
        </table>
      )}

      {/* EQUITY TABLE */}
      {viewMode === "equity" && (
        <table className="cf-data-table">
          <thead>
            <tr className="cf-col-header">
              <th className="cf-col-center cf-col-year">Year</th>
              <th className="cf-col-center cf-col-loan-yr">Cal. Year</th>
              <th className="cf-group-divider" style={{ color: "rgba(245,158,11,0.55)" }}>Property Value</th>
              <th style={{ color: "rgba(245,158,11,0.55)" }}>Property Growth</th>
              <th className="cf-group-divider" style={{ color: "rgba(167,139,250,0.55)" }}>Loan Balance</th>
              <th style={{ color: "#a78bfa", fontWeight: 600 }}>LVR</th>
              {showOffset && <th className="cf-group-divider" style={{ color: "rgba(45,212,191,0.6)" }}>Offset Total</th>}
              {showOffset && <th style={{ color: "rgba(45,212,191,0.6)" }}>Property Equity</th>}
              <th className="cf-col-highlight" style={{ color: "var(--cf-accent)", fontWeight: 700 }}>Net Equity</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => (
              <tr key={y.year} className={y.year === selectedYear ? "cf-active-row" : ""}
                onClick={() => onSelectYear(y.year)}>
                <td className="cf-col-center">{y.year}</td>
                <td className="cf-col-center">{baseYear + i}</td>
                <td className="cf-group-divider cf-col-property">{formatCurrencyCf(Math.round(y.propertyValue))}</td>
                <td className="cf-col-property" style={{ color: "#4ade80" }}>
                  +{formatCurrencyCf(Math.round(y.propertyValue - propertyValue))}
                </td>
                <td className="cf-group-divider cf-negative">{formatCurrencyCf(Math.round(-y.loanBalance))}</td>
                <td className="cf-col-tax-agg">{(y.loanBalance / y.propertyValue * 100).toFixed(1)}%</td>
                {showOffset && (
                  <td className="cf-group-divider" style={{ color: "var(--cf-accent)" }}>
                    {formatCurrencyCf(Math.round(y.offsetBalanceAtYear))}
                  </td>
                )}
                {showOffset && (
                  <td style={{ color: "rgba(45,212,191,0.6)" }}>{formatCurrencyCf(Math.round(y.propertyEquity))}</td>
                )}
                <td className="cf-col-highlight" style={{ color: "var(--cf-accent)", fontWeight: 600 }}>
                  {formatCurrencyCf(Math.round(y.netEquity))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* DEDUCTIONS / EXPENSES TABLE */}
      {viewMode === "deductions" && (
        <table className="cf-data-table">
          <thead>
            <tr className="cf-group-header">
              <th colSpan={2}></th>
              <th colSpan={isInvestment ? 5 : 4} style={{ color: "rgba(245,158,11,0.8)" }}>{isInvestment ? "Holding Costs" : "Expenses"}</th>
              {isInvestment && <th colSpan={3} style={{ color: "rgba(167,139,250,0.8)" }}>Depreciation</th>}
              <th style={{ color: "var(--cf-accent)" }}>Total</th>
            </tr>
            <tr className="cf-col-header">
              <th className="cf-col-center cf-col-year">Year</th>
              <th className="cf-col-center cf-col-loan-yr">Cal. Year</th>
              {isInvestment && <th className="cf-group-divider" style={{ color: "rgba(245,158,11,0.55)" }}>Interest</th>}
              <th className={isInvestment ? "" : "cf-group-divider"} style={{ color: "rgba(245,158,11,0.55)" }}>Rates</th>
              <th style={{ color: "rgba(245,158,11,0.55)" }}>Insurance</th>
              <th style={{ color: "rgba(245,158,11,0.55)" }}>Maint.</th>
              <th style={{ color: "#f59e0b", fontWeight: 600 }}>Total</th>
              {isInvestment && <th className="cf-group-divider" style={{ color: "rgba(167,139,250,0.55)" }}>Div 43</th>}
              {isInvestment && <th style={{ color: "rgba(167,139,250,0.55)" }}>Div 40</th>}
              {isInvestment && <th style={{ color: "#a78bfa", fontWeight: 600 }}>Total</th>}
              <th className="cf-group-divider cf-col-highlight" style={{ color: "var(--cf-accent)", fontWeight: 700 }}>
                {isInvestment ? "Total Ded." : "Total Exp."}
              </th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => {
              const holdingTotal = isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts;
              const depTotal = y.depDiv43 + y.depDiv40;
              const grandTotal = isInvestment ? holdingTotal + depTotal : holdingTotal;
              return (
                <tr key={y.year} className={y.year === selectedYear ? "cf-active-row" : ""}
                  onClick={() => onSelectYear(y.year)}>
                  <td className="cf-col-center">{y.year}</td>
                  <td className="cf-col-center">{baseYear + i}</td>
                  {isInvestment && <td className="cf-group-divider cf-col-property">{formatCurrencyCf(Math.round(y.interestPortion))}</td>}
                  <td className={isInvestment ? "cf-col-property" : "cf-group-divider cf-col-property"}>{formatCurrencyCf(Math.round(y.councilRates + y.waterRates))}</td>
                  <td className="cf-col-property">{formatCurrencyCf(Math.round(y.insurance))}</td>
                  <td className="cf-col-property">{formatCurrencyCf(Math.round(y.maintenance + y.strataFees))}</td>
                  <td className="cf-col-property-agg">{formatCurrencyCf(Math.round(holdingTotal))}</td>
                  {isInvestment && <td className="cf-group-divider cf-col-tax">{formatCurrencyCf(Math.round(y.depDiv43))}</td>}
                  {isInvestment && <td className="cf-col-tax">{formatCurrencyCf(Math.round(y.depDiv40))}</td>}
                  {isInvestment && <td className="cf-col-tax-agg">{formatCurrencyCf(Math.round(depTotal))}</td>}
                  <td className="cf-group-divider cf-col-highlight" style={{ color: "var(--cf-accent)", fontWeight: 600 }}>
                    {formatCurrencyCf(Math.round(grandTotal))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
