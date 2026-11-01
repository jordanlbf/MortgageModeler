"use client";

import type { ReactNode } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SectionTitle from "@/components/patterns/blocks/SectionTitle";
import { cn } from "@/lib/utils";

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
  /** No body padding: the step lays out its own edge-to-edge sections. */
  flush?: boolean;

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
  flush = false,
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
      <header className="flex flex-col gap-2 px-6 pt-7 pb-5">
        <Label variant="caps" asChild>
          <span className="tabular-nums">Step {stepIndex} of {totalSteps}</span>
        </Label>
        <SectionTitle>{stepTitle}</SectionTitle>
        {stepSubtitle && (
          <p className="text-sm text-fg-secondary leading-relaxed">{stepSubtitle}</p>
        )}
      </header>

      {/* Content */}
      <div
        className={cn(
          "flex-1 overflow-y-auto",
          !flush && "px-6 pb-6",
          bodyAlign === "center" && "flex flex-col items-center justify-center",
        )}
      >
        {children}
      </div>

      {/* Footer Actions */}
      <footer className="px-6 py-5 border-t border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            {showBack && onBack && (
              <Button
                type="button"
                variant="ghost-muted"
                onClick={onBack}
                className="flex items-center gap-1.5 px-4 py-2 text-sm"
              >
                {backIcon ?? <ArrowLeft size={14} />}
                {backLabel}
              </Button>
            )}
          </div>
          <Button
            type="button"
            variant="cta"
            onClick={onContinue}
            disabled={ctaDisabled}
            className="flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            {ctaLabel}
            <ArrowRight size={14} />
          </Button>
        </div>
      </footer>
    </div>
  );
}
