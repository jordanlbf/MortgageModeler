import { memo } from "react";
import type { Frequency } from "@/lib/types";
import type { ScheduleResponse } from "@/lib/api";
import { PERIODS_PER_YEAR, FREQ_OPTIONS, FREQ_LABELS } from "@/lib/constants";
import { formatCurrency, formatCurrencyShort, parseCurrencyInput } from "@/lib/formatters";
import { loanAmountFromPayment } from "@/lib/calculations";
import { t } from "@/lib/theme";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { Card } from "@/components/ui/card";
import EditableValue from "@/components/domain/EditableValue";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface KpiCardsProps {
  data: ScheduleResponse | null;
  frequency: Frequency;
  rate: number;
  years: number;
  deposit: number;
  onPurchasePriceChange: (price: number) => void;
  onFrequencyChange: (f: Frequency) => void;
}

const CARD_STYLE = "relative flex flex-col items-center py-2.5 text-center border-brand/20";
const CARD_BORDER = { borderTopWidth: 3, borderTopColor: t.brand.border, background: t.surface.raised };

export default memo(function KpiCards({
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
      <Card variant="glass" className={CARD_STYLE} style={CARD_BORDER}>
        <div className="text-[18px] font-medium uppercase tracking-widest text-brand/40">
          Repayment
        </div>
        <div className="mt-1.5 flex items-center h-[38px] text-[34px] font-normal leading-none tracking-[-0.02em] text-fg-primary tabular-nums">
          {data ? (
            <EditableValue
              display={formatCurrency(animPayment)}
              parse={parseCurrencyInput}
              onCommit={handleRepaymentCommit}
              className="w-full text-center text-[34px] font-normal leading-none tracking-[-0.02em] tabular-nums"
            />
          ) : <Skeleton variant="inline" width="160px" height="34px" />}
        </div>
        <div className="mt-1.5 text-[11px] font-normal uppercase tabular-nums tracking-widest text-fg-primary/30">
          {data ? `per ${FREQ_LABELS[frequency]}` : <Skeleton variant="inline" width="80px" height="11px" />}
        </div>
      </Card>

      {/* Frequency */}
      <Card variant="glass" className={CARD_STYLE} style={CARD_BORDER}>
        <div className="text-[18px] font-medium uppercase tracking-widest text-brand/40">
          Frequency
        </div>
        {data ? (
          <ToggleGroup
            type="single"
            variant="segment-pill"
            aria-label="Repayment frequency"
            value={frequency}
            onValueChange={(v) => { if (v) onFrequencyChange(v as Frequency); }}
            className="mt-auto mb-auto flex gap-1.5 px-4 w-full"
          >
            {FREQ_OPTIONS.map((opt) => (
              <ToggleGroupItem key={opt.value} value={opt.value} className="flex-1 px-1 py-[14px]">
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : (
          <div className="mt-auto mb-auto flex gap-1.5 px-4 w-full">
            <Skeleton variant="inline" width="200px" height="32px" />
          </div>
        )}
      </Card>

      {/* Loan Amount */}
      <Card variant="glass" className={CARD_STYLE} style={CARD_BORDER}>
        <div className="text-[18px] font-medium uppercase tracking-widest text-brand/40">
          Loan Amount
        </div>
        <div className="mt-1.5 flex items-center h-[38px] text-[34px] font-normal leading-none tracking-[-0.02em] tabular-nums text-fg-primary">
          {data ? formatCurrencyShort(animLoan) : <Skeleton variant="inline" width="160px" height="34px" />}
        </div>
        <div className="mt-1.5 text-[11px] font-normal uppercase tabular-nums tracking-widest text-fg-primary/30">
          {data ? `${lvrPct}% LVR` : <Skeleton variant="inline" width="60px" height="11px" />}
        </div>
      </Card>
    </div>
  );
})
