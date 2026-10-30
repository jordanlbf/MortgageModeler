import type { ReactNode } from "react";
import type { YearData } from "@/lib/cashflow-types";

/** Props spread onto each body `TableRow` (selection state + row handlers). */
export interface YearRowProps {
  "data-state"?: "selected";
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export interface SubTableProps {
  yearData: YearData[];
  isInvestment: boolean;
  showOffset: boolean;
  formatYearCell: (year: number) => ReactNode;
  getRowProps: (year: number) => YearRowProps;
  visibleCols?: Record<string, boolean>;
}
