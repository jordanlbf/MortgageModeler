"use client";

import { formatDollarsSigned } from "@/lib/formatters";
import { getMarginalTaxRate } from "@/lib/cashflow-calculations";
import { t } from "@/lib/theme";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SubTableProps } from "./types";

export default function TaxTable({
  yearData,
  isInvestment,
  formatYearCell,
  getRowProps,
  visibleCols = {},
}: SubTableProps) {
  if (!isInvestment) return null;

  const show = (key: string) => visibleCols[key] !== false;

  return (
    <Table variant="dense">
      <TableHeader>
        <TableRow>
          <TableHead>Year</TableHead>
          {show("holding") && <TableHead>Holding</TableHead>}
          {show("interest") && <TableHead>Interest</TableHead>}
          {show("depr") && <TableHead>Depr.</TableHead>}
          {show("totalDed") && <TableHead data-tone="total">Total ded.</TableHead>}
          {show("taxSaved") && <TableHead data-divider="subtle">Tax effect</TableHead>}
          {show("bracket") && <TableHead>Bracket</TableHead>}
          {show("netTaxCost") && <TableHead data-tone="net" data-divider="subtle">Net tax cost</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {yearData.map((y) => {
          const depr = y.depDiv43 + y.depDiv40;
          const totalDed = y.ongoingCosts + y.interestPortion + depr;
          const taxableIncome = y.grossIncome - y.totalDeductionsForTax;
          const bracket = getMarginalTaxRate(taxableIncome);

          return (
            <TableRow key={y.year} {...getRowProps(y.year)}>
              <TableCell>{formatYearCell(y.year)}</TableCell>
              {show("holding") && (
                <TableCell>{formatDollarsSigned(Math.round(y.ongoingCosts))}</TableCell>
              )}
              {show("interest") && (
                <TableCell>{formatDollarsSigned(Math.round(y.interestPortion))}</TableCell>
              )}
              {show("depr") && (
                <TableCell>{formatDollarsSigned(Math.round(depr))}</TableCell>
              )}
              {show("totalDed") && (
                <TableCell data-tone="total">{formatDollarsSigned(Math.round(totalDed))}</TableCell>
              )}
              {show("taxSaved") && (
                <TableCell
                  data-divider="subtle"
                  style={{ color: y.taxSaved > 0 ? t.data.positive : y.taxSaved < 0 ? t.data.negative : t.fg.primary }}
                >
                  {y.taxSaved > 0 ? "+" : ""}{formatDollarsSigned(Math.round(y.taxSaved))}
                </TableCell>
              )}
              {show("bracket") && (
                <TableCell>{(bracket * 100).toFixed(bracket % 0.01 === 0 ? 0 : 1)}%</TableCell>
              )}
              {show("netTaxCost") && (
                <TableCell data-tone="net" data-divider="subtle" className="text-data-negative">
                  {formatDollarsSigned(-Math.round(y.incomeTaxCalc))}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
