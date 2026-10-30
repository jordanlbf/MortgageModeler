import { memo } from "react";
import type { ScheduleRow } from "@/lib/api";
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
  rows: ScheduleRow[];
  height: number;
}

const COLUMNS = ["#", "Opening", "Payment", "Interest", "Principal", "Closing"];

/**
 * Real <table> rendered with grid rows (Table variant "bare"): the header
 * stays fixed while the body scrolls, and columns size exactly like the
 * original `52px 1fr…` grid.
 */
const ROW = "grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] px-5 py-2.5";
const BORDER = `1px solid ${t.border.default}`;

export default memo(function AmortisationTable({ rows, height }: AmortisationTableProps) {
  return (
    <Table variant="bare" className="block">
      <TableHeader className="block">
        <TableRow className={ROW} style={{ borderBottom: BORDER }}>
          {COLUMNS.map((h, i) => (
            <TableHead
              key={h}
              scope="col"
              className={`text-[10px] font-semibold uppercase tracking-widest text-fg-primary/25 ${
                i === 0 ? "text-left" : "text-right"
              }`}
            >
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody className="custom-scrollbar block overflow-y-auto" style={{ maxHeight: height }}>
        {rows.map((row, ri) => (
          <TableRow
            key={row.period}
            className={`${ROW} text-[15px] tabular-nums transition-colors`}
            style={{ borderBottom: ri < rows.length - 1 ? BORDER : "none" }}
          >
            <TableCell className="text-sm text-fg-primary/25">{row.period}</TableCell>
            <TableCell className="text-right text-fg-primary/35">{formatCurrency(row.opening_balance)}</TableCell>
            <TableCell className="text-right text-fg-primary/60">{formatCurrency(row.scheduled_repayment)}</TableCell>
            <TableCell className="text-right text-red-400/85">{formatCurrency(row.interest)}</TableCell>
            <TableCell className="text-right text-brand/85">{formatCurrency(row.principal_paid)}</TableCell>
            <TableCell className="text-right text-fg-primary/35">{formatCurrency(row.closing_balance)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
})
