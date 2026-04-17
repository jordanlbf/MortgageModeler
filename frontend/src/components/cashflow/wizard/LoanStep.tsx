import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";
import { paymentFromLoanAmount } from "@/lib/calculations";
import { INPUT_CLS, currencyInput } from "./shared";

interface Props {
  s: CashflowState;
}

const SUFFIXED_INPUT_CLS = "py-3.5 px-4 pr-10 bg-transparent border border-border rounded-xl text-foreground font-[inherit] text-base font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-accent/40 w-full";

export default function LoanStep({ s }: Props) {
  const principal = s.isNewPurchase
    ? parseCurrencyInput(s.purchasePrice) - parseCurrencyInput(s.depositAmount)
    : parseCurrencyInput(s.currentLoanBalance);
  const annualRate = parseFloat(s.interestRate) / 100 || 0;
  const years = parseFloat(s.loanTerm) || 30;
  const offset = parseCurrencyInput(s.offsetBalance);
  const effectivePrincipal = Math.max(0, principal - (s.hasOffset ? offset : 0));
  const monthlyRepayment = annualRate > 0 && years > 0
    ? paymentFromLoanAmount(effectivePrincipal, annualRate, years, 12)
    : 0;
  const dailyRate = annualRate / 365;
  const monthlyRate = Math.pow(1 + dailyRate, 365 / 12) - 1;
  const monthlyInterest = effectivePrincipal * monthlyRate;
  const monthlyPrincipal = monthlyRepayment - monthlyInterest;

  return (
    <div className="flex flex-col gap-7">
      {/* Live repayment banner */}
      <div className="flex items-center justify-between py-5 px-6 bg-accent/[0.05] border border-accent/[0.15] rounded-[14px] gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-bold text-accent tabular-nums tracking-[-0.03em]">{formatDollarsSigned(monthlyRepayment)}</span>
          <span className="text-sm text-accent/60 font-medium">/ month</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-xs text-faint tabular-nums">{formatDollarsSigned(monthlyInterest)} interest</span>
          <span className="text-xs text-faint opacity-40">·</span>
          <span className="text-xs text-faint tabular-nums">{formatDollarsSigned(monthlyPrincipal)} principal</span>
        </div>
      </div>

      {/* Rate & term */}
      <div className="flex gap-3.5">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-medium text-subtle">Interest rate</label>
          <div className="relative">
            <input type="text" className={SUFFIXED_INPUT_CLS} value={s.interestRate} onChange={(e) => s.setInterestRate(e.target.value)} />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-faint pointer-events-none">%</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-medium text-subtle">Loan term</label>
          <div className="relative">
            <input type="text" className={SUFFIXED_INPUT_CLS} value={s.loanTerm} onChange={(e) => s.setLoanTerm(e.target.value)} />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-faint pointer-events-none">yrs</span>
          </div>
        </div>
      </div>

      {/* Offset & extras */}
      <div className="h-px bg-border my-1" />
      <div className="pt-0.5">
        <label className="flex items-center gap-3 cursor-pointer text-[13px] text-subtle">
          <input type="checkbox" className="absolute opacity-0 pointer-events-none peer" checked={s.hasOffset} onChange={(e) => s.setHasOffset(e.target.checked)} />
          <span className="w-[18px] h-[18px] border border-border-hover rounded bg-transparent transition-all duration-150 shrink-0 relative peer-checked:bg-accent peer-checked:border-accent peer-checked:after:content-[''] peer-checked:after:absolute peer-checked:after:top-[3px] peer-checked:after:left-[6px] peer-checked:after:w-1 peer-checked:after:h-2 peer-checked:after:border-accent-contrast peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:rotate-45" />
          Offset account
        </label>
      </div>
      {s.hasOffset && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-subtle">Offset balance</label>
          <input type="text" className={INPUT_CLS} value={s.offsetBalance} {...currencyInput(s.setOffsetBalance)} />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-subtle">Extra repayments / month</label>
        <input type="text" className={INPUT_CLS} value={s.extraRepayments} {...currencyInput(s.setExtraRepayments)} />
      </div>
    </div>
  );
}
