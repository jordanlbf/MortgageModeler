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
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Layers, Target, Play, Pause } from "lucide-react";
import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { formatCurrencyCf } from "@/lib/cashflow-calculations";

interface Props {
  chartData: { year: number; value: number }[];
  yearData: YearData[];
  viewMode: ViewMode;
  selectedYear: number;
  hoveredYear: number | null;
  isInvestment: boolean;
  onSelectYear: (year: number) => void;
  onHoverYear: (year: number | null) => void;
}

type ChartView = "bars" | "stacked" | "comparison";

const chartViews = [
  { id: "bars" as const, label: "Growth", icon: TrendingUp },
  { id: "stacked" as const, label: "Breakdown", icon: Layers },
  { id: "comparison" as const, label: "Compare", icon: Target },
];

export default function CashflowChart({
  chartData, yearData, viewMode, selectedYear,
  isInvestment, onSelectYear,
}: Props) {
  const [chartView, setChartView] = useState<ChartView>("bars");
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationYear, setAnimationYear] = useState(1);

  // Whether this mode supports sub-views (Breakdown/Compare)
  const hasSubViews = viewMode === "equity";

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

  const chartModeLabel = viewMode === "summary" ? "Net Cashflow"
    : viewMode === "property" ? "Property Cashflow"
    : viewMode === "equity" ? "Net Equity"
    : isInvestment ? "Total Deductions" : "Total Expenses";

  // Colours per mode
  const barColor = viewMode === "deductions" ? "#a78bfa" : "#2dd4bf";
  const barColorDark = viewMode === "deductions" ? "#7c3aed" : "#0d9488";
  const barColorSelected = viewMode === "deductions" ? "#c4b5fd" : "#5eead4";

  const formatYAxis = (value: number) => {
    const abs = Math.abs(value);
    const sign = value < 0 ? "\u2212" : "";
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}m`;
    if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}k`;
    return `$${value}`;
  };

  const handleBarClick = (data: unknown) => {
    const entry = data as { year?: number };
    if (entry?.year) onSelectYear(entry.year);
  };

  const startAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
      return;
    }
    setIsAnimating(true);
    setAnimationYear(1);
    onSelectYear(1);
    let year = 1;
    const interval = setInterval(() => {
      year++;
      if (year > 30) {
        setIsAnimating(false);
        clearInterval(interval);
        return;
      }
      setAnimationYear(year);
      onSelectYear(year);
    }, 200);
  };

  // Effective chart view — force "bars" for non-equity modes
  const effectiveChartView = hasSubViews ? chartView : "bars";

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
              <span className="cf-tooltip-label" style={{ color: "var(--cf-accent)", fontWeight: 500 }}>Net CF/mo</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-accent)" }}>{formatCurrencyCf(Math.round(d.netCashflow / 12))}</span>
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
              <span className="cf-tooltip-label" style={{ color: "var(--cf-accent)", fontWeight: 500 }}>Property CF/mo</span>
              <span className="cf-tooltip-value" style={{ color: "var(--cf-accent)" }}>{formatCurrencyCf(Math.round(d.propertyCashflow / 12))}</span>
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
              <span className="cf-tooltip-value" style={{ color: "#f87171" }}>−{formatCurrencyCf(Math.round(d.loanBalance))}</span>
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
    <section className="cf-chart-section" style={{ padding: "16px" }}>
      {/* Chart controls */}
      <div className="cf-chart-bar">
        <div className="cf-chart-sub-tabs">
          {chartViews.map((view) => {
            const Icon = view.icon;
            const isActive = effectiveChartView === view.id;
            const isDisabled = !hasSubViews && view.id !== "bars";
            return (
              <button
                key={view.id}
                onClick={() => !isDisabled && setChartView(view.id)}
                className={`cf-chart-sub-tab ${isActive ? "active" : ""}`}
                style={isDisabled ? { opacity: 0.3, cursor: "default" } : undefined}
              >
                <Icon size={14} />
                {view.label}
              </button>
            );
          })}
        </div>
        <button
          className={`cf-play-btn ${isAnimating ? "cf-play-active" : ""}`}
          onClick={startAnimation}
        >
          {isAnimating ? <Pause size={14} /> : <Play size={14} />}
          {isAnimating ? `Year ${animationYear}` : "Play Timeline"}
        </button>
      </div>

      {/* Chart */}
      <div style={{ height: "280px", marginTop: "8px" }}>
        <ResponsiveContainer width="100%" height="100%">
          {effectiveChartView === "bars" ? (
            <BarChart
              data={rechartsData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={(data) => data?.activePayload && handleBarClick(data.activePayload[0]?.payload)}
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
                <linearGradient id="barGradNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 13 }}
                interval={4}
              />
              <YAxis
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 13 }}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} className="cursor-pointer">
                {rechartsData.map((entry) => (
                  <Cell
                    key={entry.year}
                    fill={
                      entry.value < 0
                        ? "url(#barGradNeg)"
                        : entry.year === selectedYear
                          ? "url(#barGradSelected)"
                          : "url(#barGrad)"
                    }
                    opacity={entry.year === selectedYear ? 1 : 0.7}
                    className="transition-all duration-200 hover:opacity-100"
                  />
                ))}
              </Bar>
              <ReferenceLine
                x={`Yr ${selectedYear}`}
                stroke={barColor}
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
            </BarChart>
          ) : effectiveChartView === "stacked" ? (
            <ComposedChart
              data={rechartsData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={(data) => data?.activePayload && handleBarClick(data.activePayload[0]?.payload)}
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
              onClick={(data) => data?.activePayload && handleBarClick(data.activePayload[0]?.payload)}
            >
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 13 }} interval={4} />
              <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 13 }} width={60} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="netEquity" radius={[4, 4, 0, 0]} opacity={0.8}>
                {rechartsData.map((entry) => (
                  <Cell key={entry.year} fill={entry.year === selectedYear ? "#5eead4" : "#2dd4bf"} opacity={entry.year === selectedYear ? 1 : 0.6} />
                ))}
              </Bar>
              <Bar dataKey="loanBalance" radius={[4, 4, 0, 0]} opacity={0.5}>
                {rechartsData.map((entry) => (
                  <Cell key={entry.year} fill={entry.year === selectedYear ? "#f87171" : "#ef4444"} opacity={entry.year === selectedYear ? 0.8 : 0.4} />
                ))}
              </Bar>
              <ReferenceLine x={`Yr ${selectedYear}`} stroke="#2dd4bf" strokeDasharray="3 3" strokeOpacity={0.5} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Timeline slider */}
      <div className="cf-timeline">
        <div className="cf-timeline-track">
          <input
            type="range" min={1} max={30} value={selectedYear}
            onChange={(e) => onSelectYear(Number(e.target.value))}
            className="cf-timeline-slider"
          />
        </div>
        <div className="cf-timeline-labels">
          <span>Year 1</span>
          <span>Year 15</span>
          <span>Year 30</span>
        </div>
        <div className="cf-timeline-legend">
          <div className="cf-legend-item">
            <span className="cf-legend-dot" style={viewMode === "deductions" ? { background: "#a78bfa" } : undefined} />
            <span>{chartModeLabel}</span>
          </div>
          {effectiveChartView !== "bars" && (
            <>
              <div className="cf-legend-item">
                <span className="cf-legend-dot" style={{ background: "#ef4444", opacity: 0.6 }} />
                <span>Loan Balance</span>
              </div>
              {effectiveChartView === "stacked" && (
                <div className="cf-legend-item">
                  <span className="cf-legend-dot" style={{ background: "rgba(45,212,191,0.3)", border: "1px solid #2dd4bf" }} />
                  <span>Property Value</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}