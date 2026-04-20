import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";
import { INPUT_CLS, currencyInput } from "./shared";

interface Props {
  s: CashflowState;
}

export default function PropertyStep({ s }: Props) {
  if (s.isNewPurchase) {
    const price = parseCurrencyInput(s.purchasePrice);
    const deposit = parseCurrencyInput(s.depositAmount);
    const loanAmount = price - deposit;
    const lvrPct = price > 0 ? ((1 - deposit / price) * 100).toFixed(1) : "0.0";
    const depositPct = price > 0 ? ((deposit / price) * 100).toFixed(1) : "0.0";

    return (
      <div className="flex flex-col gap-7">
        <div className="flex gap-3.5">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-medium text-fg-secondary">Purchase price</label>
            <input type="text" className={INPUT_CLS} value={s.purchasePrice} {...currencyInput(s.setPurchasePrice)} />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-medium text-fg-secondary">Deposit</label>
            <input type="text" className={INPUT_CLS} value={s.depositAmount} {...currencyInput(s.setDepositAmount)} />
          </div>
        </div>
        <div className="flex items-stretch bg-brand/[0.04] border border-brand/[0.12] rounded-[14px] overflow-hidden">
          <div className="flex-1 flex flex-col gap-1.5 py-4 px-5">
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-brand/50">Loan amount</span>
            <span className="text-lg font-semibold text-brand tabular-nums tracking-tight">{formatDollarsSigned(loanAmount)}</span>
          </div>
          <div className="w-px bg-brand/10 shrink-0 my-3" />
          <div className="flex-1 flex flex-col gap-1.5 py-4 px-5">
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-brand/50">LVR</span>
            <span className="text-lg font-semibold text-brand tabular-nums tracking-tight">{lvrPct}%</span>
          </div>
          <div className="w-px bg-brand/10 shrink-0 my-3" />
          <div className="flex-1 flex flex-col gap-1.5 py-4 px-5">
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-brand/50">Deposit</span>
            <span className="text-lg font-semibold text-brand tabular-nums tracking-tight">{depositPct}%</span>
          </div>
        </div>
      </div>
    );
  }

  const currentValue = parseCurrencyInput(s.currentValue);
  const loanBalance = parseCurrencyInput(s.currentLoanBalance);
  const originalPrice = parseCurrencyInput(s.originalPurchasePrice);
  const equity = currentValue - loanBalance;
  const lvrPct = currentValue > 0 ? (loanBalance / currentValue * 100).toFixed(1) : "0.0";
  const growthDisplay = originalPrice > 0 ? formatDollarsSigned(currentValue - originalPrice) : "—";

  return (
    <div className="flex flex-col gap-7">
      <div className="flex gap-3.5">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-medium text-fg-secondary">Current value</label>
          <input type="text" className={INPUT_CLS} value={s.currentValue} {...currencyInput(s.setCurrentValue)} />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-medium text-fg-secondary">Loan balance</label>
          <input type="text" className={INPUT_CLS} value={s.currentLoanBalance} {...currencyInput(s.setCurrentLoanBalance)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-fg-secondary">Original purchase price</label>
        <input type="text" className={INPUT_CLS} value={s.originalPurchasePrice} {...currencyInput(s.setOriginalPurchasePrice)} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-fg-secondary">Year purchased</label>
        <input type="text" className={INPUT_CLS} value={s.purchaseYear} onChange={(e) => s.setPurchaseYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2021" />
      </div>
      <div className="flex items-stretch bg-brand/[0.04] border border-brand/[0.12] rounded-[14px] overflow-hidden">
        <div className="flex-1 flex flex-col gap-1.5 py-4 px-5">
          <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-brand/50">Equity</span>
          <span className="text-lg font-semibold text-brand tabular-nums tracking-tight">{formatDollarsSigned(equity)}</span>
        </div>
        <div className="w-px bg-brand/10 shrink-0 my-3" />
        <div className="flex-1 flex flex-col gap-1.5 py-4 px-5">
          <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-brand/50">LVR</span>
          <span className="text-lg font-semibold text-brand tabular-nums tracking-tight">{lvrPct}%</span>
        </div>
        <div className="w-px bg-brand/10 shrink-0 my-3" />
        <div className="flex-1 flex flex-col gap-1.5 py-4 px-5">
          <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-brand/50">Growth</span>
          <span className="text-lg font-semibold text-brand tabular-nums tracking-tight">{growthDisplay}</span>
        </div>
      </div>
    </div>
  );
}
