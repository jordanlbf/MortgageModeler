import { parseCurrency, parsePercent, parseYears } from "@/lib/constants";
import { formatCurrencyShort } from "@/lib/formatters";
import { t } from "@/lib/theme";
import GlassCard from "@/components/ui/GlassCard";
import Slider from "@/components/ui/Slider";

interface LoanControlsProps {
  purchasePrice: number;
  deposit: number;
  rate: number;
  years: number;
  appreciation: number;
  onPurchasePriceChange: (v: number) => void;
  onDepositChange: (v: number) => void;
  onRateChange: (v: number) => void;
  onYearsChange: (v: number) => void;
  onAppreciationChange: (v: number) => void;
}

const CARD_BORDER = { borderTopWidth: 3, borderTopColor: t.accentBorder };

export default function LoanControls({
  purchasePrice,
  deposit,
  rate,
  years,
  appreciation,
  onPurchasePriceChange,
  onDepositChange,
  onRateChange,
  onYearsChange,
  onAppreciationChange,
}: LoanControlsProps) {
  return (
    <div className="mb-4 grid grid-cols-[4fr_1fr] gap-4">
      <GlassCard className="border-teal-400/20" style={CARD_BORDER}>
        <div
          className="px-5 py-2.5 text-center"
          style={{ borderBottom: `1px solid ${t.border.default}` }}
        >
          <span className="text-[22px] font-medium uppercase tracking-[0.14em] text-teal-400/40">
            Loan
          </span>
        </div>
        <div className="grid grid-cols-4">
          <div className="px-5 py-3">
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
          <div className="px-5 py-3" style={{ borderLeft: `1px solid ${t.border.default}` }}>
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
          <div className="px-5 py-3" style={{ borderLeft: `1px solid ${t.border.default}` }}>
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
          <div className="px-5 py-3" style={{ borderLeft: `1px solid ${t.border.default}` }}>
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

      <GlassCard className="border-teal-400/20" style={CARD_BORDER}>
        <div
          className="px-5 py-2.5 text-center"
          style={{ borderBottom: `1px solid ${t.border.default}` }}
        >
          <span className="text-[22px] font-medium uppercase tracking-[0.14em] text-teal-400/40">
            Assumptions
          </span>
        </div>
        <div className="px-5 py-3">
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
          />
        </div>
      </GlassCard>
    </div>
  );
}
