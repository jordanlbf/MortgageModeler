"use client";

import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { formatCurrencyCf, formatAbbreviated } from "@/lib/cashflow-calculations";

interface Props {
  position: "left" | "right";
  viewMode: ViewMode;
  yearData: YearData[];
  selectedYearData: YearData | null;
  selectedYear: number;
  isInvestment: boolean;
  marginalRate: number;
}

export default function CashflowKpiStrip({
  position, viewMode, yearData, selectedYearData: sy,
  selectedYear, isInvestment, marginalRate,
}: Props) {
  if (position === "left") {
    return (
      <div className="cf-kpi-strip cf-kpi-left">
        {viewMode === "summary" && (
          <>
            <div className="cf-kpi-card cf-kpi-primary">
              <div className="cf-kpi-label">Net Cashflow</div>
              <div className={`cf-kpi-value ${yearData[0].netCashflow < 0 ? "cf-negative" : "cf-positive"}`}>
                {formatCurrencyCf(Math.round(yearData[0].netCashflow / 12))}
                <span className="cf-kpi-unit">/mo</span>
              </div>
              <div className="cf-kpi-sub">Year 1 · {formatCurrencyCf(Math.round(yearData[0].netCashflow))} p.a.</div>
            </div>
            <div className="cf-kpi-card cf-kpi-highlight">
              <div className="cf-kpi-label">Tax Saved</div>
              <div className="cf-kpi-value cf-positive">
                +{formatCurrencyCf(Math.round(yearData[0].taxSaved))}
              </div>
              <div className="cf-kpi-sub">Year 1 · {Math.round(marginalRate * 100)}% marginal rate</div>
            </div>
          </>
        )}
        {viewMode === "property" && (
          <>
            <div className="cf-kpi-card cf-kpi-primary">
              <div className="cf-kpi-label">Property Cashflow</div>
              <div className={`cf-kpi-value ${yearData[0].propertyCashflow < 0 ? "cf-negative" : "cf-positive"}`}>
                {formatCurrencyCf(Math.round(yearData[0].propertyCashflow / 12))}
                <span className="cf-kpi-unit">/mo</span>
              </div>
              <div className="cf-kpi-sub">Year 1 · {formatCurrencyCf(Math.round(yearData[0].propertyCashflow))} p.a.</div>
            </div>
            {isInvestment ? (
              <div className="cf-kpi-card cf-kpi-highlight">
                <div className="cf-kpi-label">Gearing Status</div>
                <div className={`cf-kpi-value ${yearData[0].gearing < 0 ? "cf-negative" : "cf-positive"}`}>
                  {formatCurrencyCf(Math.round(yearData[0].gearing))}
                </div>
                <div className="cf-kpi-sub">{yearData[0].gearing < 0 ? "Negatively geared" : "Positively geared"}</div>
              </div>
            ) : (
              <div className="cf-kpi-card">
                <div className="cf-kpi-label">Total Interest</div>
                <div className="cf-kpi-value cf-negative">
                  {formatCurrencyCf(Math.round(yearData.reduce((s, y) => s + y.interestPortion, 0)))}
                </div>
                <div className="cf-kpi-sub">Over 30 years</div>
              </div>
            )}
          </>
        )}
        {viewMode === "equity" && sy && (
          <>
            <div className="cf-kpi-card cf-kpi-primary">
              <div className="cf-kpi-label">Property Value</div>
              <div className="cf-kpi-value cf-positive">{formatAbbreviated(sy.propertyValue)}</div>
              <div className="cf-kpi-sub">Year {selectedYear} · {formatCurrencyCf(Math.round(sy.propertyValue))}</div>
            </div>
            <div className="cf-kpi-card">
              <div className="cf-kpi-label">LVR</div>
              <div className="cf-kpi-value" style={{ color: (sy.loanBalance / sy.propertyValue * 100) > 80 ? "var(--cf-negative)" : "var(--cf-text)" }}>
                {(sy.loanBalance / sy.propertyValue * 100).toFixed(1)}%
              </div>
              <div className="cf-kpi-sub">Loan-to-value ratio</div>
            </div>
          </>
        )}
        {viewMode === "deductions" && sy && (
          <>
            <div className="cf-kpi-card cf-kpi-primary">
              <div className="cf-kpi-label">{isInvestment ? "Total Deductions" : "Total Expenses"}</div>
              <div className="cf-kpi-value" style={{ color: "#a78bfa" }}>
                {formatCurrencyCf(Math.round(isInvestment ? sy.totalDeductions : sy.ongoingCosts))}
              </div>
              <div className="cf-kpi-sub">Year {selectedYear} · Tax-deductible</div>
            </div>
            <div className="cf-kpi-card">
              <div className="cf-kpi-label">{isInvestment ? "Holding Costs" : "Annual Expenses"}</div>
              <div className="cf-kpi-value" style={{ color: "#f59e0b" }}>
                {formatCurrencyCf(Math.round(isInvestment ? sy.interestPortion + sy.ongoingCosts : sy.ongoingCosts))}
              </div>
              <div className="cf-kpi-sub">{isInvestment ? "Interest + ongoing expenses" : "Rates + insurance + maint."}</div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Right strip
  return (
    <div className="cf-kpi-strip cf-kpi-right">
      {viewMode === "equity" && sy ? (
        <>
          <div className="cf-kpi-card">
            <div className="cf-kpi-label">Loan Balance</div>
            <div className="cf-kpi-value cf-negative">{formatAbbreviated(sy.loanBalance)}</div>
            <div className="cf-kpi-sub">Year {selectedYear} · {formatCurrencyCf(Math.round(sy.loanBalance))}</div>
          </div>
          <div className="cf-kpi-card cf-kpi-highlight">
            <div className="cf-kpi-label">Net Equity</div>
            <div className="cf-kpi-value cf-positive">{formatAbbreviated(sy.netEquity)}</div>
            <div className="cf-kpi-sub">Year {selectedYear} · {formatCurrencyCf(Math.round(sy.netEquity))}</div>
          </div>
        </>
      ) : (
        <>
          <div className="cf-kpi-card">
            <div className="cf-kpi-label">Placeholder 1</div>
            <div className="cf-kpi-value" style={{ color: "var(--cf-text-dim)" }}>—</div>
            <div className="cf-kpi-sub">Coming soon</div>
          </div>
          <div className="cf-kpi-card">
            <div className="cf-kpi-label">Placeholder 2</div>
            <div className="cf-kpi-value" style={{ color: "var(--cf-text-dim)" }}>—</div>
            <div className="cf-kpi-sub">Coming soon</div>
          </div>
        </>
      )}
    </div>
  );
}
