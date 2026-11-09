import { memo } from "react";
import type { ScheduleRow } from "@/lib/api";
import type { Frequency } from "@/lib/types";
import { PERIODS_PER_YEAR } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import { t } from "@/lib/theme";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AmortisationTableProps {
  /** The first repayment of each year, plus the last one. */
  rows: ScheduleRow[];
  frequency: Frequency;
  height: number;
}

const COLUMNS = [
  "Year",
  "Opening",
  "Repayment",
  "Interest",
  "Principal",
  "Closing",
];

/**
 * Real <table> rendered with grid rows (Table variant "bare"): the header
 * stays fixed while the body scrolls, and columns size exactly like the
 * original `52px 1fr…` grid.
 */
const ROW = "grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] px-5 py-2.5";
const BORDER = `1px solid ${t.border.default}`;

export default memo(function AmortisationTable({
  rows,
  frequency,
  height,
}: AmortisationTableProps) {
  const ppy = PERIODS_PER_YEAR[frequency];
  return (
    <div className="overflow-x-auto">
      <Table variant="bare" className="block min-w-[560px]">
        <TableHeader className="block">
          <TableRow className={ROW} style={{ borderBottom: BORDER }}>
            {COLUMNS.map((h, i) => (
              <TableHead
                key={h}
                scope="col"
                className={`text-[10px] font-semibold uppercase tracking-widest text-fg-muted ${
                  i === 0 ? "text-left" : "text-right"
                }`}
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody
          className="custom-scrollbar block overflow-y-auto"
          style={{ maxHeight: height }}
        >
          {rows.map((row, ri) => (
            <TableRow
              key={row.period}
              className={`${ROW} text-[15px] tabular-nums transition-colors`}
              style={{ borderBottom: ri < rows.length - 1 ? BORDER : "none" }}
            >
              <TableCell className="text-sm text-fg-tertiary">
                {ri === rows.length - 1 && ri > 0
                  ? "End"
                  : Math.floor((row.period - 1) / ppy) + 1}
              </TableCell>
              <TableCell className="text-right text-fg-tertiary">
                {formatCurrency(row.opening_balance)}
              </TableCell>
              <TableCell className="text-right text-fg-secondary">
                {formatCurrency(row.scheduled_repayment)}
              </TableCell>
              <TableCell className="text-right text-data-negative">
                {formatCurrency(row.interest)}
              </TableCell>
              <TableCell className="text-right text-brand">
                {formatCurrency(row.principal_paid)}
              </TableCell>
              <TableCell className="text-right text-fg-tertiary">
                {formatCurrency(row.closing_balance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
