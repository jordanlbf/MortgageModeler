import type { ReactNode } from "react";
import type { YearData } from "@/lib/cashflow-types";

export interface SubTableProps {
  yearData: YearData[];
  isInvestment: boolean;
  showOffset: boolean;
  propertyValue: number;
  depColor: string;
  isGroupExpanded: (group: string) => boolean;
  toggleGroup: (group: string) => void;
  isRowVisible: (year: number) => boolean;
  isMilestoneYear: (year: number) => boolean;
  formatYearCell: (year: number, index: number, isMilestoneRow?: boolean) => ReactNode;
  getRowClass: (year: number, isMilestoneRow?: boolean) => string;
  getRowHandlers: (year: number, isMilestone: boolean) => {
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}
