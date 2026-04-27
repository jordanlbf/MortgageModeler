"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

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
      <div className="px-10 pt-10 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-brand uppercase tracking-wider tabular-nums">
            Step {stepIndex}
          </span>
          <span className="text-xs text-fg-muted">/</span>
          <span className="text-xs text-fg-muted tabular-nums">{totalSteps}</span>
        </div>
        <h2 className="text-2xl font-semibold text-fg-primary leading-tight">{stepTitle}</h2>
        {stepSubtitle && (
          <p className="text-sm text-fg-secondary mt-1">{stepSubtitle}</p>
        )}
      </div>

      {/* Content */}
      <div
        className={[
          "flex-1 px-10 py-4 overflow-y-auto",
          bodyAlign === "center" && "flex flex-col items-center",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>

      {/* Footer Actions */}
      <div className="px-10 py-6 border-t border-white/[0.06]">
        <div className="flex items-center justify-between gap-3">
          {showBack && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-fg-secondary hover:text-fg-primary transition-colors rounded-lg hover:bg-white/[0.03]"
            >
              {backIcon}
              {backLabel}
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onContinue}
            disabled={ctaDisabled}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-brand-contrast bg-brand rounded-lg transition-all duration-150 hover:enabled:brightness-[1.08] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {ctaLabel}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
