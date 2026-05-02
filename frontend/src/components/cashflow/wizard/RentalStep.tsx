"use client";

import { useState } from "react";
import type { CashflowState } from "@/hooks/useCashflowState";
import { Checkbox, currencyInput, EditableRow, InputField, ModeButton, ModeToggle } from "./shared";
import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";

interface Props {
  s: CashflowState;
}

type RentalMode = "quick" | "custom";

export default function RentalStep({ s }: Props) {
  const [mode, setMode] = useState<RentalMode>("quick");

  // Calculate property value for rent estimate
  const propertyValue = s.isNewPurchase
    ? parseCurrencyInput(s.purchasePrice || "")
    : parseCurrencyInput(s.currentValue || "");

  // Quick estimate defaults
  const estimates = {
    // Typical rental yield ~4-5% gross, using 4.5% = ~0.087% per week
    weeklyRent: Math.round(propertyValue * 0.045 / 52),
    vacancyRate: 2, // 2% vacancy
    managementFee: 7, // 7% management fee
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
        <CustomRentalView s={s} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Quick Estimate View - Editable inline estimates
 * ───────────────────────────────────────────────────────────────────────────── */
function QuickEstimateView({ s, estimates }: {
  s: CashflowState;
  estimates: { weeklyRent: number; vacancyRate: number; managementFee: number };
}) {
  // Use form state if set, otherwise fall back to estimates
  const weeklyRent = parseCurrencyInput(s.weeklyRent || "") || estimates.weeklyRent;
  const vacancyRate = parseFloat(s.vacancyRate || "") || estimates.vacancyRate;
  const managementFee = parseFloat(s.managementFee || "") || estimates.managementFee;

  // Calculate annual income
  const grossAnnual = weeklyRent * 52;
  const vacancyLoss = grossAnnual * (vacancyRate / 100);
  const managementCost = s.usePropertyManager ? grossAnnual * (managementFee / 100) : 0;
  const netAnnual = grossAnnual - vacancyLoss - managementCost;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-fg-muted">
        Based on ~4.5% rental yield. Edit values below or switch to Custom for more options.
      </p>

      <Checkbox checked={s.usePropertyManager} onChange={s.setUsePropertyManager}>
        Use property manager
      </Checkbox>

      {/* Editable inputs */}
      <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
        <div className="flex flex-col gap-2">
          <EditableRow
            label="Weekly rent"
            value={s.weeklyRent}
            onChange={s.setWeeklyRent}
            placeholder={formatDollarsSigned(estimates.weeklyRent)}
          />
          <EditableRow
            label="Vacancy rate"
            value={s.vacancyRate}
            onChange={s.setVacancyRate}
            placeholder={String(estimates.vacancyRate)}
            isPercent
          />
          {s.usePropertyManager && (
            <EditableRow
              label="Management fee"
              value={s.managementFee}
              onChange={s.setManagementFee}
              placeholder={String(estimates.managementFee)}
              isPercent
            />
          )}
        </div>
      </div>

      {/* Derived metrics - accounting style, px-4 to align with table content */}
      <div className="flex flex-col gap-1.5 px-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-fg-muted text-left">Gross annual</span>
          <span className="text-sm text-fg-secondary tabular-nums text-right w-28">{formatDollarsSigned(grossAnnual)}</span>
        </div>
        {vacancyLoss > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted text-left">Vacancy ({vacancyRate}%)</span>
            <span className="text-sm text-red-400 tabular-nums text-right w-28">-{formatDollarsSigned(vacancyLoss)}</span>
          </div>
        )}
        {managementCost > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted text-left">Management ({managementFee}%)</span>
            <span className="text-sm text-red-400 tabular-nums text-right w-28">-{formatDollarsSigned(managementCost)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800">
          <span className="text-sm font-medium text-fg-secondary text-left">Net annual income</span>
          <span className="text-sm font-semibold text-brand tabular-nums text-right w-28">{formatDollarsSigned(netAnnual)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Custom Rental View - Full form inputs
 * ───────────────────────────────────────────────────────────────────────────── */
function CustomRentalView({ s }: { s: CashflowState }) {
  return (
    <div className="flex flex-col gap-6">
      <InputField
        label="Weekly rent"
        value={s.weeklyRent}
        {...currencyInput(s.setWeeklyRent)}
      />
      <InputField
        label="Vacancy rate"
        hint="% of time vacant"
        value={s.vacancyRate}
        onChange={(e) => s.setVacancyRate(e.target.value.replace(/[^\d.]/g, ""))}
        suffix="%"
        placeholder="2"
      />

      <div className="pt-1">
        <Checkbox checked={s.usePropertyManager} onChange={s.setUsePropertyManager}>
          Property manager
        </Checkbox>
      </div>

      {s.usePropertyManager && (
        <InputField
          label="Management fee"
          hint="% of rent"
          value={s.managementFee}
          onChange={(e) => s.setManagementFee(e.target.value.replace(/[^\d.]/g, ""))}
          suffix="%"
          placeholder="7"
        />
      )}
    </div>
  );
}

