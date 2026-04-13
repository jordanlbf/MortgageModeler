"use client";

import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { formatCurrencyCf, formatAbbreviated } from "@/lib/cashflow-calculations";
import KpiSparkline from "./KpiSparkline";

interface KpiItem {
  label: string;
  value: string;
  color: string;
  sub: string;
  sparkData?: number[];
  sparkColor?: string;
}

interface Props {
  viewMode: ViewMode;
  yearData: YearData[];
  selectedYearData: YearData | null;
  selectedYear: number;
  isInvestment: boolean;
  marginalRate: number;
  hasOffset?: boolean;
  isHovered?: boolean;
}

export default function CashflowKpiStrip({
  viewMode, yearData, selectedYearData: sy,
  selectedYear, isInvestment, marginalRate, hasOffset, isHovered,
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
        sparkData: yearData.map(y => y.netCashflow),
      },
      {
        label: "Tax Saved",
        value: `${y1.taxSaved > 0 ? "+" : ""}${formatCurrencyCf(Math.round(y1.taxSaved))}`,
        color: "var(--cf-positive)",
        sub: `Year 1 · ${Math.round(marginalRate * 100)}% marginal rate`,
        sparkData: yearData.map(y => y.taxSaved),
      },
      {
        label: "Property Value",
        value: formatAbbreviated(y1.propertyValue),
        color: "var(--cf-text)",
        sub: formatCurrencyCf(Math.round(y1.propertyValue)),
        sparkData: yearData.map(y => y.propertyValue),
      },
      {
        label: "LVR",
        value: `${(y1.loanBalance / y1.propertyValue * 100).toFixed(1)}%`,
        color: (y1.loanBalance / y1.propertyValue * 100) > 80 ? "var(--cf-negative)" : "var(--cf-text)",
        sub: "Loan-to-value ratio",
        sparkData: yearData.map(y => y.loanBalance / y.propertyValue * 100),
      },
    ];
  } else if (viewMode === "property") {
    items = [
      {
        label: "Property Cashflow",
        value: `${formatCurrencyCf(Math.round(y1.propertyCashflow / 12))}/mo`,
        color: y1.propertyCashflow < 0 ? "var(--cf-negative)" : "var(--cf-positive)",
        sub: `Year 1 · ${formatCurrencyCf(Math.round(y1.propertyCashflow))} p.a.`,
        sparkData: yearData.map(y => y.propertyCashflow),
      },
      ...(isInvestment ? [{
        label: "Gearing Status",
        value: formatCurrencyCf(Math.round(y1.gearing)),
        color: y1.gearing < 0 ? "var(--cf-negative)" : "var(--cf-positive)",
        sub: y1.gearing < 0 ? "Negatively geared" : "Positively geared",
        sparkData: yearData.map(y => y.gearing),
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
        sparkData: yearData.map(y => y.rentalIncome),
      },
      {
        label: "Holding Costs",
        value: formatCurrencyCf(Math.round(y1.interestPortion + y1.ongoingCosts)),
        color: "#f59e0b",
        sub: "Interest + ongoing",
        sparkData: yearData.map(y => y.interestPortion + y.ongoingCosts),
      },
    ];
  } else if (viewMode === "equity" && sy) {
    const lvr = sy.loanBalance / sy.propertyValue * 100;
    const showOffset = hasOffset && sy.offsetBalanceAtYear > 0;
    items = [
      {
        label: "Property Value",
        value: formatCurrencyCf(Math.round(sy.propertyValue)),
        color: "var(--cf-text)",
        sub: "",
        sparkData: yearData.map(y => y.propertyValue),
      },
      {
        label: "Loan Balance",
        value: `−${formatCurrencyCf(Math.round(sy.loanBalance))}`,
        color: "var(--cf-negative)",
        sub: "",
        sparkData: yearData.map(y => y.loanBalance),
      },
      {
        label: "LVR",
        value: `${lvr.toFixed(1)}%`,
        color: lvr > 80 ? "var(--cf-negative)" : lvr > 60 ? "#fbbf24" : "var(--cf-positive)",
        sub: "",
        sparkData: yearData.map(y => y.loanBalance / y.propertyValue * 100),
      },
      {
        label: "Property Equity",
        value: formatCurrencyCf(Math.round(sy.propertyValue - sy.loanBalance)),
        color: "var(--cf-text)",
        sub: "",
        sparkData: yearData.map(y => y.propertyValue - y.loanBalance),
      },
      ...(showOffset ? [
        {
          label: "Offset Value",
          value: formatCurrencyCf(Math.round(sy.offsetBalanceAtYear)),
          color: "var(--cf-text)",
          sub: "",
          sparkData: yearData.map(y => y.offsetBalanceAtYear),
        },
        {
          label: "Net Equity",
          value: formatCurrencyCf(Math.round(sy.netEquity)),
          color: "var(--cf-positive)",
          sub: "",
          sparkData: yearData.map(y => y.netEquity),
        },
      ] : []),
    ];
  } else if (viewMode === "deductions" && sy) {
    const holdingCosts = isInvestment ? sy.interestPortion + sy.ongoingCosts : sy.ongoingCosts;
    const depTotal = sy.depDiv43 + sy.depDiv40;
    items = [
      {
        label: "Holding Costs",
        value: formatCurrencyCf(Math.round(holdingCosts)),
        color: "var(--cf-text)",
        sub: "",
        sparkData: yearData.map(y => isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts),
      },
      ...(isInvestment ? [{
        label: "Total Depreciation",
        value: formatCurrencyCf(Math.round(depTotal)),
        color: "var(--cf-text)",
        sub: "",
        sparkData: yearData.map(y => y.depDiv43 + y.depDiv40),
      }] : []),
      {
        label: isInvestment ? "Total Deductions" : "Total Expenses",
        value: formatCurrencyCf(Math.round(isInvestment ? sy.totalDeductions : sy.ongoingCosts)),
        color: "var(--cf-text)",
        sub: "",
        sparkData: yearData.map(y => isInvestment ? y.totalDeductions : y.ongoingCosts),
      },
    ];
  }

  const selectedIndex = selectedYear - 1;

  return (
    <div className={`cf-kpi-strip ${isHovered ? "cf-kpi-strip--hover" : ""}`}>
      {items.map((item, i) => (
        <div key={i} className="cf-kpi-cell">
          <div className="cf-kpi-label">{item.label}</div>
          <div className="cf-kpi-value" style={{ color: item.color }}>{item.value}</div>
          {item.sparkData && (
            <KpiSparkline
              data={item.sparkData}
              color={item.sparkColor ?? item.color}
              selectedIndex={selectedIndex}
            />
          )}
        </div>
      ))}
    </div>
  );
}