import { memo } from "react";
import type { Frequency } from "@/lib/types";
import { parseCurrency, parsePercent, parseYears, FREQ_LABELS } from "@/lib/constants";
import { formatCurrencyShort } from "@/lib/formatters";
import { t, SERIES, mix } from "@/lib/theme";
import GlassCard from "@/components/ui/GlassCard";
import Slider from "@/components/ui/Slider";

interface LoanControlsProps {
  purchasePrice: number;
  deposit: number;
  rate: number;
  years: number;
  appreciation: number;
  loanAmount: number;
  frequency: Frequency;
  showOffset: boolean;
  showEquity: boolean;
  offsetBalance: number;
  offsetContribution: number;
  onPurchasePriceChange: (v: number) => void;
  onDepositChange: (v: number) => void;
  onRateChange: (v: number) => void;
  onYearsChange: (v: number) => void;
  onAppreciationChange: (v: number) => void;
  onOffsetBalanceChange: (v: number) => void;
  onOffsetContributionChange: (v: number) => void;
}

const CARD_BORDER = { borderTopWidth: 3, borderTopColor: t.accentBorder };

const OFFSET_BORDER = { borderTopWidth: 3, borderTopColor: mix(SERIES.offset.color, 35) };
const EQUITY_BORDER = { borderTopWidth: 3, borderTopColor: mix(SERIES.eq.color, 35) };

export default memo(function LoanControls({
  purchasePrice,
  deposit,
  rate,
  years,
  appreciation,
  loanAmount,
  frequency,
  showOffset,
  showEquity,
  offsetBalance,
  offsetContribution,
  onPurchasePriceChange,
  onDepositChange,
  onRateChange,
  onYearsChange,
  onAppreciationChange,
  onOffsetBalanceChange,
  onOffsetContributionChange,
}: LoanControlsProps) {
  return (
    <div className={`mb-3 grid gap-3 ${
      showOffset && showEquity ? "grid-cols-[4fr_2fr_1fr]" :
      showOffset ? "grid-cols-[4fr_2fr]" :
      showEquity ? "grid-cols-[4fr_1fr]" :
      "grid-cols-[4fr]"
    }`}>
      <GlassCard className="border-accent/20" style={CARD_BORDER}>
        <div className="grid grid-cols-4">
          <div className="px-4 py-2.5">
            <Slider
              label="Purchase price"
              value={purchasePrice}
              display={formatCurrencyShort(purchasePrice)}
              min={200_000}
              max={3_000_000}
              step={10_000}
              onChange={onPurchasePriceChange}
              editable
              parseDisplay={parseCurrency}
            />
          </div>
          <div className="px-4 py-2.5" style={{ borderLeft: `1px solid ${t.border.default}` }}>
            <Slider
              label="Deposit"
              value={deposit}
              display={formatCurrencyShort(deposit)}
              min={0}
              max={Math.min(purchasePrice, 1_500_000)}
              step={5_000}
              onChange={onDepositChange}
              editable
              parseDisplay={parseCurrency}
            />
          </div>
          <div className="px-4 py-2.5" style={{ borderLeft: `1px solid ${t.border.default}` }}>
            <Slider
              label="Interest rate"
              value={rate}
              display={`${rate.toFixed(1)}%`}
              min={2}
              max={12}
              step={0.1}
              onChange={onRateChange}
              editable
              parseDisplay={parsePercent}
            />
          </div>
          <div className="px-4 py-2.5" style={{ borderLeft: `1px solid ${t.border.default}` }}>
            <Slider
              label="Loan term"
              value={years}
              display={`${years} yrs`}
              min={5}
              max={30}
              step={1}
              onChange={onYearsChange}
              editable
              parseDisplay={parseYears}
            />
          </div>
        </div>
      </GlassCard>

      {showOffset && (
        <GlassCard className="border-accent/20" style={OFFSET_BORDER}>
          <div className="grid grid-cols-2">
            <div className="px-4 py-2.5">
              <Slider
                label="Starting balance"
                value={offsetBalance}
                display={formatCurrencyShort(offsetBalance)}
                min={0}
                max={Math.max(loanAmount, 50_000)}
                step={5_000}
                onChange={onOffsetBalanceChange}
                editable
                parseDisplay={parseCurrency}
                accent={SERIES.offset.color}
              />
            </div>
            <div className="px-4 py-2.5" style={{ borderLeft: `1px solid ${t.border.default}` }}>
              <Slider
                label={`Contribution per ${FREQ_LABELS[frequency]}`}
                value={offsetContribution}
                display={formatCurrencyShort(offsetContribution)}
                min={0}
                max={5_000}
                step={50}
                onChange={onOffsetContributionChange}
                editable
                parseDisplay={parseCurrency}
                accent={SERIES.offset.color}
              />
            </div>
          </div>
        </GlassCard>
      )}

      {showEquity && (
        <GlassCard className="border-accent/20" style={EQUITY_BORDER}>
          <div className="px-4 py-2.5">
            <Slider
              label="Appreciation"
              value={appreciation}
              display={`${appreciation.toFixed(1)}%`}
              min={0}
              max={10}
              step={0.5}
              onChange={onAppreciationChange}
              editable
              parseDisplay={parsePercent}
              accent={SERIES.eq.color}
            />
          </div>
        </GlassCard>
      )}
    </div>
  );
})
