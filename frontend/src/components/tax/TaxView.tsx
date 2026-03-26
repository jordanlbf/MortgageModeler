"use client";

import Link from "next/link";
import { useAdvancedTaxState } from "@/hooks/useAdvancedTaxState";
import Header from "@/components/layout/Header";
import AdvancedColumn from "@/components/tax/AdvancedColumn";
import TaxDonutBreakdown from "@/components/tax/TaxBreakdown";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default function TaxView() {
  const advanced = useAdvancedTaxState();

  return (
    <>
      <Header />

      <div className="flex flex-col px-9 py-4 overflow-hidden" style={{ height: "calc(100vh - 49px)" }}>
        {/* Page title */}
        <h1 className="mb-8 text-center text-[2.5rem] font-semibold tracking-[-0.035em] text-foreground">
          Income Tax Calculator
        </h1>

        <ErrorBoundary>
          <div className="flex-1 min-h-0 grid gap-3 content-start" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col min-h-0">
              <AdvancedColumn inputs={advanced.inputs} setters={advanced.setters} />
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col min-h-0">
              <TaxDonutBreakdown
                taxableIncome={advanced.incomeMeasures.taxableIncome}
                repaymentIncome={advanced.incomeMeasures.repaymentIncome}
                mlsIncome={advanced.incomeMeasures.mlsIncome}
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
