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
              <th>Salary</th>
              {isInvestment && <th>Rental Income</th>}
              <th style={{ fontWeight: 600 }}>Gross Income</th>
              <th>Deductions</th>
              <th>Taxable Income</th>
              <th>Income Tax</th>
              {isInvestment && <th style={{ color: "var(--cf-accent)" }}>Tax Saved</th>}
              <th>After-Tax Income</th>
              <th>Holding Costs</th>
              <th>Loan Principal</th>
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
                  <td>{formatCurrencyCf(Math.round(y.salary))}</td>
                  {isInvestment && <td>{formatCurrencyCf(Math.round(y.rentalIncome))}</td>}
                  <td style={{ fontWeight: 700, color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(y.grossIncome))}</td>
                  <td className="cf-negative">{formatCurrencyCf(Math.round(-y.totalDeductionsForTax))}</td>
                  <td>{formatCurrencyCf(Math.round(y.taxableIncomeCalc))}</td>
                  <td className="cf-negative">{formatCurrencyCf(Math.round(-y.incomeTaxCalc))}</td>
                  {isInvestment && (
                    <td style={{ color: "var(--cf-accent)", fontWeight: 600 }}>+{formatCurrencyCf(Math.round(y.taxSaved))}</td>
                  )}
                  <td>{formatCurrencyCf(Math.round(y.afterTaxIncome))}</td>
                  <td className="cf-negative">{formatCurrencyCf(Math.round(-holdingCosts))}</td>
                  <td className="cf-negative">{formatCurrencyCf(Math.round(-y.principalPortion))}</td>
                  <td className="cf-col-highlight" style={{ color: y.netCashflow < 0 ? "var(--cf-negative)" : "var(--cf-accent)", fontWeight: 600 }}>
                    {formatCurrencyCf(Math.round(y.netCashflow))}
                  </td>
                </tr>
              );
            })}
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
              {isInvestment && <th>Rental Income</th>}
              {isInvestment ? (
                <th>Holding Costs</th>
              ) : (
                <>
                  <th>Holding Costs</th>
                  <th>Loan Interest</th>
                  <th>Loan Principal</th>
                  <th style={{ fontWeight: 600 }}>Total Repayments</th>
                  <th className="cf-col-highlight" style={{ color: "var(--cf-accent)", fontWeight: 700 }}>Property Cashflow</th>
                </>
              )}
              {isInvestment && <th>Depreciation</th>}
              {isInvestment && <th style={{ fontWeight: 600 }}>Net Gearing</th>}
              {isInvestment && <th>Loan Principal</th>}
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
                    <td>{formatCurrencyCf(Math.round(y.rentalIncome))}</td>
                  )}
                  {isInvestment ? (
                    <>
                      <td className="cf-negative">{formatCurrencyCf(Math.round(-totalCosts))}</td>
                      <td className="cf-negative">{formatCurrencyCf(Math.round(-totalDep))}</td>
                      <td style={{ color: y.gearing < 0 ? "var(--cf-negative)" : "var(--cf-accent)", fontWeight: 600 }}>
                        {formatCurrencyCf(Math.round(y.gearing))}
                      </td>
                      <td className="cf-negative">{formatCurrencyCf(Math.round(-y.principalPortion))}</td>
                      <td className="cf-col-highlight" style={{ color: y.propertyCashflow < 0 ? "var(--cf-negative)" : "var(--cf-accent)", fontWeight: 600 }}>
                        {formatCurrencyCf(Math.round(y.propertyCashflow))}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="cf-negative">{formatCurrencyCf(Math.round(-y.ongoingCosts))}</td>
                      <td className="cf-negative">{formatCurrencyCf(Math.round(-y.interestPortion))}</td>
                      <td className="cf-negative">{formatCurrencyCf(Math.round(-y.principalPortion))}</td>
                      <td style={{ fontWeight: 600 }} className="cf-negative">{formatCurrencyCf(Math.round(-(y.interestPortion + y.principalPortion)))}</td>
                      <td className="cf-col-highlight" style={{ color: y.propertyCashflow < 0 ? "var(--cf-negative)" : "var(--cf-accent)", fontWeight: 600 }}>
                        {formatCurrencyCf(Math.round(y.propertyCashflow))}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
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
              <th>Property Value</th>
              <th style={{ color: "var(--cf-accent)" }}>Property Growth</th>
              <th>Loan Balance</th>
              <th>LVR</th>
              {showOffset && <th>Offset Total</th>}
              {showOffset && <th>Property Equity</th>}
              <th className="cf-col-highlight" style={{ color: "var(--cf-accent)", fontWeight: 700 }}>Net Equity</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((y, i) => (
              <tr key={y.year} className={y.year === selectedYear ? "cf-active-row" : ""}
                onClick={() => onSelectYear(y.year)}>
                <td className="cf-col-center">{y.year}</td>
                <td className="cf-col-center">{baseYear + i}</td>
                <td>{formatCurrencyCf(Math.round(y.propertyValue))}</td>
                <td style={{ color: "var(--cf-accent)" }}>
                  +{formatCurrencyCf(Math.round(y.propertyValue - propertyValue))}
                </td>
                <td className="cf-negative">{formatCurrencyCf(Math.round(-y.loanBalance))}</td>
                <td>{(y.loanBalance / y.propertyValue * 100).toFixed(1)}%</td>
                {showOffset && (
                  <td>{formatCurrencyCf(Math.round(y.offsetBalanceAtYear))}</td>
                )}
                {showOffset && (
                  <td>{formatCurrencyCf(Math.round(y.propertyEquity))}</td>
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
              <th colSpan={isInvestment ? 5 : 4}>{isInvestment ? "Holding Costs" : "Expenses"}</th>
              {isInvestment && <th colSpan={3}>Depreciation</th>}
              <th style={{ color: "var(--cf-accent)" }}>Total</th>
            </tr>
            <tr className="cf-col-header">
              <th className="cf-col-center cf-col-year">Year</th>
              <th className="cf-col-center cf-col-loan-yr">Cal. Year</th>
              {isInvestment && <th>Interest</th>}
              <th>Rates</th>
              <th>Insurance</th>
              <th>Maint.</th>
              <th style={{ fontWeight: 600 }}>Total</th>
              {isInvestment && <th>Div 43</th>}
              {isInvestment && <th>Div 40</th>}
              {isInvestment && <th style={{ fontWeight: 600 }}>Total</th>}
              <th className="cf-col-highlight" style={{ color: "var(--cf-accent)", fontWeight: 700 }}>
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
                  {isInvestment && <td>{formatCurrencyCf(Math.round(y.interestPortion))}</td>}
                  <td>{formatCurrencyCf(Math.round(y.councilRates + y.waterRates))}</td>
                  <td>{formatCurrencyCf(Math.round(y.insurance))}</td>
                  <td>{formatCurrencyCf(Math.round(y.maintenance + y.strataFees))}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrencyCf(Math.round(holdingTotal))}</td>
                  {isInvestment && <td>{formatCurrencyCf(Math.round(y.depDiv43))}</td>}
                  {isInvestment && <td>{formatCurrencyCf(Math.round(y.depDiv40))}</td>}
                  {isInvestment && <td style={{ fontWeight: 600 }}>{formatCurrencyCf(Math.round(depTotal))}</td>}
                  <td className="cf-col-highlight" style={{ color: "var(--cf-accent)", fontWeight: 600 }}>
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