import { ArrowDown, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDollars, formatDollarsSigned } from "@/lib/formatters";
import VariantRow from "../_components/VariantRow";
import { PROPERTIES } from "./seed";

type Property = (typeof PROPERTIES)[number];

function PropertyTable({ rows, sortable = false }: { rows: readonly Property[]; sortable?: boolean }) {
  return (
    <Table className="min-w-[560px]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[45%]" aria-sort={sortable ? "none" : undefined}>
            {sortable ? (
              <span className="flex items-center gap-1">Property <ArrowUpDown className="size-3 text-fg-muted" aria-hidden="true" /></span>
            ) : "Property"}
          </TableHead>
          <TableHead className="text-right" aria-sort={sortable ? "descending" : undefined}>
            {sortable ? (
              <span className="flex items-center justify-end gap-1 text-fg-primary">Value <ArrowDown className="size-3" aria-hidden="true" /></span>
            ) : "Value"}
          </TableHead>
          <TableHead className="text-right">Loan</TableHead>
          <TableHead className="text-right">Cashflow</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="h-20 text-center text-fg-tertiary">No properties yet</TableCell>
          </TableRow>
        ) : (
          rows.map((p) => (
            <TableRow key={p.address}>
              <TableCell className="max-w-0 truncate" title={p.address}>{p.address}</TableCell>
              <TableCell className="text-right tabular-nums">{formatDollars(Math.round(p.value))}</TableCell>
              <TableCell className="text-right tabular-nums">{formatDollars(p.loan) || "$0"}</TableCell>
              <TableCell className={`text-right tabular-nums ${p.cashflow < 0 ? "text-data-negative" : p.cashflow > 0 ? "text-data-positive" : "text-fg-tertiary"}`}>
                {formatDollarsSigned(p.cashflow)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

const YEARS = Array.from({ length: 22 }, (_, i) => 2026 + i);

export default function TablesSection() {
  return (
    <>
      <VariantRow label="empty">
        <div className="w-full overflow-x-auto"><PropertyTable rows={[]} /></div>
      </VariantRow>
      <VariantRow label="1 row">
        <div className="w-full overflow-x-auto"><PropertyTable rows={PROPERTIES.slice(0, 1)} /></div>
      </VariantRow>
      <VariantRow label="5 rows · truncation · sort indicators">
        <div className="w-full overflow-x-auto"><PropertyTable rows={PROPERTIES} sortable /></div>
      </VariantRow>
      <VariantRow label='variant="dense" · 20+ columns · pinned first column' wrap={false}>
        <div className="w-full overflow-x-auto rounded-lg ring-1 ring-border-subtle">
          <Table variant="dense" className="min-w-[1800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Item</TableHead>
                {YEARS.map((y) => <TableHead key={y}>{y}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["Rent", 31_200, 1.03],
                ["Interest", -43_742, 0.99],
                ["Depreciation", 8_400, 0.92],
              ].map(([name, base, g], r) => (
                <TableRow key={name as string} data-state={r === 1 ? "selected" : undefined}>
                  <TableCell>{name}</TableCell>
                  {YEARS.map((y, i) => {
                    const v = Math.round((base as number) * Math.pow(g as number, i));
                    return <TableCell key={y} className={v < 0 ? "text-data-negative" : undefined}>{formatDollarsSigned(v)}</TableCell>;
                  })}
                </TableRow>
              ))}
              <TableRow>
                <TableCell data-tone="net">Net</TableCell>
                {YEARS.map((y, i) => <TableCell key={y} data-tone="net" data-divider={i === 10 ? "strong" : undefined}>{formatDollarsSigned(-4_142 + i * 1_210)}</TableCell>)}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </VariantRow>
      <VariantRow label="loading skeleton">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Loan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[0, 1, 2].map((r) => (
                <TableRow key={r}>
                  <TableCell><Skeleton variant="inline" width="220px" height="12px" /></TableCell>
                  <TableCell className="text-right"><Skeleton variant="inline" width="80px" height="12px" /></TableCell>
                  <TableCell className="text-right"><Skeleton variant="inline" width="80px" height="12px" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </VariantRow>
    </>
  );
}
