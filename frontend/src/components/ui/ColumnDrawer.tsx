"use client";

import { useEffect } from "react";
import { Columns3, Check, Grip, X } from "lucide-react";
import { t } from "@/lib/theme";


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

export function ColumnDrawer({
  columns,
  visibleColumns,
  onToggleColumn,
  onReset,
  isOpen,
  onOpenChange,
}: ColumnDrawerProps) {
  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onOpenChange]);

  // Preserve first-appearance order of groups from the columns array
  const groups = Array.from(new Set(columns.map((c) => c.group)));

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 animate-overlay-in"
          style={{ background: t.surface.overlay }}
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-72 z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{
          background: t.card.base,
          borderLeft: `1px solid ${t.border.subtle}`,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          boxShadow: isOpen ? t.elevation.float : "none",
          backdropFilter: "blur(12px)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Column visibility settings"
      >
        {/* Drag handle */}
        <div
          className="flex justify-center py-3 border-b"
          style={{ borderColor: t.border.subtle }}
        >
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: t.border.default }}
          />
        </div>

        {/* Header */}
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: t.border.subtle }}
        >
          <div className="flex items-center justify-between">
            <h3
              className="text-[15px] font-semibold"
              style={{ color: t.fg.primary }}
            >
              Table Columns
            </h3>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: t.fg.muted }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = t.surface.hover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              aria-label="Close drawer"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-[12px] mt-1" style={{ color: t.fg.tertiary }}>
            Toggle columns to show or hide
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {groups.map((group) => {
            const groupColumns = columns.filter((c) => c.group === group);
            if (groupColumns.length === 0) return null;

            return (
              <div key={group} className="mb-5">
                <div
                  className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                  style={{ color: t.fg.muted }}
                >
                  {group}
                </div>
                <div className="flex flex-col gap-1">
                  {groupColumns.map((col) => {
                    const isVisible = visibleColumns[col.key];
                    return (
                      <button
                        key={col.key}
                        onClick={() => onToggleColumn(col.key)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                        style={{
                          background: isVisible
                            ? `color-mix(in srgb, ${t.brand.default} 10%, transparent)`
                            : t.surface.subtle,
                          border: `1px solid ${isVisible ? t.brand.default : "transparent"}`,
                        }}
                      >
                        <Grip size={14} style={{ color: t.fg.muted }} />
                        <span
                          className="flex-1 text-left text-[13px]"
                          style={{ color: t.fg.primary }}
                        >
                          {col.label}
                        </span>
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                          style={{
                            background: isVisible ? t.brand.default : "transparent",
                            border: `1.5px solid ${isVisible ? t.brand.default : t.border.default}`,
                          }}
                        >
                          {isVisible && (
                            <Check
                              size={12}
                              strokeWidth={3}
                              style={{ color: t.brand.contrast }}
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t"
          style={{ borderColor: t.border.subtle, background: t.surface.subtle }}
        >
          <button
            onClick={onReset}
            className="w-full py-2.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{ background: t.surface.hover, color: t.fg.secondary }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = t.surface.active)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = t.surface.hover)
            }
          >
            Reset to Default
          </button>
        </div>
      </div>
    </>
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
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
      style={{
        background: "transparent",
        color: t.fg.primary,
        border: `1px solid ${t.border.subtle}`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = t.surface.hover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      aria-label={`Edit columns. ${visibleCount} of ${totalCount} visible`}
    >
      <Columns3 size={15} style={{ color: t.fg.tertiary }} />
      <span>Edit Columns</span>
      <span
        className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ background: t.brand.default, color: t.brand.contrast }}
      >
        {visibleCount}
      </span>
    </button>
  );
}
