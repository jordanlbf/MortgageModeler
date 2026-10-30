"use client";

import { useRef } from "react";
import { Columns3, Grip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export type ColumnKey = string;

export interface ColumnConfig {
  key: ColumnKey;
  label: string;
  group: string;
}

interface ColumnDrawerProps {
  columns: ColumnConfig[];
  visibleColumns: Record<ColumnKey, boolean>;
  onToggleColumn: (key: ColumnKey) => void;
  onReset: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Right-hand column-visibility drawer on a shadcn Sheet (variant `bare`).
 * Radix provides Escape / overlay close, focus trap, focus return and scroll lock.
 */
export function ColumnDrawer({
  columns,
  visibleColumns,
  onToggleColumn,
  onReset,
  isOpen,
  onOpenChange,
}: ColumnDrawerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Preserve first-appearance order of groups from the columns array
  const groups = Array.from(new Set(columns.map((c) => c.group)));

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        ref={contentRef}
        variant="bare"
        side="right"
        aria-label="Column visibility settings"
        overlayClassName="fixed inset-0 z-40 animate-overlay-in bg-surface-overlay"
        className="fixed top-0 right-0 z-50 flex h-full w-72 flex-col border-l border-border-subtle bg-card shadow-float backdrop-blur-[12px] outline-none data-[state=open]:animate-[drawer-in_300ms_ease-out] data-[state=closed]:animate-[drawer-out_300ms_ease-out] data-[state=closed]:shadow-none"
        // Before Radix, opening the drawer moved no focus; focus the panel
        // itself rather than ringing the close button.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          contentRef.current?.focus();
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center border-b border-border-subtle py-3">
          <div className="h-1 w-10 rounded-full bg-border-default" />
        </div>

        {/* Header */}
        <div className="border-b border-border-subtle px-5 py-4">
          <div className="flex items-center justify-between">
            {/* className goes on SheetTitle (merged by cn), not the h3:
                Slot only concatenates classes. */}
            <SheetTitle asChild className="text-[15px] font-semibold text-fg-primary">
              <h3>Table Columns</h3>
            </SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost-icon" size="icon" aria-label="Close drawer">
                <X size={16} />
              </Button>
            </SheetClose>
          </div>
          <SheetDescription className="mt-1 text-[12px] text-fg-tertiary">
            Toggle columns to show or hide
          </SheetDescription>
        </div>

        {/* Scrollable content */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
          {groups.map((group) => {
            const groupColumns = columns.filter((c) => c.group === group);
            if (groupColumns.length === 0) return null;

            return (
              <div key={group} className="mb-5">
                <div className="mb-3 text-[11px] font-semibold tracking-wider text-fg-muted uppercase">
                  {group}
                </div>
                <div className="flex flex-col gap-1">
                  {groupColumns.map((col) => {
                    const isVisible = !!visibleColumns[col.key];
                    return (
                      <label
                        key={col.key}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition-all",
                          isVisible
                            ? "border-brand bg-[color:color-mix(in_srgb,var(--color-brand)_10%,transparent)]"
                            : "border-transparent bg-surface-subtle",
                        )}
                      >
                        <Grip size={14} className="text-fg-muted" />
                        <span className="flex-1 text-left text-[13px] text-fg-primary">
                          {col.label}
                        </span>
                        <Checkbox
                          variant="lg"
                          checked={isVisible}
                          onCheckedChange={() => onToggleColumn(col.key)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border-subtle bg-surface-subtle p-4">
          <Button variant="soft" onClick={onReset} className="w-full py-2.5 text-[12px]">
            Reset to Default
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Trigger button to open the column drawer */
export function ColumnDrawerTrigger({
  visibleCount,
  totalCount,
  onClick,
}: {
  visibleCount: number;
  totalCount: number;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline-subtle"
      onClick={onClick}
      className="gap-2 px-3 py-2 text-[13px]"
      aria-label={`Edit columns. ${visibleCount} of ${totalCount} visible`}
    >
      <Columns3 size={15} className="text-fg-tertiary" />
      <span>Edit Columns</span>
      <Badge variant="count">{visibleCount}</Badge>
    </Button>
  );
}
