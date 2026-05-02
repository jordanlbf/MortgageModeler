"use client";

import { useState } from "react";
import type { CashflowState } from "@/hooks/useCashflowState";
import { Checkbox, currencyInput, EditableRow, InputField, ModeButton, ModeToggle } from "./shared";
import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";

interface Props {
  s: CashflowState;
}

type CostMode = "quick" | "custom";

export default function CostsStep({ s }: Props) {
  const [mode, setMode] = useState<CostMode>("quick");

  // Calculate property value for estimates
  const propertyValue = s.isNewPurchase
    ? parseCurrencyInput(s.purchasePrice || "")
    : parseCurrencyInput(s.currentValue || "");

  // Quick estimate defaults (typical % of property value or flat amounts)
  const estimates = {
    councilRates: Math.round(propertyValue * 0.002), // ~0.2% of property value
    waterRates: 1200,
    insurance: Math.round(propertyValue * 0.002), // ~0.2% of property value
    landlordInsurance: 1500,
    maintenance: 0.5, // % of property value
    annualCostGrowthRate: 2.5,
    strataFees: 800,
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <ModeToggle>
        <ModeButton active={mode === "quick"} onClick={() => setMode("quick")}>
          Quick estimate
        </ModeButton>
        <ModeButton active={mode === "custom"} onClick={() => setMode("custom")}>
          Custom
        </ModeButton>
      </ModeToggle>

      {mode === "quick" ? (
        <QuickEstimateView s={s} estimates={estimates} />
      ) : (
        <CustomCostsView s={s} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Quick Estimate View - Editable inline estimates
 * ───────────────────────────────────────────────────────────────────────────── */
function QuickEstimateView({ s, estimates }: {
  s: CashflowState;
  estimates: Record<string, number>;
}) {
  // Use form state if set, otherwise fall back to estimates
  const councilRates = parseCurrencyInput(s.councilRates || "") || estimates.councilRates;
  const waterRates = parseCurrencyInput(s.waterRates || "") || estimates.waterRates;
  const insurance = parseCurrencyInput(s.insurance || "") || estimates.insurance;
  const landlordInsurance = parseCurrencyInput(s.landlordInsurance || "") || estimates.landlordInsurance;
  const maintenance = parseFloat(s.maintenance || "") || estimates.maintenance;
  const strataFees = parseCurrencyInput(s.strataFees || "") || estimates.strataFees;

  const propertyValue = s.isNewPurchase
    ? parseCurrencyInput(s.purchasePrice || "")
    : parseCurrencyInput(s.currentValue || "");
  const maintenanceAnnual = Math.round(propertyValue * (maintenance / 100));
  const strataAnnual = strataFees * 4;

  const totalAnnual =
    councilRates +
    waterRates +
    insurance +
    maintenanceAnnual +
    (s.isInvestment ? landlordInsurance : 0) +
    (s.hasStrata ? strataAnnual : 0);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-fg-muted">
        We&apos;ve estimated typical costs. Edit any value below or switch to Custom for more options.
      </p>

      <Checkbox checked={s.hasStrata} onChange={s.setHasStrata}>
        Include strata / body corp
      </Checkbox>

      {/* Editable costs table */}
      <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
        <div className="flex flex-col gap-2">
          <EditableRow label="Council rates" value={s.councilRates} onChange={s.setCouncilRates} placeholder={formatDollarsSigned(estimates.councilRates)} />
          <EditableRow label="Water rates" value={s.waterRates} onChange={s.setWaterRates} placeholder={formatDollarsSigned(estimates.waterRates)} />
          <EditableRow label="Building insurance" value={s.insurance} onChange={s.setInsurance} placeholder={formatDollarsSigned(estimates.insurance)} />
          {s.isInvestment && (
            <EditableRow label="Landlord insurance" value={s.landlordInsurance} onChange={s.setLandlordInsurance} placeholder={formatDollarsSigned(estimates.landlordInsurance)} />
          )}
          <EditableRow label="Maintenance %" value={s.maintenance} onChange={s.setMaintenance} placeholder={String(estimates.maintenance)} isPercent />
          {s.hasStrata && (
            <EditableRow label="Strata (quarterly)" value={s.strataFees} onChange={s.setStrataFees} placeholder={formatDollarsSigned(estimates.strataFees)} />
          )}
        </div>
      </div>

      {/* Total annual costs - px-4 to align with table content */}
      <div className="flex items-baseline justify-between px-4">
        <span className="text-sm font-medium text-fg-secondary">Total annual costs</span>
        <span className="text-sm font-semibold text-brand tabular-nums text-right w-28">{formatDollarsSigned(totalAnnual)}</span>
      </div>

      <p className="text-xs text-fg-muted">
        Assumes {estimates.annualCostGrowthRate}% annual cost increases
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Custom Costs View - Full form inputs
 * ───────────────────────────────────────────────────────────────────────────── */
function CustomCostsView({ s }: { s: CashflowState }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Rates */}
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Council rates (p.a.)" value={s.councilRates} {...currencyInput(s.setCouncilRates)} />
        <InputField label="Water rates (p.a.)" value={s.waterRates} {...currencyInput(s.setWaterRates)} />
      </div>

      {/* Insurance */}
      <div className={`grid gap-4 ${s.isInvestment ? "grid-cols-2" : "grid-cols-1"}`}>
        <InputField label="Building insurance (p.a.)" value={s.insurance} {...currencyInput(s.setInsurance)} />
        {s.isInvestment && (
          <InputField label="Landlord insurance (p.a.)" value={s.landlordInsurance} {...currencyInput(s.setLandlordInsurance)} />
        )}
      </div>

      {/* Maintenance & Growth */}
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Maintenance"
          hint="% of property value p.a."
          value={s.maintenance}
          onChange={(e) => s.setMaintenance(e.target.value.replace(/[^\d.]/g, ""))}
          suffix="%"
          placeholder="0.5"
        />
        <InputField
          label="Annual cost growth"
          hint="inflation/increases"
          value={s.annualCostGrowthRate}
          onChange={(e) => s.setAnnualCostGrowthRate(e.target.value.replace(/[^\d.]/g, ""))}
          suffix="%"
          placeholder="2.5"
        />
      </div>

      <div className="pt-1">
        <Checkbox checked={s.hasStrata} onChange={s.setHasStrata}>
          Strata / Body corp
        </Checkbox>
      </div>

      {/* Strata fees (conditional) */}
      {s.hasStrata && (
        <div className="max-w-[calc(50%-0.5rem)]">
          <InputField label="Strata fees (quarterly)" value={s.strataFees} {...currencyInput(s.setStrataFees)} />
        </div>
      )}
    </div>
  );
}

