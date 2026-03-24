import type { TaxBreakdownResponse } from "@/lib/api";
import { formatCurrencyShort } from "@/lib/formatters";
import { t, mix } from "@/lib/theme";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import GlassCard from "@/components/ui/GlassCard";
import Skeleton from "@/components/ui/Skeleton";

interface TaxKpiCardsProps {
  data: TaxBreakdownResponse | null;
  gross: number;
}

const CARDS = [
  { label: "Total Income", color: "#94a3b8", field: "gross" as const },
  { label: "Total Tax", color: "#f87171", field: "total_tax" as const },
  { label: "Net Income", color: "#2dd4bf", field: "net_income" as const },
];

export default function TaxKpiCards({ data, gross }: TaxKpiCardsProps) {
  const animGross = useAnimatedValue(gross);
  const animTax = useAnimatedValue(data?.total_tax ?? 0);
  const animNet = useAnimatedValue(data?.net_income ?? 0);

  const values = { gross: animGross, total_tax: animTax, net_income: animNet };

  return (
    <div className="flex h-full flex-col" style={{ gap: 12 }}>
      {CARDS.map((card) => (
        <GlassCard
          key={card.field}
          className="flex flex-1 min-h-0 flex-col items-center justify-center text-center"
          style={{
            borderTopWidth: 3,
            borderTopColor: mix(card.color, 35),
            background: t.bg.cardElevated,
          }}
        >
          <div
            className="text-[12px] font-medium uppercase tracking-[0.14em]"
            style={{ color: mix(card.color, 50) }}
          >
            {card.label}
          </div>
          <div className="mt-2 text-[30px] font-light leading-none tabular-nums tracking-[-0.02em] text-foreground">
            {data ? formatCurrencyShort(values[card.field]) : <Skeleton width="140px" height="30px" />}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
