"use client";

import { useState } from "react";
import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";
import { estimateAnnualDepreciation } from "@/lib/depreciation-estimate";
import { ModeButton, ModeToggle } from "./shared";

interface Props {
  s: CashflowState;
}

type DepMode = "quick" | "custom";

export default function DepreciationStep({ s }: Props) {
  const [mode, setMode] = useState<DepMode>(
    s.depreciationMode === "detailed" ? "custom" : "quick"
  );

  // Anchor the depreciation estimate to the price at time of purchase
  const depAnchorPrice = s.isNewPurchase
    ? parseCurrencyInput(s.purchasePrice || "")
    : parseCurrencyInput(s.originalPurchasePrice || "");
  const estYear = s.isNewPurchase
    ? new Date().getFullYear()
    : parseInt(s.purchaseYear) || new Date().getFullYear();
  const estAnnual = estimateAnnualDepreciation(depAnchorPrice, s.isNewPurchase, estYear);

  const handleModeChange = (newMode: DepMode) => {
    setMode(newMode);
    s.setDepreciationMode(newMode === "quick" ? "estimate" : "detailed");
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <ModeToggle>
        <ModeButton active={mode === "quick"} onClick={() => handleModeChange("quick")}>
          Quick estimate
        </ModeButton>
        <ModeButton active={mode === "custom"} onClick={() => handleModeChange("custom")}>
          Custom
        </ModeButton>
      </ModeToggle>

      {mode === "quick" ? (
        <QuickEstimateView
          estAnnual={estAnnual}
          depAnchorPrice={depAnchorPrice}
          isNewPurchase={s.isNewPurchase}
        />
      ) : (
        <DetailedView s={s} estYear={estYear} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Quick Estimate View
 * ───────────────────────────────────────────────────────────────────────────── */
function QuickEstimateView({ estAnnual, depAnchorPrice, isNewPurchase }: {
  estAnnual: number;
  depAnchorPrice: number;
  isNewPurchase: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-fg-muted">
        Based on ATO guidelines, we estimate depreciation from your property value. Switch to Custom to enter specific assets.
      </p>

      <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-brand tabular-nums">
            ~{formatDollarsSigned(estAnnual)}/yr
          </span>
          <span className="text-xs text-fg-muted">
            estimated from {formatDollarsSigned(depAnchorPrice)} {isNewPurchase ? "property value" : "purchase price"}
          </span>
        </div>
      </div>

      <p className="text-xs text-fg-muted">
        This is a rough estimate. For accurate depreciation, get a quantity surveyor report and use Custom mode.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Detailed/Custom View
 * ───────────────────────────────────────────────────────────────────────────── */
function DetailedView({ s, estYear }: { s: CashflowState; estYear: number }) {
  // Calculate depreciation totals
  const div43Annual = s.depBuildings.reduce((sum, b) => {
    // 2.5% of construction cost per year (40-year write-off)
    return sum + (b.construction_cost * 0.025);
  }, 0);

  const div40Annual = s.depAssets.reduce((sum, a) => {
    // Diminishing value: 200% / effective life
    const rate = 2 / (a.effective_life_years || 10);
    const baseValue = a.written_down_value || a.cost;
    return sum + (baseValue * rate);
  }, 0);

  const totalAnnual = div43Annual + div40Annual;
  const taxBenefit = totalAnnual * s.marginalRate;

  // Common asset presets for quick adding
  const assetPresets = [
    { name: "Air conditioning", life: 10 },
    { name: "Carpet", life: 8 },
    { name: "Blinds & curtains", life: 6 },
    { name: "Hot water system", life: 12 },
    { name: "Dishwasher", life: 8 },
    { name: "Cooktop & oven", life: 12 },
    { name: "Light fittings", life: 5 },
  ];

  const addPresetAsset = (preset: { name: string; life: number }) => {
    s.setDepAssets([
      ...s.depAssets,
      {
        name: preset.name,
        cost: 0,
        effective_life_years: preset.life,
        purchase_date: `${estYear}-07-01`,
        method: "diminishing_value",
        written_down_value: 0,
      },
    ]);
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-fg-muted">
        Enter your depreciation schedule from a quantity surveyor report, or add items manually.
      </p>

      {/* Buildings (Div 43) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wider uppercase text-fg-muted">
            Buildings (Div 43)
          </span>
          <span className="text-xs text-fg-muted">2.5% p.a. over 40 years</span>
        </div>

        {s.depBuildings.length > 0 && (
          <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
            <div className="flex flex-col gap-2">
              {s.depBuildings.map((b, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={b.name}
                    onChange={(e) => {
                      const next = [...s.depBuildings];
                      next[i] = { ...b, name: e.target.value };
                      s.setDepBuildings(next);
                    }}
                    placeholder="Description"
                    className="flex-1 text-sm bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-brand focus:outline-none py-1 text-fg-secondary placeholder:text-fg-muted/50 transition-colors"
                  />
                  <div className="flex items-center w-32">
                    <input
                      type="text"
                      value={b.construction_cost ? `$${b.construction_cost.toLocaleString()}` : ""}
                      onChange={(e) => {
                        const next = [...s.depBuildings];
                        next[i] = { ...b, construction_cost: parseCurrencyInput(e.target.value) };
                        s.setDepBuildings(next);
                      }}
                      placeholder="$0"
                      className="w-full text-right text-sm tabular-nums bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-brand focus:outline-none py-1 text-fg-secondary placeholder:text-fg-muted/50 transition-colors"
                    />
                  </div>
                  <button
                    className="text-fg-muted hover:text-red-400 transition-colors p-1 text-lg leading-none"
                    onClick={() => {
                      const next = [...s.depBuildings];
                      next.splice(i, 1);
                      s.setDepBuildings(next);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="text-sm text-fg-muted hover:text-brand transition-colors text-left"
          onClick={() =>
            s.setDepBuildings([
              ...s.depBuildings,
              {
                name: "Building structure",
                construction_cost: 0,
                purchase_date: `${estYear}-07-01`,
                construction_start_date: `${estYear - 2}-01-01`,
              },
            ])
          }
        >
          + Add building
        </button>
      </div>

      {/* Assets (Div 40) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wider uppercase text-fg-muted">
            Plant & Equipment (Div 40)
          </span>
          <span className="text-xs text-fg-muted">diminishing value</span>
        </div>

        {s.depAssets.length > 0 && (
          <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
            <div className="flex flex-col gap-2">
              {/* Header row */}
              <div className="flex gap-2 items-center text-[10px] text-fg-muted uppercase tracking-wider pb-1 border-b border-zinc-800/50">
                <span className="flex-1">Item</span>
                <span className="w-24 text-right">Cost</span>
                <span className="w-16 text-right">Life</span>
                <span className="w-6"></span>
              </div>

              {s.depAssets.map((a, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={a.name}
                    onChange={(e) => {
                      const next = [...s.depAssets];
                      next[i] = { ...a, name: e.target.value };
                      s.setDepAssets(next);
                    }}
                    placeholder="Item name"
                    className="flex-1 text-sm bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-brand focus:outline-none py-1 text-fg-secondary placeholder:text-fg-muted/50 transition-colors"
                  />
                  <input
                    type="text"
                    value={a.cost ? `$${a.cost.toLocaleString()}` : ""}
                    onChange={(e) => {
                      const next = [...s.depAssets];
                      const newCost = parseCurrencyInput(e.target.value);
                      next[i] = { ...a, cost: newCost, written_down_value: newCost };
                      s.setDepAssets(next);
                    }}
                    placeholder="$0"
                    className="w-24 text-right text-sm tabular-nums bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-brand focus:outline-none py-1 text-fg-secondary placeholder:text-fg-muted/50 transition-colors"
                  />
                  <div className="w-16 flex items-center justify-end gap-0.5">
                    <input
                      type="text"
                      value={a.effective_life_years || ""}
                      onChange={(e) => {
                        const next = [...s.depAssets];
                        next[i] = { ...a, effective_life_years: parseInt(e.target.value) || 1 };
                        s.setDepAssets(next);
                      }}
                      placeholder="10"
                      className="w-10 text-right text-sm tabular-nums bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-brand focus:outline-none py-1 text-fg-secondary placeholder:text-fg-muted/50 transition-colors"
                    />
                    <span className="text-xs text-fg-muted">yr</span>
                  </div>
                  <button
                    className="w-6 text-fg-muted hover:text-red-400 transition-colors text-lg leading-none"
                    onClick={() => {
                      const next = [...s.depAssets];
                      next.splice(i, 1);
                      s.setDepAssets(next);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add asset button */}
        <button
          className="text-sm text-fg-muted hover:text-brand transition-colors text-left"
          onClick={() =>
            s.setDepAssets([
              ...s.depAssets,
              {
                name: "Asset",
                cost: 0,
                effective_life_years: 10,
                purchase_date: `${estYear}-07-01`,
                method: "diminishing_value",
                written_down_value: 0,
              },
            ])
          }
        >
          + Add asset
        </button>

        {/* Quick add presets */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-fg-muted mr-1">Quick add:</span>
          {assetPresets
            .filter((p) => !s.depAssets.some((a) => a.name === p.name))
            .slice(0, 4)
            .map((preset) => (
              <button
                key={preset.name}
                onClick={() => addPresetAsset(preset)}
                className="text-xs px-2 py-0.5 rounded bg-zinc-800/50 text-fg-muted hover:text-fg-secondary hover:bg-zinc-800 transition-colors"
              >
                {preset.name}
              </button>
            ))}
        </div>
      </div>

      {/* Summary stats - accounting style, full width */}
      <div className="flex flex-col gap-1.5 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-fg-muted text-left">Div 43 (buildings)</span>
          <span className="text-sm text-fg-secondary tabular-nums text-right w-28">
            {formatDollarsSigned(Math.round(div43Annual))}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-fg-muted text-left">Div 40 (plant & equipment)</span>
          <span className="text-sm text-fg-secondary tabular-nums text-right w-28">
            {formatDollarsSigned(Math.round(div40Annual))}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800">
          <span className="text-sm font-medium text-fg-secondary text-left">Total annual depreciation</span>
          <span className="text-sm font-semibold text-brand tabular-nums text-right w-28">
            {formatDollarsSigned(Math.round(totalAnnual))}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-fg-muted text-left">
            Tax benefit ({Math.round(s.marginalRate * 100)}% MTR)
          </span>
          <span className="text-sm text-emerald-400 tabular-nums text-right w-28">
            +{formatDollarsSigned(Math.round(taxBenefit))}
          </span>
        </div>
      </div>
    </div>
  );
}
