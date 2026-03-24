"use client";

import Link from "next/link";
import { t } from "@/lib/theme";
import { formatCurrencyShort } from "@/lib/formatters";
import { parseCurrency } from "@/lib/constants";
import { useTaxState } from "@/hooks/useTaxState";
import Header from "@/components/layout/Header";
import GlassCard from "@/components/ui/GlassCard";
import Slider from "@/components/ui/Slider";
import Toggle from "@/components/ui/Toggle";
import TaxKpiCards from "@/components/tax/TaxKpiCards";
import { ProgressBars, DonutChart } from "@/components/tax/TaxBreakdown";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const CARD_BORDER = { borderTopWidth: 3, borderTopColor: t.accentBorder };

export default function TaxView() {
  const { inputs, setters, data, derived, error } = useTaxState();
  const { gross, hecsOn, hecsBal, phi } = inputs;

  return (
    <>
      <Header />

      <div
        className="grid px-12 py-4 overflow-hidden"
        style={{
          height: "calc(100vh - 49px)",
          minHeight: 580,
          gridTemplateRows: "auto 1fr 1.8fr auto",
          gap: 12,
        }}
      >
        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-2 text-[12px] text-red-400">{error}</div>
        )}

        <ErrorBoundary>
          {/* ROW 1 — Input strip */}
          <GlassCard className="flex items-stretch" style={CARD_BORDER}>
            <div className="flex-[2] px-6 py-3.5">
              <Slider
                label="Gross income"
                value={gross}
                display={formatCurrencyShort(gross)}
                min={0}
                max={500_000}
                step={1000}
                onChange={setters.setGross}
                editable
                parseDisplay={parseCurrency}
              />
            </div>

            {hecsOn && (
              <div
                className="flex-1 px-6 py-3.5"
                style={{ borderLeft: `1px solid ${t.border.default}` }}
              >
                <Slider
                  label="HECS balance"
                  value={hecsBal}
                  display={formatCurrencyShort(hecsBal)}
                  min={0}
                  max={100_000}
                  step={1000}
                  onChange={setters.setHecsBal}
                  editable
                  parseDisplay={parseCurrency}
                  accent="#a78bfa"
                />
              </div>
            )}

            <div
              className="flex shrink-0 flex-col justify-center gap-3.5 px-6 py-3.5"
              style={{ borderLeft: `1px solid ${t.border.default}` }}
            >
              <Toggle label="HECS debt" checked={hecsOn} onChange={setters.setHecsOn} />
              <Toggle label="Private health" checked={phi} onChange={setters.setPhi} />
            </div>
          </GlassCard>

          {/* ROW 2 — Progress bars */}
          <div className="min-h-0">
            <ProgressBars data={data} gross={gross} />
          </div>

          {/* ROW 3 — Donut (2/3) + KPI stack (1/3) */}
          <div className="flex min-h-0" style={{ gap: 12 }}>
            <div className="flex-[2] min-h-0 min-w-0">
              <DonutChart
                data={data}
                gross={gross}
                effRate={derived.effRate}
                marginalRate={data?.marginal_rate ?? 0}
                monthly={derived.monthly}
              />
            </div>
            <div className="flex-1 min-h-0 min-w-0">
              <TaxKpiCards data={data} gross={gross} />
            </div>
          </div>

          {/* ROW 4 — Footer link */}
          <Link
            href="/"
            className="group flex items-center justify-center gap-2 py-4 text-[13px] font-medium tracking-wide text-muted/30 no-underline transition-colors duration-300 hover:text-accent/70"
          >
            <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">&larr;</span>
            Return to Dashboard
          </Link>
        </ErrorBoundary>
      </div>
    </>
  );
}
