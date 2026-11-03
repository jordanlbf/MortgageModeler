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

import type { WizardStep } from "@/components/domain/wizard";
import { setupAnswered } from "./property-options";
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
    isValid: setupAnswered,
  },
  {
    id: "loan",
    title: "Loan",
    sidebarTitle: "Loan Terms",
    icon: Landmark,
    sidebarIcon: Percent,
    isComplete: (s) => s.loanComplete,
    // Rate and term start blank, so both must be entered to continue.
    isValid: (s) => parseFloat(s.interestRate) > 0 && parseFloat(s.loanTerm) > 0,
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

/** `isLand`: vacant land has no building to depreciate, so no Depreciation step. */
export function getCashflowSteps(isInvestment: boolean, isLand = false): CashflowStep[] {
  if (isInvestment) return isLand ? ALL_STEPS.filter((s) => s.id !== "depreciation") : ALL_STEPS;
  // PPOR: no rental, no depreciation
  return ALL_STEPS.filter((s) => s.id !== "rental" && s.id !== "depreciation");
}
