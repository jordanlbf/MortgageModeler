"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { t, CF_COLORS as C, LVR_COLORS } from "@/lib/theme";
import { parseCurrencyInput } from "@/lib/formatters";
import type { ViewMode } from "@/lib/cashflow-types";
import type { useCashflowState } from "@/hooks/useCashflowState";
import CashflowDataTable from "./CashflowDataTable";

interface Props {
  s: ReturnType<typeof useCashflowState>;
  hoveredYear: number | null;
  tableExpanded: Set<number>;
  onHoverYear: (year: number | null) => void;
  onSelectYear: (year: number) => void;
  onManualExpand: (expanded: Set<number>) => void;
}

type TabMode = "overview" | "details";

const fmt = (v: number) => `$${Math.abs(v).toLocaleString()}`;
const fmtK = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${v < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  return `${v < 0 ? '-' : ''}$${Math.round(abs / 1000)}k`;
};

export default function CashflowDashboard({
  s, hoveredYear, tableExpanded, onSelectYear, onHoverYear, onManualExpand,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabMode>("overview");
  const [viewMode, setViewMode] = useState<ViewMode>(s.effectiveViewMode);

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
      maintenance: Math.round(y.maintenance),
      strataFees: Math.round(y.strataFees),
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
  };

  const cfg = chartCfg[viewMode];

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
    : d.cashflow;

  const heroLabel = viewMode === "summary" ? "Net Cashflow"
    : viewMode === "property" ? "Property Cashflow"
    : viewMode === "tax" ? "Tax Payable"
    : viewMode === "equity" ? "Net Equity"
    : "Total Deductions";

  const chartTitle = viewMode === "summary" ? "Annual Net Cashflow"
    : viewMode === "property" ? "Annual Property Cashflow"
    : viewMode === "tax" ? "Annual Tax Payable"
    : viewMode === "equity" ? "Net Equity Projection"
    : "Annual Deductions";

  const heroColor = viewMode === "summary"
    ? (d.cashflow >= 0 ? t.data.positive : t.data.negative)
    : viewMode === "property"
    ? (d.propertyCashflow >= 0 ? t.data.positive : t.data.negative)
    : viewMode === "tax"
    ? t.data.negative
    : viewMode === "equity"
    ? C.cyan
    : C.purple;

  return (
    <div className="bg-surface-app p-6" style={{ color: t.fg.primary }}>

      {/* Tabs Row */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
        <div className="flex gap-6">
          {(["overview", "details"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="pb-3 -mb-3 text-sm font-medium border-b-2 transition-colors capitalize"
              style={{
                color: activeTab === tab ? t.fg.primary : t.fg.tertiary,
                borderColor: activeTab === tab ? t.brand.default : "transparent",
              }}
            >
              {tab === "details" ? `Details ${YEARS} Years` : tab}
            </button>
          ))}
        </div>

        {/* View Mode Pills */}
        {activeTab === "overview" && (
          <div className="flex gap-1.5">
            {(["summary", "property", "tax", "equity", "deductions"] as ViewMode[]).map((mode) => {
              if (mode === "tax" && !s.isInvestment) return null;
              return (
                <button
                  key={mode}
                  onClick={() => setViewModeBoth(mode)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors"
                  style={{
                    backgroundColor: viewMode === mode ? t.brand.default : "transparent",
                    color: viewMode === mode ? t.brand.contrast : t.fg.secondary,
                  }}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        )}
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
            <div className="px-[22px] py-[18px] border-r border-border-subtle">
              <div className="flex items-baseline justify-between gap-2 mb-3.5">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-[26px] font-medium tabular-nums leading-none" style={{ color: t.fg.primary, letterSpacing: "-0.01em" }}>{fmt(d.equity)}</span>
                  <span className="text-[13px]" style={{ color: t.fg.tertiary }}>Net Equity</span>
                </div>
                {equityGain !== 0 && (
                  <span className="text-[12px] font-medium tabular-nums shrink-0" style={{ color: equityGain > 0 ? t.data.positive : t.data.negative }}>
                    {equityGain > 0 ? "↑" : "↓"} {fmtK(Math.abs(equityGain))}
                  </span>
                )}
              </div>
              <div className="relative h-1 rounded-sm mb-3" style={{ background: "rgba(240, 253, 250, 0.06)" }}>
                <div
                  className="absolute left-0 top-0 h-full rounded-sm transition-colors"
                  style={{ width: `${Math.min(100, d.lvr)}%`, background: lvrTone }}
                />
                <div
                  className="absolute w-px"
                  style={{ top: "-3px", height: "10px", left: "80%", background: t.fg.secondary, opacity: 0.8 }}
                />
              </div>
              <div className="flex justify-between items-baseline text-[12px] mt-1">
                <span style={{ color: lvrTone, opacity: 0.85 }}>{d.lvr}% LVR</span>
                <span style={{ color: t.fg.tertiary }}>
                  {fmtK(d.propertyValue)} <span style={{ opacity: 0.7 }}>value</span>
                </span>
              </div>
            </div>
            <div className="px-[22px] py-[18px]">
              <div className="flex items-baseline justify-between gap-2 mb-3.5">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-[26px] font-medium tabular-nums leading-none" style={{ color: t.fg.primary, letterSpacing: "-0.01em" }}>{fmt(d.loanBalance)}</span>
                  <span className="text-[13px]" style={{ color: t.fg.tertiary }}>Loan Balance</span>
                </div>
                {cumulativePaid > 0 && (
                  <span className="text-[12px] font-medium tabular-nums shrink-0" style={{ color: t.data.positive }}>
                    ↓ {fmtK(cumulativePaid)}
                  </span>
                )}
              </div>
              <div className="relative h-1 rounded-sm mb-3" style={{ background: "rgba(240, 253, 250, 0.06)" }}>
                <div
                  className="absolute left-0 top-0 h-full rounded-sm"
                  style={{ width: `${paidPct}%`, background: `color-mix(in srgb, ${C.teal} 65%, transparent)` }}
                />
                {offsetPct > 0 && (
                  <div
                    className="absolute top-0 h-full rounded-sm"
                    style={{ left: `${paidPct}%`, width: `${offsetPct}%`, background: `color-mix(in srgb, ${C.teal} 30%, transparent)` }}
                  />
                )}
              </div>
              <div className="flex justify-between items-baseline text-[12px] mt-1">
                <span style={{ color: t.fg.secondary }}>
                  {paidPct.toFixed(1)}% paid
                  {offsetPct > 0 && (
                    <span style={{ color: C.teal, opacity: 0.8 }}> · ${offsetK}k offset</span>
                  )}
                </span>
                <span style={{ color: t.fg.tertiary }}>{yearsRemaining}y left</span>
              </div>
            </div>
          </div>

          {/* Cashflow Chart */}
          <div
            className="bg-card border border-border-subtle rounded-xl p-4 flex flex-col min-w-0"
            style={{ gridArea: "chart" }}
          >
            <div className="flex items-baseline gap-2.5 mb-3 px-1">
              <span className="text-[16px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary }}>
                {chartTitle}
              </span>
              <span style={{ color: t.fg.tertiary }}>|</span>
              <span className="text-xs" style={{ color: t.fg.secondary }}>Year {displayYear}</span>
              <span className="text-xs font-medium tabular-nums" style={{ color: heroColor }}>
                {heroAnnual < 0
                  ? `−${fmt(Math.abs(heroAnnual))}`
                  : (viewMode === "summary" || viewMode === "property")
                    ? `+${fmt(heroAnnual)}`
                    : fmt(heroAnnual)}
              </span>
            </div>
            <div
              className="h-[280px] [&_*:focus]:outline-none [&_*:focus-visible]:outline-none"
              onMouseLeave={() => onHoverYear(null)}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  onClick={(e) => {
                    const idx = e?.activeTooltipIndex;
                    if (typeof idx === "number") onSelectYear(idx + 1);
                  }}
                >
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: t.chart.axisTick, fontSize: 9 }} interval={4} />
                  <YAxis tickFormatter={fmtK} axisLine={false} tickLine={false} tick={{ fill: t.chart.axisTick, fontSize: 9 }} width={40} />
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
              </ResponsiveContainer>
            </div>
          </div>

          {/* Year Summary Panel */}
          <div
            className="bg-card border border-border-subtle rounded-xl p-5 flex flex-col"
            style={{ gridArea: "side" }}
          >

            {/* Year Navigation Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => onSelectYear(Math.max(1, selectedYear - 1))}
                disabled={selectedYear === 1}
                className="p-1.5 rounded-lg border border-border-default disabled:opacity-30"
              >
                <ChevronLeft size={14} style={{ color: t.fg.secondary }} />
              </button>
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: t.brand.default }}>Year {displayYear}</div>
                <div className="text-xs" style={{ color: t.fg.tertiary }}>{d.calendarYear}</div>
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
            <div className="p-2 mb-3 flex flex-col items-center gap-0.5">
              {heroMonthly !== null ? (
                <>
                  <span className="text-3xl font-medium tabular-nums" style={{ color: heroColor }}>
                    {heroMonthly >= 0 ? '+' : '-'}{fmt(Math.abs(heroMonthly))}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary }}>
                    Household Monthly Cashflow
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-medium tabular-nums" style={{ color: heroColor }}>
                    {fmt(heroAnnual)}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary }}>
                    {heroLabel}
                  </span>
                </>
              )}
            </div>

            {viewMode === "summary" && <SummarySections d={d} isInvestment={s.isInvestment} />}
            {viewMode === "property" && <PropertySections d={d} />}
            {viewMode === "tax" && <TaxSections d={d} isInvestment={s.isInvestment} />}
            {viewMode === "equity" && <EquitySections d={d} />}
            {viewMode === "deductions" && <DeductionsSections d={d} />}
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
          expandedMilestones={tableExpanded}
          onExpandedChange={onManualExpand}
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
  councilRates: number; waterRates: number; insurance: number; maintenance: number; strataFees: number;
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
