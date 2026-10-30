"use client";

import { Fragment, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { CostItem } from "@/hooks/usePurchaseCostsState";
import { PURCHASE_COST_COLORS } from "@/lib/theme";
import { formatDollars } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** Shorter names for phone widths. */
const SHORT_NAME: Partial<Record<CostItem["key"], string>> = { lmi: "LMI" };

/**
 * Itemised list: the deposit, then each cost. The colour dots double as the
 * cash bar's legend. Line items (fees, concessions) fold away under their row.
 * `empty` shows "—" before there's an estimate.
 */
export default function CostTable({
  items,
  deposit,
  empty,
  active,
  onActive,
}: {
  items: CostItem[];
  deposit: number;
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

  const rows: CostItem[] = [
    { key: "deposit", name: "Deposit", amount: deposit, color: PURCHASE_COST_COLORS.deposit, subtitle: "" },
    ...items,
  ];

  return (
    <Table variant="bare" className="w-full table-fixed border-collapse text-left" onMouseLeave={() => onActive(null)}>
      <TableHeader className="sr-only">
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((item) => {
          const dim = active !== null && active !== item.key;
          const zero = item.amount === 0 && !item.saving;
          const lines = empty ? [] : (item.details ?? []);
          const expanded = open.has(item.key);
          const hover = (e: React.PointerEvent) => { if (e.pointerType === "mouse") onActive(item.saving ? null : item.key); };
          return (
            <Fragment key={item.key}>
              <TableRow
                className="border-t border-border-subtle transition-opacity duration-150 first:border-t-0"
                style={{ opacity: dim ? 0.4 : 1 }}
                onPointerEnter={hover}
              >
                <TableCell className="py-3 pr-3 pl-2">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="size-2 shrink-0 rounded-[3px]"
                      style={{ background: item.saving ? "var(--color-data-positive)" : item.color, opacity: zero ? 0.4 : 1 }}
                      aria-hidden="true"
                    />
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
                      <span className={`truncate text-[13.5px] font-medium ${zero ? "text-fg-tertiary" : "text-fg-primary"}`}>
                        {SHORT_NAME[item.key] ? (
                          <>
                            <span className="max-sm:hidden">{item.name}</span>
                            <span className="sm:hidden">{SHORT_NAME[item.key]}</span>
                          </>
                        ) : item.name}
                      </span>
                    )}
                    {item.subtitle && !empty && (
                      <span className="truncate text-[12px] tabular-nums text-fg-tertiary max-sm:hidden">{item.subtitle}</span>
                    )}
                  </span>
                </TableCell>
                <TableCell
                  className={`w-[112px] py-3 pr-2 text-right text-[13.5px] font-semibold tabular-nums max-sm:w-[92px] ${
                    item.saving ? "text-data-positive" : zero ? "text-fg-tertiary" : "text-fg-primary"
                  }`}
                >
                  {empty ? <span className="font-normal text-fg-muted">—</span> : item.saving ? `−${formatDollars(item.amount)}` : formatDollars(item.amount) || "$0"}
                </TableCell>
              </TableRow>

              {expanded && lines.map((d, i) => {
                const last = i === lines.length - 1 ? "pb-3" : "";
                return (
                  <TableRow key={d.label} className="transition-opacity duration-150" style={{ opacity: dim ? 0.4 : 1 }} onPointerEnter={hover}>
                    <TableCell className={`py-[5px] pr-3 pl-[26px] text-[12.5px] text-fg-secondary ${last}`}>
                      <span className="flex items-center gap-2.5">
                        <span className="h-px w-2.5 shrink-0 bg-border-default" aria-hidden="true" />
                        <span className="truncate">{d.label}</span>
                      </span>
                    </TableCell>
                    <TableCell
                      className={`py-[5px] pr-2 text-right text-[12.5px] tabular-nums ${d.value.startsWith("−") ? "text-data-positive" : "text-fg-secondary"} ${last}`}
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
