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
      <Header>
        <Link
          href="/"
          className="text-[10px] font-semibold uppercase tracking-[0.1em] no-underline transition-colors"
          style={{ color: "rgba(148,163,184,0.4)" }}
        >
          &larr; Back
        </Link>
      </Header>

      <div
        className="grid px-9 py-4 overflow-hidden"
        style={{
          height: "calc(100vh - 49px)",
          minHeight: 580,
          gridTemplateRows: "auto auto 1fr 2fr",
          gap: 10,
        }}
      >
        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-2 text-[12px] text-red-400">{error}</div>
        )}

        <ErrorBoundary>
          {/* ROW 1 — Input strip */}
          <GlassCard className="flex items-stretch" style={CARD_BORDER}>
            <div className="flex-[2] px-5 py-3">
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
                className="flex-1 px-5 py-3"
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
              className="flex shrink-0 flex-col justify-center gap-3 px-5 py-3"
              style={{ borderLeft: `1px solid ${t.border.default}` }}
            >
              <Toggle label="HECS debt" checked={hecsOn} onChange={setters.setHecsOn} />
              <Toggle label="Private health" checked={phi} onChange={setters.setPhi} />
            </div>
          </GlassCard>

          {/* ROW 2 — KPI cards */}
          <TaxKpiCards data={data} gross={gross} />

          {/* ROW 3 — Progress bars (fills 1fr) */}
          <div className="min-h-0">
            <ProgressBars data={data} gross={gross} />
          </div>

          {/* ROW 4 — Donut chart (fills 2fr) */}
          <div className="min-h-0">
            <DonutChart data={data} gross={gross} effRate={derived.effRate} monthly={derived.monthly} />
          </div>
        </ErrorBoundary>
      </div>
    </>
  );
}
