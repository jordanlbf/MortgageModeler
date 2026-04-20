"use client";

import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { getMarginalTaxRate, getBracketColor } from "@/lib/cashflow-calculations";
import { formatDollarsSigned } from "@/lib/formatters";
import { safeDiv } from "@/lib/formatters";
import { LVR_COLORS, DEPRECIATION_COLOR } from "@/lib/theme";
import KpiSparkline from "./KpiSparkline";

interface KpiItem {
  label: string;
  value: string;
  color: string;
  sub: string;
  sparkData?: number[];
  sparkColor?: string;
  sparkColors?: string[];
  sparkStepped?: boolean;
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
  depColor?: string;
  onHoverYear?: (year: number | null) => void;
  onSelectYear?: (year: number) => void;
}

export default function CashflowKpiStrip({
  viewMode, yearData, selectedYearData: sy,
  selectedYear, isInvestment, marginalRate, hasOffset, isHovered, depColor = DEPRECIATION_COLOR,
  onHoverYear, onSelectYear,
}: Props) {
  const d = sy ?? yearData[0];
  let items: KpiItem[] = [];

  if (viewMode === "summary") {
    const totalIncome = d.salary + (isInvestment ? d.rentalIncome : 0);
    const totalCosts = d.ongoingCosts + d.loanRepayment + d.incomeTaxCalc;
    items = [
      {
        label: "Income (p.a.)",
        value: formatDollarsSigned(Math.round(totalIncome)),
        color: "var(--color-data-positive)",
        sub: isInvestment ? `Salary + Rent` : "Salary",
        sparkData: yearData.map(y => y.salary + (isInvestment ? y.rentalIncome : 0)),
      },
      {
        label: "Costs (p.a.)",
        value: formatDollarsSigned(Math.round(totalCosts)),
        color: "var(--color-data-negative)",
        sub: "Holding + Repayments + Tax",
        sparkData: yearData.map(y => y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc),
      },
      {
        label: "Tax Paid (p.a.)",
        value: formatDollarsSigned(Math.round(d.incomeTaxCalc)),
        color: "var(--color-data-negative)",
        sub: `${Math.round(marginalRate * 100)}% marginal rate`,
        sparkData: yearData.map(y => y.incomeTaxCalc),
      },
      {
        label: "Cashflow (monthly)",
        value: `${formatDollarsSigned(Math.round((totalIncome - totalCosts) / 12))} /month`,
        color: totalIncome - totalCosts >= 0 ? "var(--color-data-positive)" : "var(--color-data-negative)",
        sub: `${formatDollarsSigned(Math.round(totalIncome - totalCosts))} p.a.`,
        sparkData: yearData.map(y => y.salary + (isInvestment ? y.rentalIncome : 0) - y.ongoingCosts - y.loanRepayment - y.incomeTaxCalc),
      },
    ];
  } else if (viewMode === "property") {
    const holdingCosts = d.interestPortion + d.ongoingCosts;
    const depreciation = d.depDiv43 + d.depDiv40;
    const netGearing = d.rentalIncome - holdingCosts - depreciation;
    items = [
      {
        label: "Holding Cost",
        value: `${formatDollarsSigned(Math.round(holdingCosts / 12))} /month`,
        color: "var(--color-data-negative)",
        sub: `${formatDollarsSigned(Math.round(holdingCosts))} p.a.`,
        sparkData: yearData.map(y => y.interestPortion + y.ongoingCosts),
      },
      {
        label: "Tax Offset",
        value: `+${formatDollarsSigned(Math.round(d.taxSaved))}`,
        color: "var(--color-data-positive)",
        sub: `${Math.round(marginalRate * 100)}% marginal rate`,
        sparkData: yearData.map(y => y.taxSaved),
      },
      {
        label: "After Tax Cashflow",
        value: `${formatDollarsSigned(Math.round(d.propertyCashflow / 12))} /month`,
        color: d.propertyCashflow >= 0 ? "var(--color-data-positive)" : "var(--color-data-negative)",
        sub: `${formatDollarsSigned(Math.round(d.propertyCashflow))} p.a.`,
        sparkData: yearData.map(y => y.propertyCashflow),
      },
      {
        label: "Gearing",
        value: netGearing < 0 ? "Negative" : "Positive",
        color: netGearing < 0 ? "var(--color-data-negative)" : "var(--color-data-positive)",
        sub: formatDollarsSigned(Math.round(netGearing)),
        sparkData: yearData.map(y => (y.rentalIncome - (y.interestPortion + y.ongoingCosts) - (y.depDiv43 + y.depDiv40)) < 0 ? 0 : 1),
        sparkColors: yearData.map(y => (y.rentalIncome - (y.interestPortion + y.ongoingCosts) - (y.depDiv43 + y.depDiv40)) < 0 ? "var(--color-data-negative)" : "var(--color-data-positive)"),
        sparkStepped: true,
      },
    ];
  } else if (viewMode === "tax" && d) {
    const taxableIncome = d.grossIncome - d.totalDeductionsForTax;
    const bracket = getMarginalTaxRate(taxableIncome);
    items = [
      {
        label: "Taxable Income",
        value: formatDollarsSigned(Math.round(taxableIncome)),
        color: "var(--color-fg-primary)",
        sub: `Year ${selectedYear}`,
        sparkData: yearData.map(y => y.grossIncome - y.totalDeductionsForTax),
      },
      {
        label: "Total Deductions",
        value: formatDollarsSigned(Math.round(d.totalDeductions)),
        color: "var(--color-data-negative)",
        sub: "Holding + Depreciation",
        sparkData: yearData.map(y => y.totalDeductions),
      },
      {
        label: "Tax Benefit",
        value: `+${formatDollarsSigned(Math.round(d.taxSaved))}`,
        color: "var(--color-data-positive)",
        sub: `vs. no property`,
        sparkData: yearData.map(y => y.taxSaved),
      },
      {
        label: "Tax Bracket",
        value: `${(bracket * 100).toFixed(bracket % 0.01 === 0 ? 0 : 1)}%`,
        color: getBracketColor(bracket),
        sub: "Marginal rate",
        sparkData: yearData.map(y => getMarginalTaxRate(y.grossIncome - y.totalDeductionsForTax) * 100),
        sparkColors: yearData.map(y => getBracketColor(getMarginalTaxRate(y.grossIncome - y.totalDeductionsForTax))),
        sparkStepped: true,
      },
    ];
  } else if (viewMode === "equity" && sy) {
    const lvr = safeDiv(sy.loanBalance, sy.propertyValue) * 100;
    const showOffset = hasOffset && yearData.some(y => y.offsetBalanceAtYear > 0);
    items = [
      {
        label: "Property Value",
        value: formatDollarsSigned(Math.round(sy.propertyValue)),
        color: "var(--color-fg-primary)",
        sub: "",
        sparkData: yearData.map(y => y.propertyValue),
      },
      {
        label: "Loan Balance",
        value: `−${formatDollarsSigned(Math.round(sy.loanBalance))}`,
        color: "var(--color-data-negative)",
        sub: "",
        sparkData: yearData.map(y => y.loanBalance),
      },
      {
        label: "LVR",
        value: `${lvr.toFixed(1)}%`,
        color: lvr > 80 ? LVR_COLORS.high : lvr > 60 ? LVR_COLORS.moderate : LVR_COLORS.safe,
        sub: "",
        sparkData: yearData.map(y => safeDiv(y.loanBalance, y.propertyValue) * 100),
      },
      ...(showOffset ? [
        {
          label: "Property Equity",
          value: formatDollarsSigned(Math.round(sy.propertyValue - sy.loanBalance)),
          color: "var(--color-fg-primary)",
          sub: "",
          sparkData: yearData.map(y => y.propertyValue - y.loanBalance),
        },
        {
          label: "Offset Value",
          value: formatDollarsSigned(Math.round(sy.offsetBalanceAtYear)),
          color: "var(--color-fg-primary)",
          sub: "",
          sparkData: yearData.map(y => y.offsetBalanceAtYear),
        },
        {
          label: "Net Equity",
          value: formatDollarsSigned(Math.round(sy.netEquity)),
          color: "var(--color-data-positive)",
          sub: "",
          sparkData: yearData.map(y => y.netEquity),
        },
      ] : [
        {
          label: "Net Equity",
          value: formatDollarsSigned(Math.round(sy.netEquity)),
          color: "var(--color-data-positive)",
          sub: "",
          sparkData: yearData.map(y => y.netEquity),
        },
      ]),
    ];
  } else if (viewMode === "deductions" && sy) {
    const holdingCosts = isInvestment ? sy.interestPortion + sy.ongoingCosts : sy.ongoingCosts;
    const depTotal = sy.depDiv43 + sy.depDiv40;
    items = [
      {
        label: "Holding Costs",
        value: formatDollarsSigned(Math.round(holdingCosts)),
        color: "var(--color-data-negative)",
        sub: "",
        sparkData: yearData.map(y => isInvestment ? y.interestPortion + y.ongoingCosts : y.ongoingCosts),
      },
      ...(isInvestment ? [{
        label: "Total Depreciation",
        value: formatDollarsSigned(Math.round(depTotal)),
        color: depColor,
        sub: "",
        sparkData: yearData.map(y => y.depDiv43 + y.depDiv40),
      }] : []),
      {
        label: isInvestment ? "Total Deductions" : "Total Expenses",
        value: formatDollarsSigned(Math.round(isInvestment ? sy.totalDeductions : sy.ongoingCosts)),
        color: isInvestment ? DEPRECIATION_COLOR : "var(--color-data-negative)",
        sub: "",
        sparkData: yearData.map(y => isInvestment ? y.totalDeductions : y.ongoingCosts),
      },
    ];
  }

  const selectedIndex = selectedYear - 1;

  return (
    <div className={`flex flex-wrap max-[768px]:flex-wrap ${isHovered ? "[&_.kpi-val]:transition-opacity [&_.kpi-val]:duration-150 [&_.kpi-val]:ease-out" : ""}`}>
      {items.map((item, i) => (
        <div
          key={i}
          className={`flex-1 px-6 py-5 flex flex-col gap-2 text-center relative max-[768px]:flex-[1_1_50%] max-[768px]:min-w-[50%] ${
            i > 0
              ? "before:content-[''] before:absolute before:left-0 before:top-[20%] before:bottom-[20%] before:w-px before:bg-border max-[768px]:before:hidden"
              : ""
          }`}
        >
          <div className="mb-1 text-[10px] font-medium tracking-[0.04em] uppercase text-zinc-400/40">{item.label}</div>
          <div className="kpi-val text-lg font-semibold tabular-nums tracking-tight leading-tight" style={{ color: item.color }}>{item.value}</div>
          {item.sparkData && (
            <KpiSparkline
              data={item.sparkData}
              color={item.sparkColor ?? item.color}
              colors={item.sparkColors}
              selectedIndex={selectedIndex}
              stepped={item.sparkStepped}
              onHoverIndex={onHoverYear ? (idx) => onHoverYear(idx === null ? null : idx + 1) : undefined}
              onSelectIndex={onSelectYear ? (idx) => onSelectYear(idx + 1) : undefined}
            />
          )}
        </div>
      ))}
    </div>
  );
}