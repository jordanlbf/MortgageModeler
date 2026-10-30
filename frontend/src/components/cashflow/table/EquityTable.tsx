"use client";

import { formatDollarsSigned, safeDiv } from "@/lib/formatters";
import { LVR_COLORS } from "@/lib/theme";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { yoyPct, fmtYoY } from "./helpers";
import type { SubTableProps } from "./types";

function getLvrColor(lvr: number): string {
  if (lvr <= 60) return LVR_COLORS.safe;
  if (lvr <= 80) return LVR_COLORS.moderate;
  return LVR_COLORS.high;
}

// Gain badge that sits to the LEFT of the number so the number stays pinned to the cell's right edge.
function GainCell({ value, gain, showGain }: { value: string; gain?: string; showGain: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      {showGain && gain && (
        <span className="text-[10px] font-normal text-fg-muted">
          {gain}
        </span>
      )}
      <span>{value}</span>
    </span>
  );
}

export default function EquityTable({
  yearData,
  showOffset,
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
          {show("propertyValue") && <TableHead data-tone="total">Property value</TableHead>}
          {show("loanBalance") && <TableHead data-divider="subtle">Loan balance</TableHead>}
          {show("offsetBalance") && showOffset && <TableHead>Offset balance</TableHead>}
          {show("netEquity") && <TableHead data-tone="net" data-divider="subtle">Net equity</TableHead>}
          {show("lvr") && <TableHead>LVR</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {yearData.map((y, i) => {
          const prev = i > 0 ? yearData[i - 1] : null;
          const lvr = safeDiv(y.loanBalance, y.propertyValue) * 100;

          const valueYoY = prev ? yoyPct(y.propertyValue, prev.propertyValue) : 0;
          const equityYoY = prev ? yoyPct(y.netEquity, prev.netEquity) : 0;

          return (
            <TableRow key={y.year} {...getRowProps(y.year)}>
              <TableCell>{formatYearCell(y.year)}</TableCell>
              {show("propertyValue") && (
                <TableCell data-tone="total">
                  <GainCell
                    value={formatDollarsSigned(Math.round(y.propertyValue))}
                    gain={fmtYoY(valueYoY)}
                    showGain={!!prev}
                  />
                </TableCell>
              )}
              {show("loanBalance") && (
                <TableCell data-divider="subtle" className="text-data-negative">
                  {formatDollarsSigned(-Math.round(y.loanBalance))}
                </TableCell>
              )}
              {show("offsetBalance") && showOffset && (
                <TableCell>{formatDollarsSigned(Math.round(y.offsetBalanceAtYear))}</TableCell>
              )}
              {show("netEquity") && (
                <TableCell data-tone="net" data-divider="subtle" className="text-data-positive">
                  <GainCell
                    value={formatDollarsSigned(Math.round(y.netEquity))}
                    gain={fmtYoY(equityYoY)}
                    showGain={!!prev}
                  />
                </TableCell>
              )}
              {show("lvr") && (
                <TableCell style={{ color: getLvrColor(lvr) }}>
                  {lvr.toFixed(1)}%
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
