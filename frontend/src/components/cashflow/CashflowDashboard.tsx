"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, ReferenceLine, ReferenceDot,
  ComposedChart, Area,
} from "recharts";
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { t, CF_COLORS as C, LVR_COLORS } from "@/lib/theme";
import { parseCurrencyInput } from "@/lib/formatters";
import type { ViewMode } from "@/lib/cashflow-types";
import type { useCashflowState } from "@/hooks/useCashflowState";
import CashflowDataTable from "./CashflowDataTable";

interface Props {
  s: ReturnType<typeof useCashflowState>;
  hoveredYear: number | null;
  onHoverYear: (year: number | null) => void;
  onSelectYear: (year: number) => void;
}

type TabMode = "overview" | "details";

const fmt = (v: number) => `$${Math.abs(v).toLocaleString()}`;
const fmtK = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${v < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  return `${v < 0 ? '-' : ''}$${Math.round(abs / 1000)}k`;
};

export default function CashflowDashboard({
  s, hoveredYear, onSelectYear, onHoverYear,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabMode>("overview");
  const [viewMode, setViewMode] = useState<ViewMode>(s.effectiveViewMode);
  const [equityExpanded, setEquityExpanded] = useState(false);
  const [loanExpanded, setLoanExpanded] = useState(false);

  // Watchdog: some fast mouse-outs miss onMouseLeave/onPointerLeave due to
  // React's event batching (a Cell.onMouseEnter can fire AFTER the wrapper's
  // onMouseLeave, re-setting the hover). A document-level mousemove listener
  // checks if the pointer is still over the chart; if not, force-clear.
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (hoveredYear === null) return;
    const handler = (e: MouseEvent) => {
      const rect = chartRef.current?.getBoundingClientRect();
      if (!rect) return;
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inside) onHoverYear(null);
    };
    document.addEventListener("mousemove", handler);
    return () => document.removeEventListener("mousemove", handler);
  }, [hoveredYear, onHoverYear]);

  const YEARS = s.yearData.length;
  const baseYear = new Date().getFullYear();
  const selectedYear = s.selectedYear;
  const displayYear = hoveredYear ?? selectedYear;

  const chartData = s.yearData.map((y) => {
    const rental = s.isInvestment ? y.rentalIncome : 0;
    const depreciation = y.depDiv43 + y.depDiv40;
    return {
      year: y.year,
      name: `Yr ${y.year}`,
      calendarYear: baseYear + y.year - 1,
      cashflow: Math.round(y.netCashflow),
      cashflowMonthly: Math.round(y.netCashflow / 12),
      propertyCashflow: Math.round(y.propertyCashflow),
      propertyCashflowMonthly: Math.round(y.propertyCashflow / 12),
      salary: Math.round(y.salary),
      rentalIncome: Math.round(rental),
      totalIncome: Math.round(y.salary + rental),
      holdingCosts: Math.round(y.ongoingCosts),
      interest: Math.round(y.interestPortion),
      principal: Math.round(y.principalPortion),
      totalCosts: Math.round(y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc),
      depreciation: Math.round(depreciation),
      depDiv43: Math.round(y.depDiv43),
      depDiv40: Math.round(y.depDiv40),
      totalDeductions: Math.round(y.totalDeductions),
      taxPayable: Math.round(y.incomeTaxCalc),
      taxRefund: Math.round(y.taxSaved),
      propertyValue: Math.round(y.propertyValue),
      loanBalance: Math.round(y.loanBalance),
      equity: Math.round(y.netEquity),
      offsetBalance: Math.round(y.offsetBalanceAtYear),
      lvr: y.propertyValue > 0 ? Math.round((y.loanBalance / y.propertyValue) * 100) : 0,
      councilRates: Math.round(y.councilRates),
      waterRates: Math.round(y.waterRates),
      insurance: Math.round(y.insurance),
      landlordInsurance: Math.round(y.landlordInsurance),
      maintenance: Math.round(y.maintenance),
      strataFees: Math.round(y.strataFees),
      managementFee: Math.round(y.managementFee),
    };
  });
  const d = chartData[displayYear - 1] ?? chartData[0];

  const setViewModeBoth = (m: ViewMode) => {
    setViewMode(m);
    s.setViewMode(m);
  };

  // ── Per-view-mode config ─────────────────────────────────────────
  type ChartCfg = {
    dataKey: keyof typeof chartData[number];
    // colors for (sign, state)
    baseColor: (positive: boolean) => string;
    selectedColor: (positive: boolean) => string;
  };

  const chartCfg: Record<ViewMode, ChartCfg> = {
    summary: {
      dataKey: "cashflow",
      baseColor: (p) => p ? C.positive : C.negative,
      selectedColor: (p) => p ? C.teal : C.pink,
    },
    property: {
      dataKey: "propertyCashflow",
      baseColor: (p) => p ? C.positive : C.negative,
      selectedColor: (p) => p ? C.teal : C.pink,
    },
    tax: {
      dataKey: "taxPayable",
      baseColor: () => C.negative,
      selectedColor: () => C.pink,
    },
    equity: {
      dataKey: "equity",
      baseColor: () => C.cyan,
      selectedColor: () => C.cyanLit,
    },
    deductions: {
      dataKey: "totalDeductions",
      baseColor: () => C.purple,
      selectedColor: () => C.purpleLit,
    },
    costs: {
      dataKey: "holdingCosts",
      baseColor: () => C.amber,
      selectedColor: () => C.amberLit,
    },
  };

  const cfg = chartCfg[viewMode];

  const xTicks = (() => {
    const N = chartData.length;
    if (N === 0) return [] as string[];
    return N > 1 ? ["Yr 1", `Yr ${N}`] : ["Yr 1"];
  })();

  // Tight Y-domain so the tallest positive and tallest negative bars both
  // reach the plot edges. Recharts defaults to ['auto', 'auto'] which adds
  // ~5% padding and leaves visible gaps. We always keep 0 in the domain so
  // bars continue to root at the zero baseline (otherwise a positive-only
  // dataset would shift bars off the bottom).
  const yDomain = (() => {
    const values = chartData.map((d) => d[cfg.dataKey] as number);
    if (values.length === 0) return [0, 0] as [number, number];
    return [Math.min(0, ...values), Math.max(0, ...values)] as [number, number];
  })();

  // ── Hero and indicator row per mode ─────────────────────────────
  const heroMonthly = viewMode === "summary"
    ? d.cashflowMonthly
    : viewMode === "property"
    ? d.propertyCashflowMonthly
    : null;

  const heroAnnual = viewMode === "tax"
    ? d.taxPayable
    : viewMode === "equity"
    ? d.equity
    : viewMode === "deductions"
    ? d.totalDeductions
    : viewMode === "property"
    ? d.propertyCashflow
    : viewMode === "costs"
    ? d.holdingCosts
    : d.cashflow;

  const heroLabel = viewMode === "summary" ? "Net Cashflow"
    : viewMode === "property" ? "Property Cashflow"
    : viewMode === "tax" ? "Tax Payable"
    : viewMode === "equity" ? "Net Equity"
    : viewMode === "costs" ? "Costs"
    : "Total Deductions";

  const sideTitle = viewMode === "summary" ? "Household Cashflow"
    : viewMode === "property" ? "Property Cashflow"
    : viewMode === "tax" ? "Tax Payable"
    : viewMode === "equity" ? "Net Equity"
    : viewMode === "costs" ? "Costs"
    : "Total Deductions";

  const chartTitle = viewMode === "summary" ? "Net Cashflow"
    : viewMode === "property" ? "Property Cashflow"
    : viewMode === "tax" ? "Tax Payable"
    : viewMode === "equity" ? "Net Equity Projection"
    : viewMode === "costs" ? "Costs"
    : "Deductions";

  const heroColor = viewMode === "summary"
    ? (d.cashflow >= 0 ? t.data.positive : t.data.negative)
    : viewMode === "property"
    ? (d.propertyCashflow >= 0 ? t.data.positive : t.data.negative)
    : viewMode === "tax"
    ? t.data.negative
    : viewMode === "equity"
    ? C.cyan
    : viewMode === "costs"
    ? C.amber
    : C.purple;

  return (
    <div style={{ color: t.fg.primary }}>

      {/* Tabs Row — primary tabs are view modes; secondary toggle is overview/details */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
        <div className="flex gap-6">
          {(["summary", "property", "tax", "equity", "deductions", "costs"] as ViewMode[]).map((mode) => {
            if (mode === "tax" && !s.isInvestment) return null;
            return (
              <button
                key={mode}
                onClick={() => setViewModeBoth(mode)}
                className="pb-3 -mb-3 text-sm font-medium border-b-2 transition-colors capitalize"
                style={{
                  color: viewMode === mode ? t.fg.primary : t.fg.tertiary,
                  borderColor: viewMode === mode ? t.brand.default : "transparent",
                }}
              >
                {mode}
              </button>
            );
          })}
        </div>

        {/* Overview / Details toggle */}
        <div className="flex gap-1.5">
          {(["overview", "details"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors"
              style={{
                backgroundColor: activeTab === tab ? t.brand.default : "transparent",
                color: activeTab === tab ? t.brand.contrast : t.fg.secondary,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (() => {
        const initialLoan = s.loanAmount || 1;
        const paidPct = Math.max(0, Math.min(100, ((initialLoan - d.loanBalance) / initialLoan) * 100));
        const termYears = parseFloat(s.loanTerm) || 30;
        const firstZeroIdx = s.yearData.findIndex((y) => y.loanBalance < 1);
        const effectivePayoffYear = firstZeroIdx >= 0 ? s.yearData[firstZeroIdx].year : termYears;
        const yearsRemaining = Math.max(0, effectivePayoffYear - displayYear);
        const offsetPct = s.hasOffset ? Math.max(0, Math.min(100 - paidPct, (d.offsetBalance / initialLoan) * 100)) : 0;
        const offsetK = Math.round(d.offsetBalance / 1000);
        const cumulativePaid = Math.max(0, initialLoan - d.loanBalance);
        const lvrTone = d.lvr >= 90 ? LVR_COLORS.high : d.lvr >= 80 ? LVR_COLORS.moderate : LVR_COLORS.safe;
        const initialOffset = s.hasOffset ? parseCurrencyInput(s.offsetBalance) : 0;
        const initialEquity = (s.propertyValue - s.loanAmount) + initialOffset;
        const equityGain = d.equity - initialEquity;
        return (
        <div
          className="grid gap-3.5"
          style={{
            gridTemplateColumns: "1.55fr 1fr",
            gridTemplateRows: "auto 1fr",
            gridTemplateAreas: '"kpi side" "chart side"',
          }}
        >

          {/* KPI Strip */}
          <div
            className="grid grid-cols-2 bg-card border border-border-subtle rounded-xl overflow-hidden"
            style={{ gridArea: "kpi" }}
          >
            <div className="flex flex-col border-r border-border-subtle">
              <div className="px-6 pt-4 pb-5 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase" style={{ color: t.fg.tertiary, letterSpacing: "0.08em" }}>Net Equity</span>
                  <button
                    type="button"
                    onClick={() => setEquityExpanded((v) => !v)}
                    className="p-0.5 rounded transition-colors hover:bg-surface-hover cursor-pointer"
                    aria-label={equityExpanded ? "Collapse" : "Expand"}
                  >
                    <ChevronRight
                      size={14}
                      style={{
                        color: t.fg.tertiary,
                        transform: equityExpanded ? "rotate(90deg)" : "rotate(0)",
                        transition: "transform 180ms ease-out",
                      }}
                    />
                  </button>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className="text-[28px] font-bold tabular-nums leading-none"
                    style={{ color: t.fg.primary, letterSpacing: "-0.02em" }}
                  >
                    {fmt(d.equity)}
                  </span>
                  {equityGain !== 0 && (
                    <span
                      className="text-[12px] font-medium tabular-nums shrink-0 inline-flex items-center gap-0.5"
                      style={{ color: equityGain > 0 ? t.data.positive : t.data.negative }}
                    >
                      {equityGain > 0 ? <ArrowUp size={12} strokeWidth={2.5} /> : <ArrowDown size={12} strokeWidth={2.5} />}
                      {fmtK(Math.abs(equityGain))}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative h-1.5 rounded-full flex-1" style={{ background: "rgba(240, 253, 250, 0.05)" }}>
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-colors"
                      style={{ width: `${Math.min(100, d.lvr)}%`, background: lvrTone }}
                    />
                  </div>
                  <span
                    className="text-[11px] whitespace-nowrap shrink-0 tabular-nums font-medium"
                    style={{ color: lvrTone, opacity: 0.9 }}
                  >
                    {d.lvr}% LVR
                  </span>
                </div>
              </div>
              {equityExpanded && (
                <div className="px-6 pt-4 pb-5 border-t border-border-subtle flex flex-col gap-2.5">
                  <div className="flex justify-between text-[12px]">
                    <span style={{ color: t.fg.tertiary }}>Property Value</span>
                    <span className="tabular-nums" style={{ color: t.fg.primary }}>{fmt(d.propertyValue)}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span style={{ color: t.fg.tertiary }}>Less: Loan</span>
                    <span className="tabular-nums" style={{ color: t.data.negative }}>-{fmt(d.loanBalance)}</span>
                  </div>
                  {d.offsetBalance > 0 && (
                    <div className="flex justify-between text-[12px]">
                      <span style={{ color: t.fg.tertiary }}>Plus: Offset</span>
                      <span className="tabular-nums" style={{ color: t.data.positive }}>+{fmt(d.offsetBalance)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px] font-bold pt-0.5">
                    <span style={{ color: t.fg.primary }}>Net Equity</span>
                    <span className="tabular-nums" style={{ color: t.data.positive }}>{fmt(d.equity)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="px-6 pt-4 pb-5 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase" style={{ color: t.fg.tertiary, letterSpacing: "0.08em" }}>Loan Balance</span>
                  <button
                    type="button"
                    onClick={() => setLoanExpanded((v) => !v)}
                    className="p-0.5 rounded transition-colors hover:bg-surface-hover cursor-pointer"
                    aria-label={loanExpanded ? "Collapse" : "Expand"}
                  >
                    <ChevronRight
                      size={14}
                      style={{
                        color: t.fg.tertiary,
                        transform: loanExpanded ? "rotate(90deg)" : "rotate(0)",
                        transition: "transform 180ms ease-out",
                      }}
                    />
                  </button>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className="text-[28px] font-bold tabular-nums leading-none"
                    style={{ color: t.fg.primary, letterSpacing: "-0.02em" }}
                  >
                    {fmt(d.loanBalance)}
                  </span>
                  {cumulativePaid > 0 && (
                    <span
                      className="text-[12px] font-medium tabular-nums shrink-0 inline-flex items-center gap-0.5"
                      style={{ color: t.data.positive }}
                    >
                      <ArrowDown size={12} strokeWidth={2.5} />
                      {fmtK(cumulativePaid)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative h-1.5 rounded-full flex-1" style={{ background: "rgba(240, 253, 250, 0.05)" }}>
                    <div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{ width: `${paidPct}%`, background: `color-mix(in srgb, ${C.teal} 70%, transparent)` }}
                    />
                    {offsetPct > 0 && (
                      <div
                        className="absolute top-0 h-full rounded-full"
                        style={{ left: `${paidPct}%`, width: `${offsetPct}%`, background: `color-mix(in srgb, ${C.teal} 32%, transparent)` }}
                      />
                    )}
                  </div>
                  <span className="text-[11px] whitespace-nowrap shrink-0 tabular-nums font-medium" style={{ color: C.teal, opacity: 0.9 }}>
                    {paidPct.toFixed(1)}% paid
                  </span>
                </div>
              </div>
              {loanExpanded && (
                <div className="px-6 pt-4 pb-5 border-t border-border-subtle flex flex-col gap-2.5">
                  <div className="flex justify-between text-[12px]">
                    <span style={{ color: t.fg.tertiary }}>Original Loan</span>
                    <span className="tabular-nums" style={{ color: t.fg.primary }}>{fmt(initialLoan)}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span style={{ color: t.fg.tertiary }}>Less: Paid Off</span>
                    <span className="tabular-nums" style={{ color: t.data.positive }}>-{fmt(cumulativePaid)}</span>
                  </div>
                  {d.offsetBalance > 0 && (
                    <div className="flex justify-between text-[12px]">
                      <span style={{ color: t.fg.tertiary }}>Less: Offset</span>
                      <span className="tabular-nums" style={{ color: C.teal }}>-{fmt(d.offsetBalance)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px] font-bold pt-0.5">
                    <span style={{ color: t.fg.primary }}>Loan Balance</span>
                    <span className="tabular-nums" style={{ color: t.fg.primary }}>{fmt(d.loanBalance - (d.offsetBalance > 0 ? d.offsetBalance : 0))}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cashflow Chart */}
          <div
            className="bg-card border border-border-subtle rounded-xl p-5 flex flex-col min-w-0"
            style={{ gridArea: "chart" }}
          >
            <div className="flex items-baseline justify-between mb-3 px-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-[22px] font-semibold tabular-nums leading-none" style={{ color: heroColor, letterSpacing: "-0.01em" }}>
                  {heroAnnual < 0
                    ? `−${fmt(Math.abs(heroAnnual))}`
                    : (viewMode === "summary" || viewMode === "property")
                      ? `+${fmt(heroAnnual)}`
                      : fmt(heroAnnual)}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, letterSpacing: "0.08em" }}>
                  {chartTitle}
                </span>
              </div>
              <div className="text-[14px] tabular-nums flex items-baseline gap-1.5">
                <span className="font-medium" style={{ color: t.brand.default }}>Year {displayYear}</span>
                <span style={{ color: t.fg.tertiary, opacity: 0.6 }}>·</span>
                <span style={{ color: t.fg.tertiary }}>{d.calendarYear}</span>
              </div>
            </div>
            <div
              ref={chartRef}
              className="flex-1 min-h-[280px] [&_*:focus]:outline-none [&_*:focus-visible]:outline-none"
              onMouseLeave={() => onHoverYear(null)}
              onPointerLeave={() => onHoverYear(null)}
              onPointerCancel={() => onHoverYear(null)}
            >
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === "equity" ? (
                  <ComposedChart data={chartData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.cyan} stopOpacity={0.32} />
                        <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: t.chart.axisTick, fontSize: 10 }} ticks={xTicks} interval="preserveStartEnd" />
                    <YAxis hide width={0} domain={yDomain} />
                    <Tooltip cursor={{ stroke: C.cyan, strokeOpacity: 0.25, strokeWidth: 1 }} content={() => null} isAnimationActive={false} />
                    <ReferenceLine
                      x={`Yr ${selectedYear}`}
                      stroke={C.cyan}
                      strokeOpacity={0.35}
                      strokeWidth={1}
                      strokeDasharray="2 3"
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke={C.cyan}
                      strokeWidth={2}
                      fill="url(#equityFill)"
                      isAnimationActive={false}
                      activeDot={{ r: 4, fill: C.cyanLit, stroke: t.card.base, strokeWidth: 2 }}
                    />
                    <ReferenceDot
                      x={`Yr ${selectedYear}`}
                      y={chartData[selectedYear - 1]?.equity ?? 0}
                      r={5}
                      fill={C.cyan}
                      stroke={t.card.base}
                      strokeWidth={2}
                    />
                    <Bar
                      dataKey="equity"
                      fill="rgba(0,0,0,0.001)"
                      isAnimationActive={false}
                      onClick={(_data, index) => {
                        if (typeof index === "number") onSelectYear(index + 1);
                      }}
                      onMouseOver={(_data, index) => {
                        if (typeof index === "number") onHoverYear(index + 1);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </ComposedChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
                    onClick={(e) => {
                      const idx = e?.activeTooltipIndex;
                      if (typeof idx === "number") onSelectYear(idx + 1);
                    }}
                  >
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: t.chart.axisTick, fontSize: 10 }} ticks={xTicks} interval="preserveStartEnd" />
                    <YAxis hide width={0} domain={yDomain} />
                    <Tooltip cursor={{ fill: "transparent" }} content={() => null} isAnimationActive={false} />
                    <Bar dataKey={cfg.dataKey} radius={[2, 2, 0, 0]} isAnimationActive={false}>
                      {chartData.map((entry, index) => {
                        const isSelected = selectedYear === index + 1;
                        const isHovered = hoveredYear === index + 1;
                        const rawValue = entry[cfg.dataKey] as number;
                        const isPositive = rawValue >= 0;
                        return (
                          <Cell
                            key={entry.year}
                            fill={isSelected ? cfg.selectedColor(isPositive) : cfg.baseColor(isPositive)}
                            opacity={isSelected ? 1 : isHovered ? 0.95 : 0.55}
                            style={{ transition: "opacity 120ms ease-out, fill 120ms ease-out", cursor: "pointer" }}
                            onMouseEnter={() => onHoverYear(index + 1)}
                            onClick={() => onSelectYear(index + 1)}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Year Summary Panel */}
          <div
            className="bg-card border border-border-subtle rounded-xl p-5 flex flex-col"
            style={{ gridArea: "side" }}
          >

            {/* Year Navigation Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => onSelectYear(Math.max(1, selectedYear - 1))}
                disabled={selectedYear === 1}
                className="p-1.5 rounded-lg border border-border-default disabled:opacity-30"
              >
                <ChevronLeft size={14} style={{ color: t.fg.secondary }} />
              </button>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold" style={{ color: t.brand.default }}>Year {displayYear}</span>
                <span className="text-sm" style={{ color: t.fg.tertiary }}>|</span>
                <span className="text-sm" style={{ color: t.fg.tertiary }}>{d.calendarYear}</span>
              </div>
              <button
                onClick={() => onSelectYear(Math.min(YEARS, selectedYear + 1))}
                disabled={selectedYear === YEARS}
                className="p-1.5 rounded-lg border border-border-default disabled:opacity-30"
              >
                <ChevronRight size={14} style={{ color: t.fg.secondary }} />
              </button>
            </div>

            {/* Hero */}
            <div className="flex justify-center items-baseline gap-1.5">
              <span className="text-3xl font-medium tabular-nums" style={{ color: heroColor }}>
                {heroMonthly !== null
                  ? `${heroMonthly >= 0 ? "+" : "-"}${fmt(Math.abs(heroMonthly))}`
                  : fmt(heroAnnual)}
              </span>
              {heroMonthly !== null && (
                <span className="text-base" style={{ color: t.fg.tertiary }}>/ Month</span>
              )}
            </div>

            {/* Title (below hero) */}
            <div className="text-center mb-3">
              <span
                className="text-[11px] font-medium uppercase"
                style={{ color: t.fg.tertiary, letterSpacing: "0.08em" }}
              >
                {sideTitle}
              </span>
            </div>

            {/* Breakdown rows pinned to the bottom of the panel */}
            <div className="mt-auto pt-6">
              {viewMode === "summary" && <SummarySections d={d} isInvestment={s.isInvestment} />}
              {viewMode === "property" && <PropertySections d={d} />}
              {viewMode === "tax" && <TaxSections d={d} isInvestment={s.isInvestment} />}
              {viewMode === "equity" && <EquitySections d={d} />}
              {viewMode === "deductions" && <DeductionsSections d={d} />}
              {viewMode === "costs" && <CostsSections d={d} />}
            </div>
          </div>
        </div>
        );
      })()}

      {activeTab === "details" && (
        <CashflowDataTable
          yearData={s.yearData}
          viewMode={s.effectiveViewMode}
          selectedYear={s.selectedYear}
          hoveredYear={hoveredYear}
          isInvestment={s.isInvestment}
          hasOffset={s.hasOffset}
          propertyValue={s.propertyValue}
          onSelectYear={onSelectYear}
          onHoverYear={onHoverYear}
        />
      )}
    </div>
  );
}

// ── Row primitive ─────────────────────────────────────────────
function Row({ label, value, color, bold, negative, note }: {
  label: string;
  value: number;
  color: string;
  bold?: boolean;
  negative?: boolean;
  note?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${bold ? 'text-sm font-bold' : 'text-xs'}`} style={{ color: bold ? t.fg.primary : t.fg.secondary, opacity: bold ? 1 : 0.8 }}>
        {label}
      </span>
      <span className={`tabular-nums ${bold ? 'text-sm font-bold' : 'text-xs font-medium'}`} style={{ color, opacity: bold ? 1 : 0.8 }}>
        {negative && value > 0 ? '-' : ''}{fmt(value)}
        {note && <span className="text-[10px] ml-1" style={{ color: t.fg.tertiary }}>{note}</span>}
      </span>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 pb-4 border-b border-border-subtle flex flex-col gap-2.5 last:mb-0 last:pb-0 last:border-b-0">
      {children}
    </div>
  );
}

// ── Per-mode section bodies ───────────────────────────────────
type D = {
  salary: number; rentalIncome: number; totalIncome: number;
  holdingCosts: number; interest: number; principal: number; totalCosts: number;
  depreciation: number; depDiv43: number; depDiv40: number; totalDeductions: number;
  taxPayable: number; taxRefund: number;
  propertyValue: number; loanBalance: number; equity: number;
  offsetBalance: number; lvr: number;
  councilRates: number; waterRates: number; insurance: number; landlordInsurance: number; maintenance: number; strataFees: number; managementFee: number;
  propertyCashflow: number; cashflow: number;
};

function SummarySections({ d, isInvestment }: { d: D; isInvestment: boolean }) {
  return (
    <>
      <Section>
        <Row label="Salary" value={d.salary} color={t.data.positive} />
        {isInvestment && <Row label="Rental Income" value={d.rentalIncome} color={t.data.positive} />}
        <Row label="Total Income" value={d.totalIncome} color={t.data.positive} bold />
      </Section>
      <Section>
        <Row label="Operating" value={d.holdingCosts} color={t.data.negative} negative />
        <Row label="Interest" value={d.interest} color={t.data.negative} negative />
        <Row label="Principal" value={d.principal} color={t.data.negative} negative />
        <Row label="Tax Paid" value={d.taxPayable} color={t.data.negative} negative />
        <Row label="Total Costs" value={d.totalCosts} color={t.data.negative} bold negative />
      </Section>
      <Section>
        <Row
          label="Net Annual Cashflow"
          value={Math.abs(d.cashflow)}
          color={d.cashflow >= 0 ? t.data.positive : t.data.negative}
          bold
          negative={d.cashflow < 0}
        />
      </Section>
    </>
  );
}

function PropertySections({ d }: { d: D }) {
  return (
    <>
      <Section>
        <Row label="Gross Rent" value={d.rentalIncome} color={t.data.positive} />
      </Section>
      <Section>
        <Row label="Interest" value={d.interest} color={t.data.negative} negative />
        <Row label="Rates & Insurance" value={d.holdingCosts} color={t.data.negative} negative />
      </Section>
      <Section>
        <Row
          label={d.taxRefund >= 0 ? "Tax Benefit" : "Tax Cost"}
          value={Math.abs(d.taxRefund)}
          color={d.taxRefund >= 0 ? t.data.positive : t.data.negative}
        />
      </Section>
      <Section>
        <Row
          label="After Tax (p.a.)"
          value={Math.abs(d.propertyCashflow)}
          color={d.propertyCashflow >= 0 ? t.data.positive : t.data.negative}
          bold
          negative={d.propertyCashflow < 0}
        />
      </Section>
    </>
  );
}

function TaxSections({ d, isInvestment }: { d: D; isInvestment: boolean }) {
  return (
    <>
      <Section>
        <Row label="Salary" value={d.salary} color={t.data.positive} />
        {isInvestment && <Row label="Rental Income" value={d.rentalIncome} color={t.data.positive} />}
      </Section>
      <Section>
        <Row label="Holding Costs" value={d.holdingCosts + d.interest} color={t.data.negative} negative />
        <Row label="Depreciation" value={d.depreciation} color={C.purple} negative />
        <Row label="Total Deductions" value={d.totalDeductions} color={t.data.negative} bold negative />
      </Section>
      <Section>
        <Row label="Tax Payable" value={d.taxPayable} color={t.data.negative} negative />
        <Row
          label={d.taxRefund >= 0 ? "Tax Benefit" : "Tax Cost"}
          value={Math.abs(d.taxRefund)}
          color={d.taxRefund >= 0 ? t.data.positive : t.data.negative}
          bold
        />
      </Section>
    </>
  );
}

function EquitySections({ d }: { d: D }) {
  const lvrColor = d.lvr > 80 ? t.data.negative : d.lvr > 60 ? t.data.warning : t.data.positive;
  return (
    <>
      <Section>
        <Row label="Property Value" value={d.propertyValue} color={t.fg.primary} />
        {d.offsetBalance > 0 && (
          <Row label="Offset Balance" value={d.offsetBalance} color={t.fg.primary} />
        )}
      </Section>
      <Section>
        <Row label="Loan Balance" value={d.loanBalance} color={t.data.negative} negative />
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: t.fg.secondary }}>LVR</span>
          <span className="text-xs tabular-nums font-medium" style={{ color: lvrColor }}>
            {d.lvr}%
          </span>
        </div>
      </Section>
      <Section>
        <Row label="Net Equity" value={d.equity} color={t.data.positive} bold />
      </Section>
    </>
  );
}

function DeductionsSections({ d }: { d: D }) {
  return (
    <>
      <Section>
        <Row label="Interest" value={d.interest} color={t.fg.primary} />
        <Row label="Council Rates" value={d.councilRates} color={t.fg.primary} />
        <Row label="Water Rates" value={d.waterRates} color={t.fg.primary} />
        <Row label="Insurance" value={d.insurance} color={t.fg.primary} />
        <Row label="Maintenance" value={d.maintenance} color={t.fg.primary} />
        {d.strataFees > 0 && <Row label="Strata" value={d.strataFees} color={t.fg.primary} />}
      </Section>
      <Section>
        <Row label="Capital Works (Div 43)" value={d.depDiv43} color={C.purple} />
        <Row label="Plant & Equipment (Div 40)" value={d.depDiv40} color={C.purple} />
      </Section>
      <Section>
        <Row label="Total Deductions" value={d.totalDeductions} color={C.purple} bold />
      </Section>
    </>
  );
}

function CostsSections({ d }: { d: D }) {
  return (
    <>
      <Section>
        {d.councilRates > 0      && <Row label="Council Rates"      value={d.councilRates}      color={t.fg.primary} negative />}
        {d.waterRates > 0        && <Row label="Water Rates"        value={d.waterRates}        color={t.fg.primary} negative />}
        {d.insurance > 0         && <Row label="Building Insurance" value={d.insurance}         color={t.fg.primary} negative />}
        {d.landlordInsurance > 0 && <Row label="Landlord Insurance" value={d.landlordInsurance} color={t.fg.primary} negative />}
        {d.maintenance > 0       && <Row label="Maintenance"        value={d.maintenance}       color={t.fg.primary} negative />}
        {d.strataFees > 0        && <Row label="Strata"             value={d.strataFees}        color={t.fg.primary} negative />}
        {d.managementFee > 0     && <Row label="Management"         value={d.managementFee}     color={t.fg.primary} negative />}
      </Section>
      <Section>
        <Row label="Total Costs" value={d.holdingCosts} color={C.amber} bold negative />
      </Section>
    </>
  );
}
