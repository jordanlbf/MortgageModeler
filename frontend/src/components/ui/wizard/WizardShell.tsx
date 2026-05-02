"use client";

import type { ReactNode } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface WizardShellProps {
  /** Title of the active step (e.g. "Property Setup"). */
  stepTitle: string;
  /** Optional supporting copy under the title. */
  stepSubtitle?: string;
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
  onContinue: () => void;

  /** When false, no Back button is rendered (e.g. the first step). */
  showBack?: boolean;
  backLabel?: string;
  backIcon?: ReactNode;
  onBack?: () => void;
}

export default function WizardShell({
  stepTitle,
  stepSubtitle,
  stepIndex,
  totalSteps,
  children,
  bodyAlign = "start",
  ctaLabel,
  ctaDisabled = false,
  onContinue,
  showBack = false,
  backLabel = "Back",
  backIcon,
  onBack,
}: WizardShellProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="px-10 pt-6 pb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-semibold text-brand uppercase tracking-wider tabular-nums">
            Step {stepIndex}
          </span>
          <span className="text-[10px] text-fg-muted/50">of {totalSteps}</span>
        </div>
        <h2 className="text-lg font-semibold text-fg-primary leading-snug">
          {stepTitle}
        </h2>
        {stepSubtitle && (
          <p className="text-sm text-fg-secondary mt-1.5 leading-relaxed">{stepSubtitle}</p>
        )}
      </header>

      {/* Content */}
      <div
        className={[
          "flex-1 px-10 py-5 overflow-y-auto",
          bodyAlign === "center" && "flex flex-col items-center justify-center",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>

      {/* Footer Actions */}
      <footer className="px-10 py-5 border-t border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div>
            {showBack && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-fg-tertiary hover:text-fg-primary transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                {backIcon ?? <ArrowLeft size={14} />}
                {backLabel}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onContinue}
            disabled={ctaDisabled}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-brand-contrast bg-brand rounded-lg transition-all duration-150 hover:enabled:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ctaLabel}
            <ArrowRight size={14} />
          </button>
        </div>
      </footer>
    </div>
  );
}
