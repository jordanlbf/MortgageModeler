import type { ReactNode } from "react";
import type { YearData } from "@/lib/cashflow-types";

export interface SubTableProps {
  yearData: YearData[];
  isInvestment: boolean;
  showOffset: boolean;
  propertyValue: number;
  depColor: string;
  formatYearCell: (year: number, index: number) => ReactNode;
  getRowClass: (year: number) => string;
  getRowHandlers: (year: number) => {
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  visibleCols?: Record<string, boolean>;
}
