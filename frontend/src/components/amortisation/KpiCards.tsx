import type { Frequency } from "@/lib/types";
import type { ScheduleResponse } from "@/lib/api";
import { PERIODS_PER_YEAR, FREQ_OPTIONS, FREQ_LABELS, parseCurrency } from "@/lib/constants";
import { formatCurrency, formatCurrencyShort } from "@/lib/formatters";
import { loanAmountFromPayment } from "@/lib/calculations";
import { t } from "@/lib/theme";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";
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
  onFrequencyChange: (f: Frequency) => void;
}

const CARD_STYLE = "relative flex flex-col items-center py-2.5 text-center border-accent/20";
const CARD_BORDER = { borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated };

export default function KpiCards({
  data,
  frequency,
  rate,
  years,
  deposit,
  onPurchasePriceChange,
  onFrequencyChange,
}: KpiCardsProps) {
  const animPayment = useAnimatedValue(data?.payment ?? 0);
  const animLoan = useAnimatedValue(data?.summary.loan_amount ?? 0);

  const lvrPct = data ? (data.summary.lvr * 100).toFixed(1) : "0";

  const handleRepaymentCommit = (newPayment: number) => {
    const ppy = PERIODS_PER_YEAR[frequency];
    const loan = loanAmountFromPayment(newPayment, rate / 100, years, ppy);
    const newPrice = Math.round(loan + deposit);
    onPurchasePriceChange(Math.min(3_000_000, Math.max(200_000, newPrice)));
  };

  return (
    <div className="mb-4 grid gap-4 grid-cols-[1fr_1fr_1fr]">
      {/* Repayment — editable */}
      <GlassCard className={CARD_STYLE} style={CARD_BORDER}>
        <div className="text-[18px] font-medium uppercase tracking-[0.14em] text-accent/40">
          Repayment
        </div>
        <div className="mt-1.5 flex items-center h-[38px] text-[34px] font-normal leading-none tracking-[-0.02em] text-foreground tabular-nums">
          {data ? (
            <EditableValue
              display={formatCurrency(animPayment)}
              parse={parseCurrency}
              onCommit={handleRepaymentCommit}
              className="w-full text-center text-[34px] font-normal leading-none tracking-[-0.02em] tabular-nums"
            />
          ) : <Skeleton width="160px" height="34px" />}
        </div>
        <div className="mt-1.5 text-[11px] font-normal uppercase tabular-nums tracking-[0.12em] text-muted/30">
          {data ? `per ${FREQ_LABELS[frequency]}` : <Skeleton width="80px" height="11px" />}
        </div>
      </GlassCard>

      {/* Frequency */}
      <GlassCard className={CARD_STYLE} style={CARD_BORDER}>
        <div className="text-[18px] font-medium uppercase tracking-[0.14em] text-accent/40">
          Frequency
        </div>
        <div className="mt-auto mb-auto flex gap-1.5 px-4 w-full">
          {data ? FREQ_OPTIONS.map((opt) => {
            const isActive = frequency === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onFrequencyChange(opt.value)}
                className="flex-1 rounded-full text-[11px] tracking-[0.5px] transition-all duration-200 cursor-pointer"
                style={{
                  padding: "12px 4px",
                  background: isActive ? "rgba(45,212,191,0.15)" : "transparent",
                  border: isActive ? "1px solid var(--color-accent)" : "1px solid rgba(255,255,255,0.12)",
                  color: isActive ? "var(--color-accent)" : "rgba(255,255,255,0.4)",
                  fontWeight: isActive ? 700 : 400,
                  boxShadow: isActive ? "0 0 10px rgba(45,212,191,0.2)" : "none",
                }}
              >
                {opt.label}
              </button>
            );
          }) : <Skeleton width="200px" height="32px" />}
        </div>
      </GlassCard>

      {/* Loan Amount */}
      <GlassCard className={CARD_STYLE} style={CARD_BORDER}>
        <div className="text-[18px] font-medium uppercase tracking-[0.14em] text-accent/40">
          Loan Amount
        </div>
        <div className="mt-1.5 flex items-center h-[38px] text-[34px] font-normal leading-none tracking-[-0.02em] tabular-nums text-foreground">
          {data ? formatCurrencyShort(animLoan) : <Skeleton width="160px" height="34px" />}
        </div>
        <div className="mt-1.5 text-[11px] font-normal uppercase tabular-nums tracking-[0.12em] text-muted/30">
          {data ? `${lvrPct}% LVR` : <Skeleton width="60px" height="11px" />}
        </div>
      </GlassCard>
    </div>
  );
}
