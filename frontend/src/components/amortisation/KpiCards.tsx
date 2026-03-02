import type { Frequency } from "@/lib/types";
import type { ScheduleResponse } from "@/lib/api";
import { PERIODS_PER_YEAR, FREQ_LABELS, parseCurrency } from "@/lib/constants";
import { formatCurrency, formatCurrencyCompact, loanAmountFromPayment } from "@/lib/formatters";
import { t } from "@/lib/theme";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import GlassCard from "@/components/ui/GlassCard";
import EditableValue from "@/components/ui/EditableValue";

interface KpiCardsProps {
  data: ScheduleResponse | null;
  frequency: Frequency;
  rate: number;
  years: number;
  deposit: number;
  onPurchasePriceChange: (price: number) => void;
}

const CARD_STYLE = "relative flex flex-col items-center justify-center pt-5 pb-5 text-center border-teal-400/20";

export default function KpiCards({
  data,
  frequency,
  rate,
  years,
  deposit,
  onPurchasePriceChange,
}: KpiCardsProps) {
  const animPayment = useAnimatedValue(data?.payment ?? 0);
  const animInterest = useAnimatedValue(data?.total_interest ?? 0);
  const animLoan = useAnimatedValue(data?.summary.loan_amount ?? 0);

  const total = data ? data.summary.loan_amount + data.total_interest : 0;
  const interestPct = data && total > 0 ? ((data.total_interest / total) * 100).toFixed(1) : "0";
  const lvrPct = data ? (data.summary.lvr * 100).toFixed(1) : "0";

  const handleRepaymentCommit = (newPayment: number) => {
    const ppy = PERIODS_PER_YEAR[frequency];
    const loan = loanAmountFromPayment(newPayment, rate / 100, years, ppy);
    const newPrice = Math.round(loan + deposit);
    onPurchasePriceChange(Math.min(3_000_000, Math.max(200_000, newPrice)));
  };

  return (
    <div className="mb-5 grid grid-cols-[1.2fr_1fr_1fr] gap-5">
      {/* Repayment — editable */}
      <GlassCard
        className={CARD_STYLE}
        style={{ borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated }}
      >
        <div className="text-[22px] font-medium uppercase tracking-[0.14em] text-teal-400/40">
          Repayment
        </div>
        <div className="mt-3 text-[42px] font-normal leading-none tracking-[-0.02em] text-zinc-50 tabular-nums">
          {data ? (
            <EditableValue
              display={formatCurrency(animPayment)}
              parse={parseCurrency}
              onCommit={handleRepaymentCommit}
              className="w-full text-center text-[42px] font-normal leading-none tracking-[-0.02em] tabular-nums"
            />
          ) : "—"}
        </div>
        <div className="mt-2.5 text-[14px] font-normal uppercase tracking-[0.12em] text-zinc-100/30">
          per {FREQ_LABELS[frequency]}
        </div>
      </GlassCard>

      {/* Total Interest */}
      <GlassCard
        className={CARD_STYLE}
        style={{ borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated }}
      >
        <div className="text-[22px] font-medium uppercase tracking-[0.14em] text-teal-400/40">
          Total Interest
        </div>
        <div className="mt-3 text-[42px] font-normal leading-none tracking-[-0.02em] tabular-nums text-zinc-50">
          {data ? formatCurrencyCompact(animInterest) : "—"}
        </div>
        <div className="mt-2.5 text-[14px] font-normal uppercase tabular-nums tracking-[0.12em] text-zinc-100/30">
          {data ? `${interestPct}% of total` : ""}
        </div>
      </GlassCard>

      {/* Loan Amount */}
      <GlassCard
        className={CARD_STYLE}
        style={{ borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated }}
      >
        <div className="text-[22px] font-medium uppercase tracking-[0.14em] text-teal-400/40">
          Loan Amount
        </div>
        <div className="mt-3 text-[42px] font-normal leading-none tracking-[-0.02em] tabular-nums text-zinc-50">
          {data ? formatCurrencyCompact(animLoan) : "—"}
        </div>
        <div className="mt-2.5 text-[14px] font-normal uppercase tabular-nums tracking-[0.12em] text-zinc-100/30">
          {data ? `${lvrPct}% LVR` : ""}
        </div>
      </GlassCard>
    </div>
  );
}
