import type { LucideIcon } from "lucide-react";

export interface WizardStep<TState, TStepId extends string> {
  id: TStepId;
  title: string;
  icon?: LucideIcon;
  /** Whether this step has been satisfied. Drives natural-next derivation. */
  isComplete: (state: TState) => boolean;
  /** Optional Continue-button gate. Defaults to true when omitted. */
  isValid?: (state: TState) => boolean;
}
