import {
  Building2,
  Calculator,
  Coins,
  DollarSign,
  Home,
  Key,
  Landmark,
  Percent,
  Receipt,
  type LucideIcon,
} from "lucide-react";

import type { WizardStep } from "@/components/ui/wizard";
import type { CashflowState } from "@/hooks/useCashflowState";
import type { StepId } from "@/lib/cashflow-types";

/**
 * Single source of truth for the cashflow wizard's step list. Extends the
 * generic WizardStep with cashflow-specific sidebar labels/icons (the side
 * nav uses verbose names + different glyphs from the breadcrumb shell).
 */
export interface CashflowStep extends WizardStep<CashflowState, StepId> {
  sidebarTitle: string;
  sidebarIcon: LucideIcon;
}

const ALL_STEPS: CashflowStep[] = [
  {
    id: "setup",
    title: "Property Setup",
    sidebarTitle: "Property Setup",
    icon: Home,
    sidebarIcon: Home,
    isComplete: (s) => s.setupComplete,
    isValid: (s) => !!s.propertyUse && !!s.purchaseMode,
  },
  {
    id: "property",
    title: "Property",
    sidebarTitle: "Property Details",
    icon: Building2,
    sidebarIcon: Building2,
    isComplete: (s) => s.propertyComplete,
  },
  {
    id: "loan",
    title: "Loan",
    sidebarTitle: "Loan Terms",
    icon: Landmark,
    sidebarIcon: Percent,
    isComplete: (s) => s.loanComplete,
  },
  {
    id: "costs",
    title: "Costs",
    sidebarTitle: "Running Costs",
    icon: Coins,
    sidebarIcon: Receipt,
    isComplete: (s) => s.costsComplete,
  },
  {
    id: "rental",
    title: "Rental Income",
    sidebarTitle: "Rental Income",
    icon: Key,
    sidebarIcon: DollarSign,
    isComplete: (s) => s.rentalComplete,
  },
  {
    id: "tax",
    title: "Tax",
    sidebarTitle: "Tax Details",
    icon: Calculator,
    sidebarIcon: Calculator,
    isComplete: (s) => s.taxComplete,
  },
];

export function getCashflowSteps(isInvestment: boolean): CashflowStep[] {
  if (isInvestment) return ALL_STEPS;
  return ALL_STEPS.filter((s) => s.id !== "rental").map((s) =>
    s.id === "tax"
      ? { ...s, title: "Income", sidebarTitle: "Income & Growth" }
      : s,
  );
}
