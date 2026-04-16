"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Area,
} from "recharts";
import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { CF_COLORS as C } from "@/lib/theme";

export type ChartView = "bars" | "stacked" | "comparison";

interface Props {
  chartData: { year: number; value: number }[];
  yearData: YearData[];
  viewMode: ViewMode;
  selectedYear: number;
  hoveredYear: number | null;
  isInvestment: boolean;
  chartView?: ChartView;
  onSelectYear: (year: number) => void;
  onHoverYear: (year: number | null) => void;
}

export default function CashflowChart({
  chartData, yearData, viewMode, selectedYear, hoveredYear,
  isInvestment, chartView = "bars", onSelectYear, onHoverYear,
}: Props) {

  /* Recharts types `activeTooltipIndex` as string|number and bar data as
     BarRectangleItem which lacks custom keys — cast helpers keep the JSX clean. */
  const idxFromState = (s: Record<string, unknown>) => {
    const idx = Number(s?.activeTooltipIndex);
    return Number.isFinite(idx) && idx >= 0 && idx < (yearData?.length ?? 0) ? idx : null;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yearFromBar = (d: any): number | undefined => d?.year;

  // Build recharts-compatible data
  const rechartsData = useMemo(() => yearData.map((y, i) => ({
    name: `Yr ${y.year}`,
    year: y.year,
    value: chartData[i]?.value ?? 0,
    propertyValue: y.propertyValue,
    loanBalance: y.loanBalance,
    netEquity: y.netEquity,
    rentalIncome: y.rentalIncome,
    totalExpenses: y.totalExpenses,
    taxSaved: y.taxSaved,
    netCashflow: y.netCashflow,
    propertyCashflow: y.propertyCashflow,
    interestPortion: y.interestPortion,
    ongoingCosts: y.ongoingCosts,
    gearing: y.gearing,
    totalDeductions: y.totalDeductions,
    depDiv43: y.depDiv43,
    depDiv40: y.depDiv40,
    offsetBalanceAtYear: y.offsetBalanceAtYear,
    councilRates: y.councilRates,
    waterRates: y.waterRates,
    insurance: y.insurance,
    maintenance: y.maintenance,
    strataFees: y.strataFees,
    holdingCosts: y.interestPortion + y.ongoingCosts,
    depTotal: y.depDiv43 + y.depDiv40,
  })), [yearData, chartData]);

  // Colours per mode
  const isCashflow = viewMode === "summary" || viewMode === "property";
  const barColor = isCashflow ? C.positive : C.teal;
  const barColorDark = isCashflow ? C.positiveDark : C.tealDark;
  const barColorSelected = isCashflow ? C.positiveLit : C.tealLit;

  const formatYAxis = (value: number) => {
    const abs = Math.abs(value);
    const sign = value < 0 ? "\u2212" : "";
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}m`;
    if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}k`;
    return `$${value}`;
  };

  return (
    <section className="overflow-hidden bg-transparent w-full min-w-0 outline-none [&:focus]:outline-none">
      {/* Chart — constrained width, centered */}
      <div className="relative w-full h-[238px] outline-none border-none [&_*:focus]:!outline-none [&_*:focus-visible]:!outline-none [&_*:focus-visible]:!shadow-none" onMouseLeave={() => onHoverYear(null)}>
        <ResponsiveContainer width="100%" height="100%">
          {/* Gradient Bars with hover */}
          {chartView === "bars" ? (
            <BarChart
              data={rechartsData}
              margin={{ top: 16, right: 24, left: 0, bottom: 0 }}
              onMouseMove={(state: Record<string, unknown>) => {
                const idx = idxFromState(state);
                if (idx != null) onHoverYear(rechartsData[idx].year);
              }}
              onMouseLeave={() => onHoverYear(null)}
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barColor} stopOpacity={1} />
                  <stop offset="100%" stopColor={barColorDark} stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="barGradSelected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barColorSelected} stopOpacity={1} />
                  <stop offset="100%" stopColor={barColor} stopOpacity={1} />
                </linearGradient>
                <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barColor} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={barColorDark} stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="barGradNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.negative} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={C.negativeDark} stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: C.axisTick, fontSize: 11 }}
                interval={4}
              />
              <YAxis
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={{ fill: C.axisTick, fontSize: 11 }}
                width={50}
              />
              <Tooltip content={() => null} cursor={{ fill: "transparent" }} isAnimationActive={false} />
              <Bar
                dataKey="value"
                radius={[3, 3, 0, 0]}
                className="cursor-pointer"
                onClick={(data) => {
                  const year = yearFromBar(data);
                  if (year) onSelectYear(year);
                }}
              >
                {rechartsData.map((entry) => {
                  const isSelected = entry.year === selectedYear;
                  const isHovered = entry.year === hoveredYear;
                  let fill = "url(#barGrad)";
                  let opacity = 0.5;
                  if (entry.value < 0) {
                    fill = "url(#barGradNeg)";
                    opacity = isSelected ? 1 : isHovered ? 0.8 : 0.5;
                  } else if (isSelected) {
                    fill = "url(#barGradSelected)";
                    opacity = 1;
                  } else if (isHovered) {
                    fill = "url(#barGradHover)";
                    opacity = 0.85;
                  }
                  return (
                    <Cell key={entry.year} fill={fill} opacity={opacity} />
                  );
                })}
              </Bar>
            </BarChart>
          ) : chartView === "stacked" ? (
            <ComposedChart
              data={rechartsData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onMouseMove={(state) => { const idx = idxFromState(state as Record<string, unknown>); if (idx != null) onHoverYear(rechartsData[idx].year); }}
              onMouseLeave={() => onHoverYear(null)}
              onClick={(state) => { const idx = idxFromState(state as Record<string, unknown>); if (idx != null) onSelectYear(rechartsData[idx].year); }}
            >
              <defs>
                <linearGradient id="loanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.negative} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={C.negativeDark} stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="equityAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.teal} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={C.teal} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: C.axisTick, fontSize: 13 }} interval={4} />
              <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fill: C.axisTick, fontSize: 13 }} width={60} />

              <Tooltip content={() => null} cursor={{ fill: "transparent" }} isAnimationActive={false} />
              <Area type="monotone" dataKey="propertyValue" stroke={C.teal} strokeWidth={2} fill="url(#equityAreaGradient)" />
              <Area type="monotone" dataKey="loanBalance" stroke={C.negative} strokeWidth={2} fill="url(#loanGradient)" />
            </ComposedChart>
          ) : viewMode === "deductions" ? (
            /* Deductions compare: Holding Costs (amber) vs Depreciation (purple) */
            <ComposedChart
              data={rechartsData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onMouseMove={(state) => { const idx = idxFromState(state as Record<string, unknown>); if (idx != null) onHoverYear(rechartsData[idx].year); }}
              onMouseLeave={() => onHoverYear(null)}
              onClick={(state) => { const idx = idxFromState(state as Record<string, unknown>); if (idx != null) onSelectYear(rechartsData[idx].year); }}
            >
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: C.axisTick, fontSize: 13 }} interval={4} />
              <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fill: C.axisTick, fontSize: 13 }} width={60} />
              <Tooltip content={() => null} cursor={{ fill: "transparent" }} isAnimationActive={false} />
              <Bar dataKey="holdingCosts" radius={[4, 4, 0, 0]}
                onMouseEnter={(data) => { const yr = yearFromBar(data); if (yr) onHoverYear(yr); }}
                onMouseLeave={() => onHoverYear(null)}
              >
                {rechartsData.map((entry) => (
                  <Cell key={entry.year} fill={entry.year === selectedYear ? C.amberLit : entry.year === hoveredYear ? C.amberLit : C.amber} opacity={entry.year === selectedYear ? 1 : entry.year === hoveredYear ? 0.85 : 0.6} />
                ))}
              </Bar>
              <Bar dataKey="depTotal" radius={[4, 4, 0, 0]}
                onMouseEnter={(data) => { const yr = yearFromBar(data); if (yr) onHoverYear(yr); }}
                onMouseLeave={() => onHoverYear(null)}
              >
                {rechartsData.map((entry) => (
                  <Cell key={entry.year} fill={entry.year === selectedYear ? C.purpleLit : entry.year === hoveredYear ? C.purpleLit : C.purple} opacity={entry.year === selectedYear ? 1 : entry.year === hoveredYear ? 0.85 : 0.5} />
                ))}
              </Bar>
            </ComposedChart>
          ) : (
            /* Equity compare: Net Equity (teal) vs Loan Balance (red) */
            <ComposedChart
              data={rechartsData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onMouseMove={(state) => { const idx = idxFromState(state as Record<string, unknown>); if (idx != null) onHoverYear(rechartsData[idx].year); }}
              onMouseLeave={() => onHoverYear(null)}
              onClick={(state) => { const idx = idxFromState(state as Record<string, unknown>); if (idx != null) onSelectYear(rechartsData[idx].year); }}
            >
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: C.axisTick, fontSize: 13 }} interval={4} />
              <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fill: C.axisTick, fontSize: 13 }} width={60} />
              <Tooltip content={() => null} cursor={{ fill: "transparent" }} isAnimationActive={false} />
              <Bar dataKey="netEquity" radius={[4, 4, 0, 0]} opacity={0.8}
                onMouseEnter={(data) => { const yr = yearFromBar(data); if (yr) onHoverYear(yr); }}
                onMouseLeave={() => onHoverYear(null)}
              >
                {rechartsData.map((entry) => (
                  <Cell key={entry.year} fill={entry.year === selectedYear ? C.tealLit : entry.year === hoveredYear ? C.tealLit : C.teal} opacity={entry.year === selectedYear ? 1 : entry.year === hoveredYear ? 0.85 : 0.6} />
                ))}
              </Bar>
              <Bar dataKey="loanBalance" radius={[4, 4, 0, 0]} opacity={0.5}
                onMouseEnter={(data) => { const yr = yearFromBar(data); if (yr) onHoverYear(yr); }}
                onMouseLeave={() => onHoverYear(null)}
              >
                {rechartsData.map((entry) => (
                  <Cell key={entry.year} fill={entry.year === selectedYear ? C.negativeLit : entry.year === hoveredYear ? C.negativeLit : C.negative} opacity={entry.year === selectedYear ? 0.8 : entry.year === hoveredYear ? 0.65 : 0.4} />
                ))}
              </Bar>
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

    </section>
  );
}
