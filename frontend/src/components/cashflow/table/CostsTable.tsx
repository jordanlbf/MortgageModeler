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

export default function CostsTable({
  yearData,
  formatYearCell,
  getRowProps,
  visibleCols = {},
}: SubTableProps) {
  // A column is shown if (a) it's toggled on in the drawer AND
  // (b) at least one year has a non-zero value for it. Avoids rendering a
  // column of all-zero cells when the property has no strata / no management
  // / no landlord insurance etc.
  const hasAny = {
    councilRates:      yearData.some((y) => y.councilRates > 0),
    waterRates:        yearData.some((y) => y.waterRates > 0),
    buildingInsurance: yearData.some((y) => y.insurance > 0),
    landlordInsurance: yearData.some((y) => y.landlordInsurance > 0),
    maintenance:       yearData.some((y) => y.maintenance > 0),
    strataFees:        yearData.some((y) => y.strataFees > 0),
    managementFee:     yearData.some((y) => y.managementFee > 0),
    totalCosts:        true,
  } as const;

  const show = (key: keyof typeof hasAny) =>
    visibleCols[key] !== false && hasAny[key];

  return (
    <Table variant="dense">
      <TableHeader>
        <TableRow>
          <TableHead>Year</TableHead>
          {show("councilRates")      && <TableHead>Council</TableHead>}
          {show("waterRates")        && <TableHead>Water</TableHead>}
          {show("buildingInsurance") && <TableHead>Building ins.</TableHead>}
          {show("landlordInsurance") && <TableHead>Landlord ins.</TableHead>}
          {show("maintenance")       && <TableHead>Maintenance</TableHead>}
          {show("strataFees")        && <TableHead>Strata</TableHead>}
          {show("managementFee")     && <TableHead>Management</TableHead>}
          {show("totalCosts")        && <TableHead data-tone="net" data-divider="subtle">Total</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {yearData.map((y) => (
          <TableRow key={y.year} {...getRowProps(y.year)}>
            <TableCell>{formatYearCell(y.year)}</TableCell>
            {show("councilRates") && (
              <TableCell className="text-data-negative">{formatDollarsSigned(-Math.round(y.councilRates))}</TableCell>
            )}
            {show("waterRates") && (
              <TableCell className="text-data-negative">{formatDollarsSigned(-Math.round(y.waterRates))}</TableCell>
            )}
            {show("buildingInsurance") && (
              <TableCell className="text-data-negative">{formatDollarsSigned(-Math.round(y.insurance))}</TableCell>
            )}
            {show("landlordInsurance") && (
              <TableCell className="text-data-negative">{formatDollarsSigned(-Math.round(y.landlordInsurance))}</TableCell>
            )}
            {show("maintenance") && (
              <TableCell className="text-data-negative">{formatDollarsSigned(-Math.round(y.maintenance))}</TableCell>
            )}
            {show("strataFees") && (
              <TableCell className="text-data-negative">{formatDollarsSigned(-Math.round(y.strataFees))}</TableCell>
            )}
            {show("managementFee") && (
              <TableCell className="text-data-negative">{formatDollarsSigned(-Math.round(y.managementFee))}</TableCell>
            )}
            {show("totalCosts") && (
              <TableCell data-tone="net" data-divider="subtle" className="text-data-negative">
                {formatDollarsSigned(-Math.round(y.ongoingCosts))}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
