import type { ReactNode, TdHTMLAttributes } from "react";

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  tone?: "data" | "emphasis";
  animated?: boolean;
}

/**
 * Standard data cell for Cashflow tables.
 * - tone="data" (default) — --color-data-primary for tabular numbers
 * - tone="emphasis" — --color-data-emphasis for headline values
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
      ? "text-[var(--color-data-emphasis)]"
      : "text-[var(--color-data-primary)]";
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
