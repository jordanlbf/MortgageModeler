"use client";

import { useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, ReferenceLine, ReferenceDot,
  ComposedChart, Area,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { t, CF_COLORS as C } from "@/lib/theme";
import { formatDollarsSigned } from "@/lib/formatters";
import type { DashboardView, ViewMode } from "@/lib/cashflow-types";
import type { useCashflowState } from "@/hooks/useCashflowState";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KeyValueList, { KeyValueRow } from "@/components/patterns/blocks/KeyValueList";
import Stat from "@/components/patterns/blocks/Stat";
import SectionCard from "@/components/patterns/cards/SectionCard";
import CashflowDataTable from "./CashflowDataTable";

interface Props {
  s: ReturnType<typeof useCashflowState>;
  /** Overview (KPIs, chart, breakdown) or the year-by-year table; switched from the page bar. */
  view: DashboardView;
  hoveredYear: number | null;
  onHoverYear: (year: number | null) => void;
  onSelectYear: (year: number) => void;
}

const VIEW_MODES: ViewMode[] = ["summary", "property", "tax", "equity", "deductions", "costs"];

/** Unsigned dollars ("$1,234"); callers add the sign. */
const fmt = (v: number) => formatDollarsSigned(Math.abs(v));
/** Signed dollars with an explicit "+" ("+$1,234", "−$1,234"). */
const fmtSigned = (v: number) => (v > 0 ? `+${fmt(v)}` : formatDollarsSigned(v));

/**
 * Cashflow output: one divided card (like the Purchase Costs inputs). View tabs
 * and the year stepper on top; then either the overview (KPI row, chart beside
 * the shown year's breakdown) or the year-by-year table.
 */
export default function CashflowDashboard({
  s, view, hoveredYear, onSelectYear, onHoverYear,
}: Props) {
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
  const viewMode = s.effectiveViewMode;

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


  const kpis = [
    { label: "Monthly cashflow", value: fmtSigned(d.cashflowMonthly), tone: d.cashflow >= 0 ? "positive" : "negative" },
    { label: "Net equity", value: fmt(d.equity), tone: "default" },
    { label: "Loan balance", value: fmt(d.loanBalance), tone: "default" },
    { label: "Loan to value", value: `${d.lvr}%`, tone: "default" },
  ] as const;

  return (
    <SectionCard flush>
      <Tabs variant="underline" value={viewMode} onValueChange={(v) => s.setViewMode(v as ViewMode)}>
        {/* View tabs (left) and year stepper (right) */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border-subtle px-6 pt-3">
          <TabsList aria-label="Cashflow view">
            {VIEW_MODES.map((mode) => {
              if (mode === "tax" && !s.isInvestment) return null;
              return (
                <TabsTrigger key={mode} value={mode} className="capitalize">
                  {mode}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <div className="flex items-center gap-3 pb-3">
            <Button
              variant="outline-icon"
              className="p-1.5"
              aria-label="Previous year"
              onClick={() => onSelectYear(Math.max(1, selectedYear - 1))}
              disabled={selectedYear === 1}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="flex items-baseline gap-1.5 text-[13px] tabular-nums">
              <span className="font-semibold text-brand">Year {displayYear}</span>
              <span className="text-fg-tertiary">· {d.calendarYear}</span>
            </span>
            <Button
              variant="outline-icon"
              className="p-1.5"
              aria-label="Next year"
              onClick={() => onSelectYear(Math.min(YEARS, selectedYear + 1))}
              disabled={selectedYear === YEARS}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        <TabsContent value={viewMode}>
          {view === "details" ? (
            <CashflowDataTable
              yearData={s.yearData}
              viewMode={viewMode}
              selectedYear={selectedYear}
              hoveredYear={hoveredYear}
              isInvestment={s.isInvestment}
              hasOffset={s.hasOffset}
              onSelectYear={onSelectYear}
              onHoverYear={onHoverYear}
            />
          ) : (
            <>
              {/* KPI row for the shown year */}
              <div className="grid grid-cols-2 border-b border-border-subtle lg:grid-cols-4 lg:divide-x lg:divide-border-subtle">
                {kpis.map((k) => (
                  <Stat key={k.label} className="px-6 py-5" size="md" label={k.label} value={k.value} tone={k.tone} />
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
                {/* Chart */}
                <div className="flex min-w-0 flex-col gap-4 p-6">
                  <Label variant="caps" asChild><h2>{chartTitle}</h2></Label>
                  <div
                    ref={chartRef}
                    className="h-[380px] min-w-0 [&_*:focus]:outline-none [&_*:focus-visible]:outline-none"
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

                {/* The shown year: headline figure, then its breakdown */}
                <div className="flex flex-col gap-5 border-t border-border-subtle p-6 xl:border-t-0 xl:border-l">
                  <Stat
                    label={sideTitle}
                    labelAs="h2"
                    size="lg"
                    value={
                      <span style={{ color: heroColor }}>
                        {heroMonthly !== null ? fmtSigned(heroMonthly) : fmt(heroAnnual)}
                        {heroMonthly !== null && (
                          <span className="ml-1.5 text-[14px] font-normal text-fg-tertiary">/ month</span>
                        )}
                      </span>
                    }
                  />
                  <div className="border-t border-border-subtle pt-5">
                    {viewMode === "summary" && <SummarySections d={d} isInvestment={s.isInvestment} />}
                    {viewMode === "property" && <PropertySections d={d} />}
                    {viewMode === "tax" && <TaxSections d={d} isInvestment={s.isInvestment} />}
                    {viewMode === "equity" && <EquitySections d={d} />}
                    {viewMode === "deductions" && <DeductionsSections d={d} />}
                    {viewMode === "costs" && <CostsSections d={d} />}
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </SectionCard>
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
    <KeyValueRow
      label={label}
      total={bold}
      accent={color}
      value={
        <>
          {negative && value > 0 ? '-' : ''}{fmt(value)}
          {note && <span className="ml-1 text-[10px] font-normal text-fg-tertiary">{note}</span>}
        </>
      }
    />
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <KeyValueList className="mb-4 pb-4 border-b border-border-subtle last:mb-0 last:pb-0 last:border-b-0">
      {children}
    </KeyValueList>
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
