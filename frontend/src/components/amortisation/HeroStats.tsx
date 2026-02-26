import type { Schedule, Frequency } from "@/lib/engine";
import { formatCurrency, formatCurrencyShort } from "@/lib/formatters";

interface HeroStatsProps {
  schedule: Schedule;
  principal: number;
  frequency: Frequency;
  chartData: { y: number; bal: number }[];
}

const FREQ_LABELS: Record<Frequency, string> = {
  weekly: "week",
  fortnightly: "fortnight",
  monthly: "month",
};

export default function HeroStats({ schedule, principal, frequency, chartData }: HeroStatsProps) {
  const total = principal + schedule.totalInterest;
  const halfwayYear = chartData.findIndex((d) => d.bal <= principal / 2);

  const stats = [
    { label: "Interest paid", value: formatCurrencyShort(schedule.totalInterest), color: "text-pink-400" },
    { label: "Total cost", value: formatCurrencyShort(total), color: "text-white/50" },
    { label: "50% equity", value: halfwayYear > 0 ? `Year ${halfwayYear}` : "—", color: "text-indigo-400" },
  ];

  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
      <div>
        <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white/25">
          Your repayment
        </div>
        <div className="text-5xl font-light tracking-tight text-white tabular-nums leading-none">
          {formatCurrency(schedule.payment)}
          <span className="ml-2 text-sm font-normal text-white/20">/{FREQ_LABELS[frequency]}</span>
        </div>
      </div>
      <div className="flex gap-8">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="text-right">
            <div className="mb-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-white/20">
              {label}
            </div>
            <div className={`text-base font-medium tabular-nums ${color}`}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
