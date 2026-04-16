"use client";

import Link from "next/link";
import { useAdvancedTaxState } from "@/hooks/useAdvancedTaxState";
import { formatCurrencyShort } from "@/lib/formatters";
import { t, mix } from "@/lib/theme";
import Header from "@/components/layout/Header";
import AdvancedColumn from "@/components/tax/AdvancedColumn";
import TaxComposition from "@/components/tax/TaxBreakdown";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

// ── Tax Brackets Divider ────────────────────────

function ProgressiveStepsDivider() {
  return (
    <div className="mb-8 flex justify-center">
      <svg width="120" height="24" viewBox="0 0 120 24" fill="none">
        <polyline
          points="0,2 24,2 24,8 48,8 48,14 72,14 72,20 120,20"
          stroke={mix("var(--color-accent)", 35)}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

// ── KPI Hero Strip ──────────────────────────────

interface KpiHeroStripProps {
  gross: number;
  totalTax: number;
  netIncome: number;
}

function KpiHeroStrip({ gross, totalTax, netIncome }: KpiHeroStripProps) {
  return (
    <div className="flex items-start justify-center gap-16 py-7 pb-2">
        {/* Gross Income */}
        <div className="text-center">
          <div className="mb-[10px] flex h-5 items-start justify-center">
            <span className="text-[12px] font-medium uppercase tracking-widest" style={{ color: mix("var(--color-foreground)", 35) }}>
              Gross Income
            </span>
          </div>
          <div className="text-[48px] font-semibold tabular-nums leading-none" style={{ color: mix("var(--color-foreground)", 74) }}>
            {formatCurrencyShort(gross)}
          </div>
        </div>

        {/* Minus */}
        <span className="text-[44px] font-normal" style={{ color: "rgba(148,163,184,0.50)", marginTop: 26 }}>&minus;</span>

        {/* Tax Deducted */}
        <div className="text-center">
          <div className="mb-[10px] flex h-5 items-start justify-center">
            <span className="text-[12px] font-medium uppercase tracking-widest" style={{ color: mix("#f87171", 58) }}>
              Tax Deducted
            </span>
          </div>
          <div className="text-[48px] font-semibold tabular-nums leading-none" style={{ color: "#f87171" }}>
            {formatCurrencyShort(totalTax)}
          </div>
        </div>

        {/* Equals */}
        <span className="text-[44px] font-normal" style={{ color: "rgba(148,163,184,0.50)", marginTop: 26 }}>=</span>

        {/* Net Income */}
        <div className="text-center">
          <div className="mb-[10px] flex h-5 items-start justify-center">
            <span className="text-[12px] font-medium uppercase tracking-widest" style={{ color: mix("var(--color-accent)", 58) }}>
              Net Income
            </span>
          </div>
          <div className="text-[48px] font-semibold tabular-nums leading-none" style={{ color: "var(--color-accent)" }}>
            {formatCurrencyShort(netIncome)}
          </div>
        </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────

export default function TaxView() {
  const advanced = useAdvancedTaxState();
  const { data, error } = advanced;

  const gross = data?.assessable_income ?? 0;
  const totalTax = data?.total_tax ?? 0;
  const netIncome = data?.net_income ?? 0;
  const effRate = data ? data.effective_rate * 100 : 0;
  const marginalRate = data ? data.marginal_rate * 100 : 0;
  const taxableIncome = data?.taxable_income ?? 0;

  return (
    <>
      <Header />

      {error && (
        <div className="max-w-5xl mx-auto px-6 pt-4">
          <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-[14px] text-red-400/80">
            {error}
          </div>
        </div>
      )}

      <div className="flex flex-col px-9 py-6 overflow-hidden" style={{ height: "calc(100vh - 49px)" }}>
        <div className="mb-6 flex flex-col items-center gap-1">
          <h1 className="text-[44px] font-semibold tracking-[-0.04em] text-foreground">
            Income Tax <span style={{ color: "var(--color-accent)" }}>Calculator</span>
          </h1>
        </div>

        <ProgressiveStepsDivider />

        <ErrorBoundary>
          <KpiHeroStrip
            gross={gross}
            totalTax={totalTax}
            netIncome={netIncome}
          />

          <div className="mb-4 flex items-center justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1 w-1 rounded-full"
                style={{ background: mix("var(--color-accent)", 30) }}
              />
            ))}
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col min-h-0">
              <AdvancedColumn inputs={advanced.inputs} setters={advanced.setters} />
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col min-h-0">
              <TaxComposition
                taxableIncome={taxableIncome}
                totalTax={totalTax}
                netIncome={netIncome}
                effectiveRate={effRate}
                marginalRate={marginalRate}
                incomeTax={data?.income_tax ?? 0}
                medicareLevy={data?.medicare_levy ?? 0}
                medicareLevySurcharge={data?.medicare_levy_surcharge ?? 0}
                hecsRepayment={data?.hecs_repayment ?? 0}
              />
            </div>
          </div>

          {/* Footer link */}
          <Link
            href="/"
            className="group mt-auto flex items-center justify-center gap-2 py-4 text-[14px] font-medium tracking-wide text-muted/30 no-underline transition-colors duration-300 hover:text-accent/70"
          >
            <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">&larr;</span>
            Return to Dashboard
          </Link>
        </ErrorBoundary>
      </div>
    </>
  );
}
