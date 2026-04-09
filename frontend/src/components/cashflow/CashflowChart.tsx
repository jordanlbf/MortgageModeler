"use client";

import React from "react";
import { TrendingUp, Layers, Target } from "lucide-react";
import type { ViewMode, YearData } from "@/lib/cashflow-types";
import { formatCurrencyCf, formatChartLabel } from "@/lib/cashflow-calculations";

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

export default function CashflowChart({
  chartData, yearData, viewMode, selectedYear, hoveredYear,
  isInvestment, onSelectYear, onHoverYear,
}: Props) {
  const svgW = 540, svgH = 220;
  const mL = 45, mR = 12, mT = 20, mB = 26;
  const plotW = svgW - mL - mR;
  const plotH = svgH - mT - mB;
  const slotW = plotW / 30;

  const vals = chartData.map(d => d.value);
  const dataMin = Math.min(...vals, 0);
  const dataMax = Math.max(...vals, 0);
  const range = dataMax - dataMin || 1;
  const pad = range * 0.12;
  const yMin = dataMin - pad;
  const yMax = dataMax + pad;
  const mapY = (v: number) => mT + (1 - (v - yMin) / (yMax - yMin)) * plotH;
  const zeroY = mapY(0);

  const ySteps = 4;
  const yTicks = Array.from({ length: ySteps + 1 }, (_, i) => yMin + (yMax - yMin) * i / ySteps);
  const xLabels = [1, 5, 10, 15, 20, 25, 30];

  const hy = hoveredYear !== null ? yearData[hoveredYear - 1] : null;

  const chartModeLabel = viewMode === "summary" ? "Net Cashflow"
    : viewMode === "property" ? "Property Cashflow"
    : viewMode === "equity" ? "Net Equity"
    : isInvestment ? "Total Deductions" : "Total Expenses";

  return (
    <section className="cf-chart-section">
      {/* Chart sub-mode tabs */}
      <div className="cf-chart-bar">
        <div className="cf-chart-sub-tabs">
          <button className="cf-chart-sub-tab active">
            <TrendingUp size={12} />
            Growth
          </button>
          <button className="cf-chart-sub-tab">
            <Layers size={12} />
            Breakdown
          </button>
          <button className="cf-chart-sub-tab">
            <Target size={12} />
            Compare
          </button>
        </div>
        <button
          className="cf-play-btn"
          onClick={() => {
            let yr = 1;
            const interval = setInterval(() => {
              onSelectYear(yr);
              yr++;
              if (yr > 30) clearInterval(interval);
            }, 120);
          }}
        >
          ▷ Play Timeline
        </button>
      </div>

      {/* Chart SVG */}
      <div style={{ padding: "4px 20px 16px", position: "relative" }}>
        <div style={{ position: "relative", width: "100%", aspectRatio: `${svgW} / ${svgH}` }}>
          <svg style={{ width: "100%", height: "100%" }} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="barGradPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="1" />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="barGradNeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(239,68,68,0.15)" stopOpacity="1" />
                <stop offset="100%" stopColor="rgba(239,68,68,0.5)" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="barGradPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.15" />
              </linearGradient>
            </defs>

            {/* Horizontal dotted grid lines */}
            {yTicks.map((v, i) => {
              const y = mapY(v);
              const dots: React.ReactElement[] = [];
              for (let x = mL; x <= svgW - mR; x += 14) {
                dots.push(<circle key={x} cx={x} cy={y} r={0.6} fill="rgba(255,255,255,0.06)" />);
              }
              return <g key={i}>{dots}</g>;
            })}

            {/* Zero line */}
            {dataMin < 0 && dataMax > 0 && (
              <line x1={mL} x2={svgW - mR} y1={zeroY} y2={zeroY}
                stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            )}

            {/* Bars */}
            {chartData.map((d, i) => {
              const cx = mL + slotW * i + slotW / 2;
              const barW = slotW * 0.6;
              const x = cx - barW / 2;
              const barTop = d.value >= 0 ? mapY(d.value) : zeroY;
              const barBot = d.value >= 0 ? zeroY : mapY(d.value);
              const barHeight = Math.max(2, barBot - barTop);
              const isActive = d.year === selectedYear;
              const isHovered = d.year === hoveredYear;
              const r = 3;

              const barFill = (() => {
                if (viewMode === "equity") return "url(#barGradPos)";
                if (viewMode === "deductions") return "url(#barGradPurple)";
                return d.value >= 0 ? "url(#barGradPos)" : "url(#barGradNeg)";
              })();

              const topR = d.value >= 0 ? r : 0;
              const botR = d.value >= 0 ? 0 : r;

              return (
                <g key={d.year}>
                  <path
                    d={`M${x + topR},${barTop} h${barW - topR * 2} a${topR},${topR} 0 0 1 ${topR},${topR} v${barHeight - topR - botR} a${botR},${botR} 0 0 1 ${-botR},${botR} h${-(barW - botR * 2)} a${botR},${botR} 0 0 1 ${-botR},${-botR} v${-(barHeight - topR - botR)} a${topR},${topR} 0 0 1 ${topR},${-topR} z`}
                    fill={barFill}
                    opacity={isActive || isHovered ? 1 : 0.6} />
                  <rect x={mL + slotW * i} y={mT} width={slotW} height={plotH}
                    fill="transparent" cursor="pointer"
                    onClick={() => onSelectYear(d.year)}
                    onMouseEnter={() => onHoverYear(d.year)}
                    onMouseLeave={() => onHoverYear(null)} />
                </g>
              );
            })}

            {/* Crossover marker */}
            {(viewMode === "summary" || viewMode === "property") && (() => {
              const crossIdx = chartData.findIndex(cd => cd.value >= 0);
              if (crossIdx <= 0 || dataMin >= 0) return null;
              const cx = mL + slotW * (crossIdx - 0.5) + slotW / 2;
              return (
                <g>
                  <polygon points={`${cx - 4},${zeroY + 10} ${cx + 4},${zeroY + 10} ${cx},${zeroY + 4}`}
                    fill="#2dd4bf" opacity={0.7} />
                  <text x={cx} y={zeroY + 20} textAnchor="middle"
                    fill="#2dd4bf" fontSize="7" fontFamily="inherit" fontWeight="500">
                    Crossover
                  </text>
                </g>
              );
            })()}

            {/* Y-axis labels */}
            {yTicks.map((v, i) => (
              <text key={i} x={mL - 8} y={mapY(v) + 3} textAnchor="end"
                fill="#71717a" fontSize="8" fontFamily="inherit" fontWeight="500"
                style={{ userSelect: "none" }}>
                {formatChartLabel(v)}
              </text>
            ))}

            {/* X-axis labels */}
            {xLabels.map(y => (
              <text key={y} x={mL + slotW * (y - 1) + slotW / 2} y={svgH - 8} textAnchor="middle"
                fill={selectedYear === y ? "#2dd4bf" : "#71717a"}
                fontSize="7" fontFamily="inherit" fontWeight={selectedYear === y ? "600" : "400"}
                style={{ userSelect: "none" }}>
                Yr {y}
              </text>
            ))}
          </svg>

          {/* Hover tooltip anchored to bar top */}
          {hoveredYear !== null && hy && (() => {
            const hd = chartData[hoveredYear - 1];
            const barTopPct = ((hd.value >= 0 ? mapY(hd.value) : zeroY) / svgH) * 100;
            return (
              <div
                className="cf-chart-tooltip visible"
                style={{
                  left: `${((mL + slotW * (hoveredYear - 1) + slotW / 2) / svgW) * 100}%`,
                  top: `${barTopPct}%`,
                  transform: "translate(-50%, -100%)",
                  marginTop: "-8px",
                }}
              >
                <div style={{ marginBottom: "4px", fontWeight: 600, color: "var(--cf-text)" }}>Year {hoveredYear}</div>
                {viewMode === "summary" && (
                  <>
                    <div style={{ color: "var(--cf-text-muted)" }}>Rental Income: {formatCurrencyCf(Math.round(hy.rentalIncome))}</div>
                    <div style={{ color: "var(--cf-text-muted)" }}>Holding Costs: {formatCurrencyCf(Math.round(hy.totalExpenses))}</div>
                    <div style={{ color: "var(--cf-text-muted)" }}>Tax Saved: {formatCurrencyCf(Math.round(hy.taxSaved))}</div>
                    <div style={{ color: "var(--cf-accent)", fontWeight: 600 }}>Net CF/mo: {formatCurrencyCf(Math.round(hy.netCashflow / 12))}</div>
                  </>
                )}
                {viewMode === "property" && (
                  <>
                    {isInvestment && <div style={{ color: "var(--cf-text-muted)" }}>Rent: {formatCurrencyCf(Math.round(hy.rentalIncome))}</div>}
                    <div style={{ color: "var(--cf-text-muted)" }}>Costs: {formatCurrencyCf(Math.round(hy.interestPortion + hy.ongoingCosts))}</div>
                    {isInvestment && <div style={{ color: "#a78bfa" }}>Gearing: {formatCurrencyCf(Math.round(hy.gearing))}</div>}
                    <div style={{ color: "var(--cf-accent)", fontWeight: 600 }}>Property CF/mo: {formatCurrencyCf(Math.round(hy.propertyCashflow / 12))}</div>
                  </>
                )}
                {viewMode === "equity" && (
                  <>
                    <div style={{ color: "var(--cf-text-muted)" }}>Property: {formatCurrencyCf(Math.round(hy.propertyValue))}</div>
                    <div style={{ color: "var(--cf-text-muted)" }}>Loan: {formatCurrencyCf(Math.round(-hy.loanBalance))}</div>
                    {hy.offsetBalanceAtYear > 0 && <div style={{ color: "var(--cf-text-muted)" }}>Offset: {formatCurrencyCf(Math.round(hy.offsetBalanceAtYear))}</div>}
                    <div style={{ color: "var(--cf-accent)", fontWeight: 600 }}>Net Equity: {formatCurrencyCf(Math.round(hy.netEquity))}</div>
                  </>
                )}
                {viewMode === "deductions" && isInvestment && (
                  <>
                    <div style={{ color: "var(--cf-text-muted)" }}>Interest: {formatCurrencyCf(Math.round(hy.interestPortion))}</div>
                    <div style={{ color: "var(--cf-text-muted)" }}>Ongoing: {formatCurrencyCf(Math.round(hy.ongoingCosts))}</div>
                    <div style={{ color: "var(--cf-text-muted)" }}>Depreciation: {formatCurrencyCf(Math.round(hy.depDiv43 + hy.depDiv40))}</div>
                    <div style={{ color: "#a78bfa", fontWeight: 600 }}>Total: {formatCurrencyCf(Math.round(hy.totalDeductions))}</div>
                  </>
                )}
                {viewMode === "deductions" && !isInvestment && (
                  <>
                    <div style={{ color: "var(--cf-text-muted)" }}>Rates: {formatCurrencyCf(Math.round(hy.councilRates + hy.waterRates))}</div>
                    <div style={{ color: "var(--cf-text-muted)" }}>Insurance: {formatCurrencyCf(Math.round(hy.insurance))}</div>
                    <div style={{ color: "var(--cf-text-muted)" }}>Maint: {formatCurrencyCf(Math.round(hy.maintenance + hy.strataFees))}</div>
                    <div style={{ color: "#a78bfa", fontWeight: 600 }}>Total: {formatCurrencyCf(Math.round(hy.ongoingCosts))}</div>
                  </>
                )}
                <div className="cf-tooltip-caret" />
              </div>
            );
          })()}
        </div>
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
          <span className="cf-legend-dot" />
          {chartModeLabel}
        </div>
      </div>
    </section>
  );
}
