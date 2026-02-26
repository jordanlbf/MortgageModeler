import type { Schedule, Frequency } from "@/lib/engine";
import { formatCurrency } from "@/lib/formatters";

interface ScheduleTableProps {
  schedule: Schedule;
  frequency: Frequency;
}

const PERIODS_PER_YEAR: Record<Frequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
};

const HEADERS = ["#", "Opening", "Payment", "Interest", "Principal", "Closing"];

export default function ScheduleTable({ schedule, frequency }: ScheduleTableProps) {
  const ppy = PERIODS_PER_YEAR[frequency];

  // Show yearly snapshots + first row + last row
  const filteredRows = schedule.rows.filter(
    (_, i) => i % ppy === 0 || i === schedule.rows.length - 1
  );

  return (
    <div>
      <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-white/25">
          Amortisation schedule
        </span>
        <span className="text-[10px] text-white/[0.12]">{schedule.totalPeriods} periods</span>
      </div>
      <div className="custom-scrollbar max-h-[340px] overflow-y-auto">
        {/* Header */}
        <div className="grid grid-cols-[56px_1fr_1fr_1fr_1fr_1fr] border-b border-white/[0.04] px-5 py-2.5">
          {HEADERS.map((h, i) => (
            <div
              key={h}
              className={`text-[9px] font-medium uppercase tracking-[0.08em] text-white/15 ${
                i === 0 ? "text-left" : "text-right"
              }`}
            >
              {h}
            </div>
          ))}
        </div>
        {/* Rows */}
        {filteredRows.map((row) => (
          <div
            key={row.period}
            className="grid grid-cols-[56px_1fr_1fr_1fr_1fr_1fr] border-b border-white/[0.02] px-5 py-[7px] text-[11px] tabular-nums transition-colors hover:bg-white/[0.02]"
          >
            <div className="text-white/15">{row.period}</div>
            <div className="text-right text-white/30">{formatCurrency(row.openingBalance)}</div>
            <div className="text-right text-white/50">{formatCurrency(schedule.payment)}</div>
            <div className="text-right text-pink-400">{formatCurrency(row.interest)}</div>
            <div className="text-right text-indigo-400">{formatCurrency(row.principalPaid)}</div>
            <div className="text-right text-white/30">{formatCurrency(row.closingBalance)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
