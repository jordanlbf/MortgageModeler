import {
  Briefcase,
  Building2,
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
    id: "income",
    title: "Income Details",
    sidebarTitle: "Income Details",
    icon: Briefcase,
    sidebarIcon: Briefcase,
    isComplete: (s) => s.incomeComplete,
  },
  {
    id: "depreciation",
    title: "Depreciation",
    sidebarTitle: "Depreciation",
    icon: Building2,
    sidebarIcon: Building2,
    isComplete: (s) => s.depreciationComplete,
  },
];

export function getCashflowSteps(isInvestment: boolean): CashflowStep[] {
  if (isInvestment) return ALL_STEPS;
  // PPOR: no rental, no depreciation
  return ALL_STEPS.filter((s) => s.id !== "rental" && s.id !== "depreciation");
}
