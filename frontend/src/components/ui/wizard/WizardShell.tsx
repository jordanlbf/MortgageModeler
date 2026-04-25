"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface WizardShellProps {
  /** Title of the active step (e.g. "Property Setup"). */
  stepTitle: string;
  /** 1-based index, e.g. 3 for the third step. */
  stepIndex: number;
  totalSteps: number;

  /** Body of the active step. */
  children: ReactNode;
  /** Centre the body horizontally — used by intro-style steps. */
  bodyAlign?: "start" | "center";

  /** Continue/Save/Calculate button label. */
  ctaLabel: string;
  ctaDisabled?: boolean;
  /** When true, the CTA is fixed-width instead of stretching. */
  ctaCompact?: boolean;
  onContinue: () => void;

  /** When false, no Back button is rendered (e.g. the first step). */
  showBack?: boolean;
  backLabel?: string;
  backIcon?: ReactNode;
  onBack?: () => void;
}

export default function WizardShell({
  stepTitle,
  stepIndex,
  totalSteps,
  children,
  bodyAlign = "start",
  ctaLabel,
  ctaDisabled = false,
  ctaCompact = false,
  onContinue,
  showBack = false,
  backLabel = "Back",
  backIcon,
  onBack,
}: WizardShellProps) {
  return (
    <div className="flex flex-col items-stretch justify-start min-h-[520px] w-full">
      <div className="flex flex-col gap-[35px] w-full max-w-[480px]">
        <div className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase text-fg-secondary h-4 leading-none">
          <span className="font-semibold text-brand tabular-nums">
            Step {stepIndex} of {totalSteps}
          </span>
          <span className="text-fg-tertiary">·</span>
          <span className="text-fg-secondary">{stepTitle}</span>
        </div>

        <div className={bodyAlign === "center" ? "flex flex-col items-center" : ""}>
          <div className="pt-4 pb-3">{children}</div>
          <div className="pt-6 flex items-center gap-3.5">
            {showBack && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 py-3.5 px-[22px] bg-transparent border border-default rounded-xl text-fg-tertiary font-[inherit] text-sm font-medium cursor-pointer transition-all duration-150 whitespace-nowrap shrink-0 hover:border-strong hover:text-fg-secondary"
              >
                {backIcon}
                {backLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onContinue}
              disabled={ctaDisabled}
              className={`flex items-center justify-center gap-2.5 py-4 px-8 bg-brand border-none rounded-xl text-brand-contrast font-[inherit] text-sm font-semibold cursor-pointer transition-all duration-150 tracking-[0.01em] hover:enabled:brightness-[1.08] disabled:opacity-30 disabled:cursor-not-allowed ${
                ctaCompact ? "flex-none min-w-[200px]" : "flex-1"
              }`}
            >
              {ctaLabel}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
