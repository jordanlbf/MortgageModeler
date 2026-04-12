"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  ReferenceLine,
  Area,
} from "recharts";
import { TrendingUp, Layers, Target } from "lucide-react";
import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { formatCurrencyCf } from "@/lib/cashflow-calculations";

export type ChartView = "bars" | "stacked" | "comparison";

export const chartViewOptions = [
  { id: "bars" as const, label: "Growth", icon: TrendingUp },
  { id: "stacked" as const, label: "Breakdown", icon: Layers },
  { id: "comparison" as const, label: "Compare", icon: Target },
];

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


  // Build recharts-compatible data
  const rechartsData = yearData.map((y, i) => ({
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
  }));

  // Colours per mode
  const barColor = viewMode === "deductions" ? "#a78bfa" : viewMode === "equity" ? "#2dd4bf" : "#4ade80";
  const barColorDark = viewMode === "deductions" ? "#7c3aed" : "#0d9488";
  const barColorSelected = viewMode === "deductions" ? "#c4b5fd" : "#5eead4";

  const formatYAxis = (value: number) => {
    const abs = Math.abs(value);
    const sign = value < 0 ? "\u2212" : "";
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}m`;
    if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}k`;
    return `$${value}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof rechartsData[0] }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const baseYear = new Date().getFullYear();
    return (
      <div className="cf-chart-tooltip visible">
        <div className="cf-tooltip-header">
          <span className="cf-tooltip-label">Year {d.year}</span>
          <span className="cf-tooltip-label" style={{ fontSize: "12px" }}>{baseYear + d.year - 1}</span>
        </div>
        {viewMode === "summary" && (
          <div>
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label">Rental Income</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.rentalIncome))}</span>
            </div>
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label">Holding Costs</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.totalExpenses))}</span>
            </div>
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label">Tax Saved</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.taxSaved))}</span>
            </div>
            <div className="cf-tooltip-divider" />
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label" style={{ color: "var(--cf-positive)", fontWeight: 500 }}>Net CF/mo</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-positive)" }}>{formatCurrencyCf(Math.round(d.netCashflow / 12))}</span>
            </div>
          </div>
        )}
        {viewMode === "property" && (
          <div>
            {isInvestment && (
              <div className="cf-tooltip-row">
                <span className="cf-tooltip-label">Rent</span>
                <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.rentalIncome))}</span>
              </div>
            )}
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label">Costs</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.interestPortion + d.ongoingCosts))}</span>
            </div>
            {isInvestment && (
              <div className="cf-tooltip-row">
                <span className="cf-tooltip-label">Gearing</span>
                <span className="cf-tooltip-value" style={{ color: "#a78bfa" }}>{formatCurrencyCf(Math.round(d.gearing))}</span>
              </div>
            )}
            <div className="cf-tooltip-divider" />
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label" style={{ color: "var(--cf-positive)", fontWeight: 500 }}>Property CF/mo</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-positive)" }}>{formatCurrencyCf(Math.round(d.propertyCashflow / 12))}</span>
            </div>
          </div>
        )}
        {viewMode === "equity" && (
          <div>
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label">Property Value</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.propertyValue))}</span>
            </div>
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label">Loan Balance</span>
              <span className="cf-tooltip-value" style={{ color: "#f87171" }}>��{formatCurrencyCf(Math.round(d.loanBalance))}</span>
            </div>
            {d.offsetBalanceAtYear > 0 && (
              <div className="cf-tooltip-row">
                <span className="cf-tooltip-label">Offset</span>
                <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.offsetBalanceAtYear))}</span>
              </div>
            )}
            <div className="cf-tooltip-divider" />
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label" style={{ color: "var(--cf-accent)", fontWeight: 500 }}>Net Equity</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-accent)" }}>{formatCurrencyCf(Math.round(d.netEquity))}</span>
            </div>
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label" style={{ fontSize: "12px" }}>LVR</span>
              <span className="cf-tooltip-label" style={{ fontSize: "12px" }}>{(d.loanBalance / d.propertyValue * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
        {viewMode === "deductions" && isInvestment && (
          <div>
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label">Interest</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.interestPortion))}</span>
            </div>
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label">Ongoing</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.ongoingCosts))}</span>
            </div>
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label">Depreciation</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.depDiv43 + d.depDiv40))}</span>
            </div>
            <div className="cf-tooltip-divider" />
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label" style={{ color: "#a78bfa", fontWeight: 500 }}>Total</span>
              <span className="cf-tooltip-value" style={{ color: "#a78bfa" }}>{formatCurrencyCf(Math.round(d.totalDeductions))}</span>
            </div>
          </div>
        )}
        {viewMode === "deductions" && !isInvestment && (
          <div>
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label">Rates</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.councilRates + d.waterRates))}</span>
            </div>
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label">Insurance</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.insurance))}</span>
            </div>
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label">Maint</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-text)" }}>{formatCurrencyCf(Math.round(d.maintenance + d.strataFees))}</span>
            </div>
            <div className="cf-tooltip-divider" />
            <div className="cf-tooltip-row">
              <span className="cf-tooltip-label" style={{ color: "#a78bfa", fontWeight: 500 }}>Total</span>
              <span className="cf-tooltip-value" style={{ color: "#a78bfa" }}>{formatCurrencyCf(Math.round(d.ongoingCosts))}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="cf-chart-section">
      {/* Chart — constrained width, centered */}
      <div className="cf-chart-wrapper" onMouseLeave={() => onHoverYear(null)}>
        <ResponsiveContainer width="100%" height="100%">
          {/* Gradient Bars with hover */}
          {chartView === "bars" ? (
            <BarChart
              data={rechartsData}
              margin={{ top: 16, right: 24, left: 0, bottom: 0 }}
              onMouseMove={(state) => {
                const year = (state?.activePayload?.[0]?.payload as { year?: number })?.year;
                if (year) onHoverYear(year);
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
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 11 }}
                interval={4}
              />
              <YAxis
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 11 }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar
                dataKey="value"
                radius={[3, 3, 0, 0]}
                className="cursor-pointer"
                onClick={(data) => {
                  if (data?.year) {
                    onSelectYear(data.year);
                  }
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
              <ReferenceLine
                x={`Yr ${selectedYear}`}
                stroke={barColor}
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />
              {hoveredYear && hoveredYear !== selectedYear && (
                <ReferenceLine
                  x={`Yr ${hoveredYear}`}
                  stroke={barColor}
                  strokeDasharray="2 2"
                  strokeOpacity={0.25}
                />
              )}
            </BarChart>
          ) : chartView === "stacked" ? (
            <ComposedChart
              data={rechartsData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={(state) => { const year = (state?.activePayload?.[0]?.payload as { year?: number })?.year; if (year) onSelectYear(year); }}
            >
              <defs>
                <linearGradient id="loanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="equityAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 13 }} interval={4} />
              <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 13 }} width={60} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Area type="monotone" dataKey="propertyValue" stroke="#2dd4bf" strokeWidth={2} fill="url(#equityAreaGradient)" />
              <Area type="monotone" dataKey="loanBalance" stroke="#ef4444" strokeWidth={2} fill="url(#loanGradient)" />
              <ReferenceLine x={`Yr ${selectedYear}`} stroke="#2dd4bf" strokeDasharray="3 3" strokeOpacity={0.5} />
            </ComposedChart>
          ) : (
            <ComposedChart
              data={rechartsData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={(state) => { const year = (state?.activePayload?.[0]?.payload as { year?: number })?.year; if (year) onSelectYear(year); }}
            >
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 13 }} interval={4} />
              <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 13 }} width={60} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="netEquity" radius={[4, 4, 0, 0]} opacity={0.8}
                onMouseEnter={(data) => {
                  if (data?.year) onHoverYear(data.year);
                }}
                onMouseLeave={() => onHoverYear(null)}
              >
                {rechartsData.map((entry) => (
                  <Cell key={entry.year} fill={entry.year === selectedYear ? "#5eead4" : entry.year === hoveredYear ? "#5eead4" : "#2dd4bf"} opacity={entry.year === selectedYear ? 1 : entry.year === hoveredYear ? 0.85 : 0.6} />
                ))}
              </Bar>
              <Bar dataKey="loanBalance" radius={[4, 4, 0, 0]} opacity={0.5}
                onMouseEnter={(data) => {
                  if (data?.year) onHoverYear(data.year);
                }}
                onMouseLeave={() => onHoverYear(null)}
              >
                {rechartsData.map((entry) => (
                  <Cell key={entry.year} fill={entry.year === selectedYear ? "#f87171" : entry.year === hoveredYear ? "#f87171" : "#ef4444"} opacity={entry.year === selectedYear ? 0.8 : entry.year === hoveredYear ? 0.65 : 0.4} />
                ))}
              </Bar>
              <ReferenceLine x={`Yr ${selectedYear}`} stroke="#2dd4bf" strokeDasharray="3 3" strokeOpacity={0.5} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

    </section>
  );
}
