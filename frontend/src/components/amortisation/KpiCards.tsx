import type { Frequency } from "@/lib/types";
import type { ScheduleResponse } from "@/lib/api";
import { PERIODS_PER_YEAR, FREQ_LABELS, parseCurrency } from "@/lib/constants";
import { formatCurrency, formatCurrencyCompact } from "@/lib/formatters";
import { loanAmountFromPayment } from "@/lib/calculations";
import { useCallback } from "react";
import { t } from "@/lib/theme";
import { useAnimatedValue, useAnimatedText } from "@/hooks/useAnimatedValue";
import GlassCard from "@/components/ui/GlassCard";
import EditableValue from "@/components/ui/EditableValue";
import Skeleton from "@/components/ui/Skeleton";

interface KpiCardsProps {
  data: ScheduleResponse | null;
  frequency: Frequency;
  rate: number;
  years: number;
  deposit: number;
  onPurchasePriceChange: (price: number) => void;
}

const CARD_STYLE = "relative flex flex-col items-center justify-center pt-3 pb-3 text-center border-accent/20";

export default function KpiCards({
  data,
  frequency,
  rate,
  years,
  deposit,
  onPurchasePriceChange,
}: KpiCardsProps) {
  const animPayment = useAnimatedValue(data?.payment ?? 0);
  const fmtCompact = useCallback((v: number) => formatCurrencyCompact(v), []);
  const interestRef = useAnimatedText(data?.total_interest ?? 0, fmtCompact);
  const loanRef = useAnimatedText(data?.summary.loan_amount ?? 0, fmtCompact);

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
    <div className="mb-4 grid gap-4 grid-cols-[1.2fr_1fr_1fr]">
      {/* Repayment — editable */}
      <GlassCard
        className={CARD_STYLE}
        style={{ borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated }}
      >
        <div className="text-[18px] font-medium uppercase tracking-[0.14em] text-accent/40">
          Repayment
        </div>
        <div className="mt-1.5 text-[34px] font-normal leading-none tracking-[-0.02em] text-foreground tabular-nums">
          {data ? (
            <EditableValue
              display={formatCurrency(animPayment)}
              parse={parseCurrency}
              onCommit={handleRepaymentCommit}
              className="w-full text-center text-[34px] font-normal leading-none tracking-[-0.02em] tabular-nums"
            />
          ) : <Skeleton width="160px" height="34px" />}
        </div>
        <div className="mt-1.5 text-[11px] font-normal uppercase tracking-[0.12em] text-muted/30">
          {data ? `per ${FREQ_LABELS[frequency]}` : <Skeleton width="80px" height="11px" />}
        </div>
      </GlassCard>

      {/* Total Interest */}
      <GlassCard
        className={CARD_STYLE}
        style={{ borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated }}
      >
        <div className="text-[18px] font-medium uppercase tracking-[0.14em] text-accent/40">
          Total Interest
        </div>
        <div className="mt-1.5 text-[34px] font-normal leading-none tracking-[-0.02em] tabular-nums text-foreground">
          {data ? <span ref={interestRef} /> : <Skeleton width="120px" height="34px" />}
        </div>
        <div className="mt-1.5 text-[11px] font-normal uppercase tabular-nums tracking-[0.12em] text-muted/30">
          {data ? `${interestPct}% of total` : <Skeleton width="80px" height="11px" />}
        </div>
      </GlassCard>

      {/* Loan Amount */}
      <GlassCard
        className={CARD_STYLE}
        style={{ borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated }}
      >
        <div className="text-[18px] font-medium uppercase tracking-[0.14em] text-accent/40">
          Loan Amount
        </div>
        <div className="mt-1.5 text-[34px] font-normal leading-none tracking-[-0.02em] tabular-nums text-foreground">
          {data ? <span ref={loanRef} /> : <Skeleton width="100px" height="34px" />}
        </div>
        <div className="mt-1.5 text-[11px] font-normal uppercase tabular-nums tracking-[0.12em] text-muted/30">
          {data ? `${lvrPct}% LVR` : <Skeleton width="60px" height="11px" />}
        </div>
      </GlassCard>
    </div>
  );
}
