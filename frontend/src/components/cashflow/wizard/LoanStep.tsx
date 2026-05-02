"use client";

import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";
import { paymentFromLoanAmount } from "@/lib/calculations";
import { currencyInput, InputField } from "./shared";

interface Props {
  s: CashflowState;
}

export default function LoanStep({ s }: Props) {
  const [showOffset, setShowOffset] = useState(s.hasOffset || !!s.offsetBalance);
  const [showExtra, setShowExtra] = useState(!!s.extraRepayments);

  const principal = s.isNewPurchase
    ? parseCurrencyInput(s.purchasePrice) - parseCurrencyInput(s.depositAmount)
    : parseCurrencyInput(s.currentLoanBalance);
  const annualRate = parseFloat(s.interestRate) / 100 || 0;
  const years = parseFloat(s.loanTerm) || 30;
  const offset = parseCurrencyInput(s.offsetBalance);
  const extra = parseCurrencyInput(s.extraRepayments);
  const effectivePrincipal = Math.max(0, principal - (showOffset ? offset : 0));

  const baseMonthlyRepayment = annualRate > 0 && years > 0
    ? paymentFromLoanAmount(effectivePrincipal, annualRate, years, 12)
    : 0;
  const monthlyRepayment = baseMonthlyRepayment + (showExtra ? extra : 0);

  const toggleOffset = () => {
    const willClose = showOffset;
    setShowOffset(!showOffset);
    if (willClose) {
      s.setHasOffset(false);
      s.setOffsetBalance("");
      s.setOffsetMonthlyContribution("");
    } else {
      s.setHasOffset(true);
    }
  };

  const toggleExtra = () => {
    setShowExtra(!showExtra);
    if (showExtra) s.setExtraRepayments("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {/* Core fields in one row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-fg-secondary">Loan amount</label>
          <div className="py-3 text-fg-primary text-base font-medium tabular-nums">
            {formatDollarsSigned(principal)}
          </div>
        </div>
        <InputField
          label="Interest rate"
          value={s.interestRate}
          onChange={(e) => s.setInterestRate(e.target.value.replace(/[^\d.]/g, ""))}
          suffix="%"
          placeholder="6.5"
        />
        <InputField
          label="Loan term"
          value={s.loanTerm}
          onChange={(e) => s.setLoanTerm(e.target.value.replace(/[^\d]/g, ""))}
          suffix="yrs"
          placeholder="30"
        />
      </div>

      {/* Monthly repayment */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-brand tabular-nums">{formatDollarsSigned(monthlyRepayment)}</span>
        <span className="text-xs text-fg-muted">Monthly Repayments</span>
      </div>

      {/* Optional fields */}
      <div className="pt-6 border-t border-white/[0.06] flex flex-col gap-3">
        {/* Offset account */}
        {!showOffset ? (
          <button
            onClick={toggleOffset}
            className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg-secondary transition-colors"
          >
            <Plus size={14} />
            <span>Add offset account</span>
          </button>
        ) : (
          <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
            <button
              onClick={toggleOffset}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-fg-secondary hover:bg-zinc-800/20 transition-colors"
            >
              <span>Offset account</span>
              <ChevronDown size={16} className="text-fg-muted rotate-180" />
            </button>
            <div className="px-4 pb-4 pt-2 border-t border-zinc-800/30">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Current balance" value={s.offsetBalance} {...currencyInput(s.setOffsetBalance)} placeholder="$50,000" />
                <InputField label="Monthly contribution" value={s.offsetMonthlyContribution} {...currencyInput(s.setOffsetMonthlyContribution)} placeholder="$0" />
              </div>
            </div>
          </div>
        )}

        {/* Extra repayments */}
        {!showExtra ? (
          <button
            onClick={toggleExtra}
            className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg-secondary transition-colors"
          >
            <Plus size={14} />
            <span>Add extra repayments</span>
          </button>
        ) : (
          <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
            <button
              onClick={toggleExtra}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-fg-secondary hover:bg-zinc-800/20 transition-colors"
            >
              <span>Extra repayments</span>
              <ChevronDown size={16} className="text-fg-muted rotate-180" />
            </button>
            <div className="px-4 pb-4 pt-2 border-t border-zinc-800/30">
              <InputField label="Monthly amount" value={s.extraRepayments} {...currencyInput(s.setExtraRepayments)} placeholder="$0" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

