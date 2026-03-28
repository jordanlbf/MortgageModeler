"use client";

import Link from "next/link";
import { useAdvancedTaxState } from "@/hooks/useAdvancedTaxState";
import { formatCurrencyShort } from "@/lib/formatters";
import { t, mix } from "@/lib/theme";
import Header from "@/components/layout/Header";
import AdvancedColumn from "@/components/tax/AdvancedColumn";
import TaxComposition from "@/components/tax/TaxBreakdown";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

// TODO: replace with API response
const DUMMY = {
  total_tax: 26_967,
  net_income: 73_033,
  marginal_rate: 0.345,
};

// ── KPI Hero Strip ──────────────────────────────

interface KpiHeroStripProps {
  gross: number;
  totalTax: number;
  netIncome: number;
}

function KpiHeroStrip({ gross, totalTax, netIncome }: KpiHeroStripProps) {
  return (
    <div className="mb-6 flex items-start justify-center gap-12 py-7">
        {/* Gross Income */}
        <div className="text-center">
          <div className="mb-[10px] flex h-5 items-start justify-center">
            <span className="text-[14px] font-medium uppercase tracking-[0.16em]" style={{ color: mix("var(--color-foreground)", 35) }}>
              Gross Income
            </span>
          </div>
          <div className="text-[50px] font-semibold tabular-nums leading-none" style={{ color: mix("var(--color-foreground)", 74) }}>
            {formatCurrencyShort(gross)}
          </div>
        </div>

        {/* Minus */}
        <span className="text-[42px] font-light" style={{ color: "rgba(148,163,184,0.35)", marginTop: 30 }}>&minus;</span>

        {/* Tax Deducted */}
        <div className="text-center">
          <div className="mb-[10px] flex h-5 items-start justify-center">
            <span className="text-[14px] font-medium uppercase tracking-[0.16em]" style={{ color: mix("#f87171", 58) }}>
              Tax Deducted
            </span>
          </div>
          <div className="text-[50px] font-semibold tabular-nums leading-none" style={{ color: "#f87171" }}>
            {formatCurrencyShort(totalTax)}
          </div>
        </div>

        {/* Equals */}
        <span className="text-[42px] font-light" style={{ color: "rgba(148,163,184,0.35)", marginTop: 30 }}>=</span>

        {/* Net Income */}
        <div className="text-center">
          <div className="mb-[10px] flex h-5 items-start justify-center">
            <span className="text-[14px] font-medium uppercase tracking-[0.16em]" style={{ color: mix("var(--color-accent)", 58) }}>
              Net Income
            </span>
          </div>
          <div className="text-[50px] font-semibold tabular-nums leading-none" style={{ color: "var(--color-accent)" }}>
            {formatCurrencyShort(netIncome)}
          </div>
        </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────

export default function TaxView() {
  const advanced = useAdvancedTaxState();
  const { taxableIncome, repaymentIncome, mlsIncome } = advanced.incomeMeasures;
  const gross = taxableIncome > 0 ? taxableIncome : DUMMY.total_tax + DUMMY.net_income;
  const effRate = taxableIncome > 0 ? (DUMMY.total_tax / taxableIncome) * 100 : 0;

  return (
    <>
      <Header />

      <div className="flex flex-col px-9 py-6 overflow-hidden" style={{ height: "calc(100vh - 49px)" }}>
        <h1 className="mb-6 text-center text-[2rem] font-semibold tracking-[-0.03em] text-foreground">
          Income Tax Calculator
        </h1>

        <ErrorBoundary>
          <KpiHeroStrip
            gross={gross}
            totalTax={DUMMY.total_tax}
            netIncome={DUMMY.net_income}
          />

          <div className="min-h-0 grid gap-3" style={{ gridTemplateColumns: "1fr 1fr", flex: "0.7" }}>
            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col min-h-0">
              <AdvancedColumn inputs={advanced.inputs} setters={advanced.setters} />
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col min-h-0">
              <TaxComposition
                taxableIncome={taxableIncome}
                totalTax={DUMMY.total_tax}
                netIncome={DUMMY.net_income}
                effectiveRate={effRate}
                marginalRate={DUMMY.marginal_rate * 100}
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
