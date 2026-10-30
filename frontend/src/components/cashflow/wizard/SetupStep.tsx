"use client";

import { useId } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";
import { currencyInput, InputField } from "./shared";

interface Props {
  s: CashflowState;
}

export default function SetupStep({ s }: Props) {
  const id = useId();
  const showInputs = s.propertyUse && s.purchaseMode;

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {/* Property Type Row */}
      <div className="flex flex-col gap-3">
        <FieldLabel id={`${id}-use`}>Property type</FieldLabel>
        {/* Click handlers live on the items (not onValueChange) so re-clicking
            the active option behaves as before: it re-applies the choice and
            never deselects it. */}
        <ToggleGroup
          type="single"
          variant="choice"
          value={s.propertyUse ?? ""}
          aria-labelledby={`${id}-use`}
          className="flex gap-2"
        >
          <ToggleGroupItem
            value="investment"
            onClick={() => { s.setPropertyUse("investment"); s.setPurchaseMode(null); }}
          >
            Investment
          </ToggleGroupItem>
          <ToggleGroupItem
            value="ppor"
            onClick={() => { s.setPropertyUse("ppor"); s.setPurchaseMode(null); }}
          >
            Owner-occupied
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Purchase Status Row */}
      <div className={`flex flex-col gap-3 transition-opacity duration-200 ${!s.propertyUse ? "opacity-30 pointer-events-none" : ""}`}>
        <FieldLabel id={`${id}-mode`}>Purchase status</FieldLabel>
        <ToggleGroup
          type="single"
          variant="choice"
          value={s.purchaseMode ?? ""}
          disabled={!s.propertyUse}
          aria-labelledby={`${id}-mode`}
          className="flex gap-2"
        >
          <ToggleGroupItem value="new" onClick={() => s.setPurchaseMode("new")}>
            New purchase
          </ToggleGroupItem>
          <ToggleGroupItem value="existing" onClick={() => s.setPurchaseMode("existing")}>
            Existing property
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Property Inputs - appear after both selections */}
      {showInputs && (
        <div className="pt-6 border-t border-white/[0.06]">
          <PropertyInputs s={s} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Property Inputs - Standard form with inline summary
 * ───────────────────────────────────────────────────────────────────────────── */
function PropertyInputs({ s }: Props) {
  const isNew = s.purchaseMode === "new";

  // Calculations
  const price = parseCurrencyInput(isNew ? s.purchasePrice : s.currentValue);
  const deposit = parseCurrencyInput(s.depositAmount);
  const loanBalance = parseCurrencyInput(s.currentLoanBalance);
  const originalPrice = parseCurrencyInput(s.originalPurchasePrice);

  const loanAmount = isNew ? price - deposit : loanBalance;
  const equity = price - loanBalance;
  const lvrPct = price > 0 ? ((isNew ? (1 - deposit / price) : loanBalance / price) * 100).toFixed(1) : "0.0";
  const depositPct = price > 0 ? ((deposit / price) * 100).toFixed(1) : "0.0";
  const growthDisplay = originalPrice > 0 ? formatDollarsSigned(price - originalPrice) : "—";

  const summaryItems = isNew
    ? [
        { label: "Loan", value: formatDollarsSigned(loanAmount) },
        { label: "LVR", value: `${lvrPct}%` },
        { label: "Deposit", value: `${depositPct}%` },
      ]
    : [
        { label: "Equity", value: formatDollarsSigned(equity) },
        { label: "LVR", value: `${lvrPct}%` },
        { label: "Growth", value: growthDisplay },
      ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        {isNew ? (
          <>
            <InputField label="Purchase price" value={s.purchasePrice} {...currencyInput(s.setPurchasePrice)} placeholder="$750,000" />
            <InputField label="Deposit amount" value={s.depositAmount} {...currencyInput(s.setDepositAmount)} placeholder="$150,000" />
          </>
        ) : (
          <>
            <InputField label="Current value" value={s.currentValue} {...currencyInput(s.setCurrentValue)} placeholder="$850,000" />
            <InputField label="Loan balance" value={s.currentLoanBalance} {...currencyInput(s.setCurrentLoanBalance)} placeholder="$480,000" />
            <InputField label="Original price" value={s.originalPurchasePrice} {...currencyInput(s.setOriginalPurchasePrice)} placeholder="$650,000" />
            <InputField label="Year purchased" value={s.purchaseYear} onChange={(e) => s.setPurchaseYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2021" />
          </>
        )}
      </div>
      <SummaryInline items={summaryItems} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * UI Components
 * ───────────────────────────────────────────────────────────────────────────── */

function FieldLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span id={id} className="text-sm font-medium text-fg-primary">
      {children}
    </span>
  );
}

function SummaryInline({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex items-center gap-6">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline gap-1.5">
          <span className="text-xs text-fg-muted">{item.label}</span>
          <span className="text-sm font-semibold text-brand tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
