"use client";

import { formatDollarsSigned, safeDiv } from "@/lib/formatters";
import { t, LVR_COLORS } from "@/lib/theme";
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
        <span className="text-[10px] font-normal" style={{ color: t.fg.muted }}>
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
  getRowClass,
  getRowHandlers,
  visibleCols = {},
}: SubTableProps) {
  const show = (key: string) => visibleCols[key] !== false;

  return (
    <table className="w-full text-[12px] table-fixed">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider sticky left-0 z-[1] w-16" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Year</th>
          {show("propertyValue") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.secondary, background: t.surface.subtle, fontWeight: 600 }}>Property value</th>}
          {show("loanBalance") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l" style={{ color: t.fg.tertiary, background: t.surface.subtle, borderColor: t.border.subtle }}>Loan balance</th>}
          {show("offsetBalance") && showOffset && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>Offset balance</th>}
          {show("netEquity") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider border-l" style={{ color: t.brand.default, background: t.surface.subtle, fontWeight: 600, borderColor: t.border.subtle }}>Net equity</th>}
          {show("lvr") && <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider" style={{ color: t.fg.tertiary, background: t.surface.subtle }}>LVR</th>}
        </tr>
      </thead>
      <tbody>
        {yearData.map((y, i) => {
          const prev = i > 0 ? yearData[i - 1] : null;
          const isSelected = getRowClass(y.year).includes("bg-brand");
          const lvr = safeDiv(y.loanBalance, y.propertyValue) * 100;

          const valueYoY = prev ? yoyPct(y.propertyValue, prev.propertyValue) : 0;
          const equityYoY = prev ? yoyPct(y.netEquity, prev.netEquity) : 0;

          return (
            <tr key={y.year} className={getRowClass(y.year)} {...getRowHandlers(y.year)}>
              <td className="px-3 py-2 text-left text-[12px] font-medium sticky left-0 z-[1] border-t" style={{ color: isSelected ? t.brand.default : t.fg.primary, background: isSelected ? t.surface.hover : t.card.base, borderColor: t.border.subtle }}>
                {formatYearCell(y.year, i)}
              </td>
              {show("propertyValue") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.fg.primary, fontWeight: 500, borderColor: t.border.subtle }}>
                  <GainCell
                    value={formatDollarsSigned(Math.round(y.propertyValue))}
                    gain={fmtYoY(valueYoY)}
                    showGain={!!prev}
                  />
                </td>
              )}
              {show("loanBalance") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t border-l" style={{ color: t.data.negative, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(-Math.round(y.loanBalance))}
                </td>
              )}
              {show("offsetBalance") && showOffset && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: t.fg.primary, borderColor: t.border.subtle }}>
                  {formatDollarsSigned(Math.round(y.offsetBalanceAtYear))}
                </td>
              )}
              {show("netEquity") && (
                <td className="px-3 py-2 text-right text-[13px] tabular-nums border-t border-l" style={{ color: t.data.positive, fontWeight: 600, borderColor: t.border.subtle }}>
                  <GainCell
                    value={formatDollarsSigned(Math.round(y.netEquity))}
                    gain={fmtYoY(equityYoY)}
                    showGain={!!prev}
                  />
                </td>
              )}
              {show("lvr") && (
                <td className="px-3 py-2 text-right text-[12px] tabular-nums border-t" style={{ color: getLvrColor(lvr), borderColor: t.border.subtle }}>
                  {lvr.toFixed(1)}%
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
