"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SubTableProps } from "./types";

export default function SummaryTable({
  yearData,
  isInvestment,
  formatYearCell,
  getRowProps,
  visibleCols = {},
}: SubTableProps) {
  const show = (key: string) => visibleCols[key] !== false;

  return (
    <Table variant="dense">
      <TableHeader>
        <TableRow>
          <TableHead>Year</TableHead>
          {show("salary") && <TableHead>Salary</TableHead>}
          {show("rent") && isInvestment && <TableHead>Rent</TableHead>}
          {show("totalIn") && <TableHead data-tone="total">Total in</TableHead>}
          {show("holding") && <TableHead data-divider="subtle">Holding</TableHead>}
          {show("repay") && <TableHead>Repay</TableHead>}
          {show("tax") && <TableHead>Tax</TableHead>}
          {show("totalOut") && <TableHead data-tone="total">Total out</TableHead>}
          {show("net") && <TableHead data-tone="net" data-divider="subtle">Net</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {yearData.map((y) => {
          const totalIn = y.salary + (isInvestment ? y.rentalIncome : 0);
          const totalOut = y.ongoingCosts + y.loanRepayment + y.incomeTaxCalc;
          const net = totalIn - totalOut;

          return (
            <TableRow key={y.year} {...getRowProps(y.year)}>
              <TableCell>{formatYearCell(y.year)}</TableCell>
              {show("salary") && (
                <TableCell>{formatDollarsSigned(Math.round(y.salary))}</TableCell>
              )}
              {show("rent") && isInvestment && (
                <TableCell>{formatDollarsSigned(Math.round(y.rentalIncome))}</TableCell>
              )}
              {show("totalIn") && (
                <TableCell data-tone="total">{formatDollarsSigned(Math.round(totalIn))}</TableCell>
              )}
              {show("holding") && (
                <TableCell data-divider="subtle" className="text-data-negative">
                  {formatDollarsSigned(-Math.round(y.ongoingCosts))}
                </TableCell>
              )}
              {show("repay") && (
                <TableCell className="text-data-negative">
                  {formatDollarsSigned(-Math.round(y.loanRepayment))}
                </TableCell>
              )}
              {show("tax") && (
                <TableCell className="text-data-negative">
                  {formatDollarsSigned(-Math.round(y.incomeTaxCalc))}
                </TableCell>
              )}
              {show("totalOut") && (
                <TableCell data-tone="total" className="text-data-negative">
                  {formatDollarsSigned(-Math.round(totalOut))}
                </TableCell>
              )}
              {show("net") && (
                <TableCell data-tone="net" data-divider="subtle" className="text-data-positive">
                  {formatDollarsSigned(Math.round(net))}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
