"use client";

import { Fragment, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { CostItem } from "@/hooks/usePurchaseCostsState";
import { formatDollars } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type CostRow = CostItem;

/** Shorter names for phone widths. */
const SHORT_NAME: Partial<Record<CostItem["key"], string>> = { lmi: "LMI" };

const HEAD = "h-9 text-[11px] font-medium uppercase tracking-[0.06em] text-fg-tertiary";
const NUM = "w-[112px] py-3 pr-1 text-right align-top text-[13.5px] font-semibold tabular-nums max-sm:w-[96px]";

/**
 * Itemised table: deposit, then each cost, with each row's share of the cash
 * needed (the total is the hero number above, so there's no total row).
 * Column headings are for screen readers only. Dots match the donut. Rows
 * with line items (fees, concessions) expand in place. `empty` shows "—"
 * before an estimate.
 */
export default function CostTable({
  rows,
  total,
  empty,
  active,
  onActive,
}: {
  rows: CostRow[];
  total: number | null;
  empty: boolean;
  active: string | null;
  onActive: (key: string | null) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <Table className="table-fixed" onMouseLeave={() => onActive(null)}>
      {/* Column widths live here: the heading row is screen-reader only, so it can't size the columns. */}
      <colgroup>
        <col />
        <col className="w-[72px] max-sm:w-0" />
        <col className="w-[112px] max-sm:w-[96px]" />
      </colgroup>
      <TableHeader className="sr-only">
        <TableRow className="border-border-subtle hover:bg-transparent">
          <TableHead className={`${HEAD} pl-1`}>Item</TableHead>
          <TableHead className={`${HEAD} w-[72px] text-right max-sm:hidden`}>Share</TableHead>
          <TableHead className={`${HEAD} w-[112px] pr-1 text-right max-sm:w-[96px]`}>Amount</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((item) => {
          const dim = active !== null && active !== item.key;
          const zero = item.amount === 0 && !item.saving;
          const lines = empty ? [] : (item.details ?? []);
          const expanded = open.has(item.key);
          const hover = (e: React.PointerEvent) => { if (e.pointerType === "mouse") onActive(item.saving ? null : item.key); };
          const color = item.saving ? "var(--color-data-positive)" : item.color;
          return (
            <Fragment key={item.key}>
              <TableRow
                className="border-border-subtle transition-opacity duration-150 hover:bg-transparent"
                style={{ opacity: dim ? 0.4 : 1 }}
                onPointerEnter={hover}
              >
                <TableCell className="py-3 pr-3 pl-1 whitespace-normal">
                  <span className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-[5px] size-2 shrink-0 rounded-[3px]" style={{ background: color, opacity: zero ? 0.4 : 1 }} aria-hidden="true" />
                    <span className="flex min-w-0 flex-col items-start gap-0.5">
                      {lines.length > 0 ? (
                        <Button
                          variant="ghost-muted"
                          aria-expanded={expanded}
                          onClick={() => toggle(item.key)}
                          className="-my-1 -ml-1.5 flex h-7 min-w-0 items-center gap-1 rounded-md px-1.5 text-[13.5px] font-medium text-fg-primary"
                        >
                          <span className="truncate">{item.name}</span>
                          <ChevronRight
                            size={14}
                            className={`shrink-0 text-fg-tertiary transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                            aria-hidden="true"
                          />
                        </Button>
                      ) : (
                        <span className={`text-[13.5px] font-medium ${zero ? "text-fg-tertiary" : "text-fg-primary"}`}>
                          {SHORT_NAME[item.key] ? (
                            <>
                              <span className="max-sm:hidden">{item.name}</span>
                              <span className="sm:hidden">{SHORT_NAME[item.key]}</span>
                            </>
                          ) : item.name}
                        </span>
                      )}
                      {!empty && (item.subtitle || lines.length > 0) && (
                        <span className="text-[12px] tabular-nums text-fg-tertiary">
                          {item.subtitle || `${lines.length} items`}
                        </span>
                      )}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="w-[72px] py-3 text-right align-top max-sm:hidden">
                  {!empty && total && item.amount > 0 ? (
                    <Badge
                      variant="soft"
                      style={item.saving ? ({ "--badge-accent": "var(--color-data-positive)" } as React.CSSProperties) : undefined}
                    >
                      {item.saving ? "−" : ""}{Math.round((item.amount / total) * 100)}%
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className={`${NUM} ${item.saving ? "text-data-positive" : zero ? "text-fg-tertiary" : "text-fg-primary"}`}>
                  {empty ? <span className="font-normal text-fg-muted">—</span> : item.saving ? `−${formatDollars(item.amount)}` : formatDollars(item.amount) || "$0"}
                </TableCell>
              </TableRow>

              {expanded && lines.map((d, i) => {
                const last = i === lines.length - 1;
                return (
                  <TableRow
                    key={d.label}
                    className={`transition-opacity duration-150 hover:bg-transparent ${last ? "border-border-subtle" : "border-0"}`}
                    style={{ opacity: dim ? 0.4 : 1 }}
                    onPointerEnter={hover}
                  >
                    <TableCell className={`py-[5px] pr-3 pl-[26px] text-[12.5px] text-fg-secondary ${last ? "pb-3" : ""}`}>
                      <span className="flex items-center gap-2.5">
                        <span className="h-px w-2.5 shrink-0 bg-border-default" aria-hidden="true" />
                        <span className="truncate">{d.label}</span>
                      </span>
                    </TableCell>
                    <TableCell className="max-sm:hidden" />
                    <TableCell
                      className={`py-[5px] pr-1 text-right text-[12.5px] tabular-nums ${d.value.startsWith("−") ? "text-data-positive" : "text-fg-secondary"} ${last ? "pb-3" : ""}`}
                    >
                      {d.value}
                    </TableCell>
                  </TableRow>
                );
              })}
            </Fragment>
          );
        })}
      </TableBody>

    </Table>
  );
}
