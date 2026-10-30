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

export default function DeductionsTable({
  yearData,
  isInvestment,
  formatYearCell,
  getRowProps,
  visibleCols = {},
}: SubTableProps) {
  const show = (key: string) => visibleCols[key] !== false;
  const showInv = (key: string) => isInvestment && show(key);

  return (
    <Table variant="dense">
      <TableHeader>
        <TableRow>
          <TableHead>Year</TableHead>
          {show("holding") && <TableHead>Holding</TableHead>}
          {showInv("interest") && <TableHead>Interest</TableHead>}
          {showInv("div43") && <TableHead data-divider="subtle">Div 43</TableHead>}
          {showInv("div40") && <TableHead>Div 40</TableHead>}
          {showInv("totalDepr") && <TableHead data-tone="total">Total depreciation</TableHead>}
          {show("totalDed") && (
            <TableHead data-tone="net" data-divider="subtle">
              {isInvestment ? "Total deductions" : "Total expenses"}
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {yearData.map((y) => {
          const depr = y.depDiv43 + y.depDiv40;
          const totalDed = isInvestment ? y.ongoingCosts + y.interestPortion + depr : y.ongoingCosts;

          return (
            <TableRow key={y.year} {...getRowProps(y.year)}>
              <TableCell>{formatYearCell(y.year)}</TableCell>
              {show("holding") && (
                <TableCell>{formatDollarsSigned(Math.round(y.ongoingCosts))}</TableCell>
              )}
              {showInv("interest") && (
                <TableCell>{formatDollarsSigned(Math.round(y.interestPortion))}</TableCell>
              )}
              {showInv("div43") && (
                <TableCell data-divider="subtle">{formatDollarsSigned(Math.round(y.depDiv43))}</TableCell>
              )}
              {showInv("div40") && (
                <TableCell>{formatDollarsSigned(Math.round(y.depDiv40))}</TableCell>
              )}
              {showInv("totalDepr") && (
                <TableCell data-tone="total">{formatDollarsSigned(Math.round(depr))}</TableCell>
              )}
              {show("totalDed") && (
                <TableCell data-tone="net" data-divider="subtle" className="text-data-positive">
                  {formatDollarsSigned(Math.round(totalDed))}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
