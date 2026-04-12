"use client";

import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { formatCurrencyCf, formatAbbreviated } from "@/lib/cashflow-calculations";

interface KpiItem {
  label: string;
  value: string;
  color: string;
  sub: string;
}

interface Props {
  viewMode: ViewMode;
  yearData: YearData[];
  selectedYearData: YearData | null;
  selectedYear: number;
  isInvestment: boolean;
  marginalRate: number;
}

export default function CashflowKpiStrip({
  viewMode, yearData, selectedYearData: sy,
  selectedYear, isInvestment, marginalRate,
}: Props) {
  const y1 = yearData[0];
  let items: KpiItem[] = [];

  if (viewMode === "summary") {
    items = [
      {
        label: "Net Cashflow",
        value: `${formatCurrencyCf(Math.round(y1.netCashflow / 12))}/mo`,
        color: y1.netCashflow < 0 ? "var(--cf-negative)" : "var(--cf-positive)",
        sub: `Year 1 · ${formatCurrencyCf(Math.round(y1.netCashflow))} p.a.`,
      },
      {
        label: "Tax Saved",
        value: `${y1.taxSaved > 0 ? "+" : ""}${formatCurrencyCf(Math.round(y1.taxSaved))}`,
        color: "var(--cf-positive)",
        sub: `Year 1 · ${Math.round(marginalRate * 100)}% marginal rate`,
      },
      {
        label: "Property Value",
        value: formatAbbreviated(y1.propertyValue),
        color: "var(--cf-text)",
        sub: formatCurrencyCf(Math.round(y1.propertyValue)),
      },
      {
        label: "LVR",
        value: `${(y1.loanBalance / y1.propertyValue * 100).toFixed(1)}%`,
        color: (y1.loanBalance / y1.propertyValue * 100) > 80 ? "var(--cf-negative)" : "var(--cf-text)",
        sub: "Loan-to-value ratio",
      },
    ];
  } else if (viewMode === "property") {
    items = [
      {
        label: "Property Cashflow",
        value: `${formatCurrencyCf(Math.round(y1.propertyCashflow / 12))}/mo`,
        color: y1.propertyCashflow < 0 ? "var(--cf-negative)" : "var(--cf-positive)",
        sub: `Year 1 · ${formatCurrencyCf(Math.round(y1.propertyCashflow))} p.a.`,
      },
      ...(isInvestment ? [{
        label: "Gearing Status",
        value: formatCurrencyCf(Math.round(y1.gearing)),
        color: y1.gearing < 0 ? "var(--cf-negative)" : "var(--cf-positive)",
        sub: y1.gearing < 0 ? "Negatively geared" : "Positively geared",
      }] : [{
        label: "Total Interest",
        value: formatCurrencyCf(Math.round(yearData.reduce((s, y) => s + y.interestPortion, 0))),
        color: "var(--cf-negative)",
        sub: "Over 30 years",
      }]),
      {
        label: "Gross Rent",
        value: formatCurrencyCf(Math.round(y1.grossRent)),
        color: "var(--cf-text)",
        sub: `${formatCurrencyCf(Math.round(y1.grossRent / 52))}/wk`,
      },
      {
        label: "Holding Costs",
        value: formatCurrencyCf(Math.round(y1.interestPortion + y1.ongoingCosts)),
        color: "#f59e0b",
        sub: "Interest + ongoing",
      },
    ];
  } else if (viewMode === "equity" && sy) {
    items = [
      {
        label: "Property Value",
        value: formatAbbreviated(sy.propertyValue),
        color: "var(--cf-positive)",
        sub: `Year ${selectedYear} · ${formatCurrencyCf(Math.round(sy.propertyValue))}`,
      },
      {
        label: "Loan Balance",
        value: formatAbbreviated(sy.loanBalance),
        color: "var(--cf-negative)",
        sub: `Year ${selectedYear} · ${formatCurrencyCf(Math.round(sy.loanBalance))}`,
      },
      {
        label: "Net Equity",
        value: formatAbbreviated(sy.netEquity),
        color: "var(--cf-positive)",
        sub: `Year ${selectedYear} · ${formatCurrencyCf(Math.round(sy.netEquity))}`,
      },
      {
        label: "LVR",
        value: `${(sy.loanBalance / sy.propertyValue * 100).toFixed(1)}%`,
        color: (sy.loanBalance / sy.propertyValue * 100) > 80 ? "var(--cf-negative)" : "var(--cf-text)",
        sub: "Loan-to-value ratio",
      },
    ];
  } else if (viewMode === "deductions" && sy) {
    items = [
      {
        label: isInvestment ? "Total Deductions" : "Total Expenses",
        value: formatCurrencyCf(Math.round(isInvestment ? sy.totalDeductions : sy.ongoingCosts)),
        color: "#a78bfa",
        sub: `Year ${selectedYear} · Tax-deductible`,
      },
      {
        label: isInvestment ? "Holding Costs" : "Annual Expenses",
        value: formatCurrencyCf(Math.round(isInvestment ? sy.interestPortion + sy.ongoingCosts : sy.ongoingCosts)),
        color: "#f59e0b",
        sub: isInvestment ? "Interest + ongoing" : "Rates + insurance + maint.",
      },
      {
        label: "Tax Saved",
        value: `${sy.taxSaved > 0 ? "+" : ""}${formatCurrencyCf(Math.round(sy.taxSaved))}`,
        color: "var(--cf-positive)",
        sub: `Year ${selectedYear}`,
      },
      {
        label: "Effective Rate",
        value: `${Math.round(marginalRate * 100)}%`,
        color: "var(--cf-text)",
        sub: "Marginal tax rate",
      },
    ];
  }

  return (
    <div className="cf-kpi-strip">
      {items.map((item, i) => (
        <div key={i} className="cf-kpi-cell">
          <div className="cf-kpi-label">{item.label}</div>
          <div className="cf-kpi-value" style={{ color: item.color }}>{item.value}</div>
          <div className="cf-kpi-sub">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}