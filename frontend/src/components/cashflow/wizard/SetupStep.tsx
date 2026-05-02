"use client";

import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";
import { currencyInput, InputField } from "./shared";

interface Props {
  s: CashflowState;
}

export default function SetupStep({ s }: Props) {
  const showInputs = s.propertyUse && s.purchaseMode;

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {/* Property Type Row */}
      <div className="flex flex-col gap-3">
        <FieldLabel>Property type</FieldLabel>
        <div className="flex gap-2">
          <PillButton
            label="Investment"
            active={s.propertyUse === "investment"}
            onClick={() => { s.setPropertyUse("investment"); s.setPurchaseMode(null); }}
          />
          <PillButton
            label="Owner-occupied"
            active={s.propertyUse === "ppor"}
            onClick={() => { s.setPropertyUse("ppor"); s.setPurchaseMode(null); }}
          />
        </div>
      </div>

      {/* Purchase Status Row */}
      <div className={`flex flex-col gap-3 transition-opacity duration-200 ${!s.propertyUse ? "opacity-30 pointer-events-none" : ""}`}>
        <FieldLabel>Purchase status</FieldLabel>
        <div className="flex gap-2">
          <PillButton
            label="New purchase"
            active={s.purchaseMode === "new"}
            onClick={() => s.setPurchaseMode("new")}
          />
          <PillButton
            label="Existing property"
            active={s.purchaseMode === "existing"}
            onClick={() => s.setPurchaseMode("existing")}
          />
        </div>
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm font-medium text-fg-primary">
      {children}
    </span>
  );
}

function PillButton({ label, active, onClick }: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap
        ${active 
          ? "bg-brand/[0.12] text-brand ring-1 ring-brand/30" 
          : "bg-zinc-800/40 text-fg-secondary hover:bg-zinc-800/60 hover:text-fg-primary"
        }
      `}
    >
      {label}
    </button>
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
