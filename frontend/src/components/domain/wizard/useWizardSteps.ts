"use client";

import { useMemo } from "react";

import type { WizardStep } from "./types";

export interface UseWizardStepsResult<TStepId extends string> {
  /** First step where isComplete returns false, or null when all complete. */
  naturalStep: TStepId | null;
  allComplete: boolean;
  totalSteps: number;
  indexOf: (id: TStepId) => number;
  isComplete: (id: TStepId) => boolean;
  /** Result of step.isValid(state); true if no validator was supplied. */
  isValid: (id: TStepId) => boolean;
}

export function useWizardSteps<TState, TStepId extends string>(
  steps: WizardStep<TState, TStepId>[],
  state: TState,
): UseWizardStepsResult<TStepId> {
  return useMemo(() => {
    const completion = steps.map((step) => step.isComplete(state));
    const firstIncomplete = completion.findIndex((done) => !done);
    const naturalStep = firstIncomplete === -1 ? null : steps[firstIncomplete].id;

    const indexOf = (id: TStepId) => steps.findIndex((s) => s.id === id);
    const isComplete = (id: TStepId) => {
      const idx = indexOf(id);
      return idx === -1 ? false : completion[idx];
    };
    const isValid = (id: TStepId) => {
      const step = steps[indexOf(id)];
      if (!step) return false;
      return step.isValid ? step.isValid(state) : true;
    };

    return {
      naturalStep,
      allComplete: firstIncomplete === -1,
      totalSteps: steps.length,
      indexOf,
      isComplete,
      isValid,
    };
  }, [steps, state]);
}
