import type { ReactNode, TdHTMLAttributes } from "react";

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  tone?: "data" | "emphasis";
  animated?: boolean;
}

/**
 * Standard data cell for Cashflow tables.
 * - tone="data" (default) — softer --color-fg-table for tabular numbers
 * - tone="emphasis" — full --color-foreground for headline values
 */
export default function TableCell({
  children,
  tone = "data",
  animated = true,
  className = "",
  ...rest
}: TableCellProps) {
  const toneClass =
    tone === "emphasis"
      ? "text-[var(--color-foreground)]"
      : "text-[var(--color-fg-table)]";
  const animClass = animated ? "animate-col-fade-in" : "";

  return (
    <td
      className={[
        "h-[52px] box-border px-3 text-right align-middle",
        "border-b border-b-white/[0.07]",
        toneClass,
        animClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </td>
  );
}
