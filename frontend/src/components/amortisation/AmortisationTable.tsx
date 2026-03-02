import type { ScheduleRow } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { t } from "@/lib/theme";

interface AmortisationTableProps {
  rows: ScheduleRow[];
  height: number;
}

const COLUMNS = ["#", "Opening", "Payment", "Interest", "Principal", "Closing"];

export default function AmortisationTable({ rows, height }: AmortisationTableProps) {
  return (
    <>
      <div
        className="grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] px-5 py-2.5"
        style={{ borderBottom: `1px solid ${t.border.default}` }}
      >
        {COLUMNS.map((h, i) => (
          <div
            key={h}
            className={`text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-100/25 ${
              i === 0 ? "text-left" : "text-right"
            }`}
          >
            {h}
          </div>
        ))}
      </div>

      <div className="custom-scrollbar overflow-y-auto" style={{ maxHeight: height }}>
        {rows.map((row, ri) => (
          <div
            key={row.period}
            className="grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] px-5 py-2.5 text-[15px] tabular-nums transition-colors hover:bg-zinc-400/[0.04]"
            style={{ borderBottom: ri < rows.length - 1 ? `1px solid ${t.border.default}` : "none" }}
          >
            <div className="text-sm text-zinc-100/25">{row.period}</div>
            <div className="text-right text-zinc-100/35">{formatCurrency(row.opening_balance)}</div>
            <div className="text-right text-zinc-100/60">{formatCurrency(row.scheduled_repayment)}</div>
            <div className="text-right text-red-400/85">{formatCurrency(row.interest)}</div>
            <div className="text-right text-teal-400/85">{formatCurrency(row.principal_paid)}</div>
            <div className="text-right text-zinc-100/35">{formatCurrency(row.closing_balance)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
