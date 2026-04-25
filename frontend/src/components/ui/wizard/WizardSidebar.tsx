"use client";

import type { ReactNode } from "react";
import { Check, type LucideIcon } from "lucide-react";

export interface WizardSidebarStep<TStepId extends string> {
  id: TStepId;
  title: string;
  icon: LucideIcon;
}

interface RenderStepBodyArgs<TStepId extends string> {
  step: WizardSidebarStep<TStepId>;
  isCurrent: boolean;
  isComplete: boolean;
}

interface WizardSidebarProps<TStepId extends string> {
  steps: WizardSidebarStep<TStepId>[];
  currentStepId: TStepId | null;
  isComplete: (id: TStepId) => boolean;
  /** Whether a given step is clickable. Caller can gate by completion or mode. */
  selectable: (id: TStepId) => boolean;
  onSelect: (id: TStepId) => void;
  /** Render the content beside each step indicator. Defaults to the step title. */
  renderStepBody?: (args: RenderStepBodyArgs<TStepId>) => ReactNode;
  /** Optional content above the step list (e.g. progress bar). */
  header?: ReactNode;
  /** Optional content below the step list (e.g. "X of Y complete"). */
  footer?: ReactNode;
  className?: string;
}

export default function WizardSidebar<TStepId extends string>({
  steps,
  currentStepId,
  isComplete,
  selectable,
  onSelect,
  renderStepBody = defaultRenderStepBody,
  header,
  footer,
  className,
}: WizardSidebarProps<TStepId>) {
  return (
    <aside
      className={
        className ??
        "w-[300px] min-w-[300px] max-w-[300px] border-r border-default bg-surface-app shrink-0"
      }
    >
      <div className="py-2 pb-8 flex flex-col">
        <div className="flex flex-col">
          {header}

          <div className="flex flex-col">
            {steps.map((step, index) => {
              const stepIsComplete = isComplete(step.id);
              const stepIsCurrent = currentStepId === step.id;
              const stepIsClickable = selectable(step.id);
              const isUpcoming = !stepIsComplete && !stepIsCurrent;

              return (
                <button
                  key={step.id}
                  type="button"
                  className={[
                    "flex items-start gap-3.5 py-3 px-6 relative bg-none border-none w-full text-left font-[inherit] transition-colors duration-150 ease-in-out",
                    stepIsClickable
                      ? "cursor-pointer hover:bg-surface-hover"
                      : "cursor-default",
                    stepIsCurrent && "!bg-brand/[0.04]",
                    isUpcoming && "opacity-50",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => stepIsClickable && onSelect(step.id)}
                  disabled={!stepIsClickable}
                >
                  <StepIndicator
                    Icon={step.icon}
                    isComplete={stepIsComplete}
                    isCurrent={stepIsCurrent}
                    isLast={index === steps.length - 1}
                  />
                  {renderStepBody({
                    step,
                    isCurrent: stepIsCurrent,
                    isComplete: stepIsComplete,
                  })}
                </button>
              );
            })}
          </div>

          {footer}
        </div>
      </div>
    </aside>
  );
}

function StepIndicator({
  Icon,
  isComplete,
  isCurrent,
  isLast,
}: {
  Icon: LucideIcon;
  isComplete: boolean;
  isCurrent: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex flex-col items-center shrink-0">
      <div
        className={[
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-250 ease-in-out",
          isComplete
            ? "border-[1.5px] border-brand bg-brand text-brand-contrast"
            : isCurrent
              ? "border-[1.5px] border-brand text-brand bg-brand/[0.08] shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-brand)_12%,transparent)]"
              : "border-[1.5px] border-default bg-surface-app text-fg-tertiary",
        ].join(" ")}
      >
        {isComplete ? (
          <Check size={14} strokeWidth={2.5} />
        ) : (
          <Icon size={14} strokeWidth={1.5} />
        )}
      </div>
      {!isLast && (
        <div
          className={[
            "w-0.5 h-6 mt-1.5 rounded-sm transition-colors duration-250 ease-in-out",
            isComplete ? "bg-brand" : "bg-border",
          ].join(" ")}
        />
      )}
    </div>
  );
}

function defaultRenderStepBody<TStepId extends string>({
  step,
  isCurrent,
  isComplete,
}: RenderStepBodyArgs<TStepId>) {
  return (
    <span
      className={[
        "text-[13px] leading-[1.4] transition-colors duration-150 ease-in-out pt-[3px]",
        isCurrent
          ? "font-semibold text-fg-primary"
          : isComplete
            ? "font-medium text-fg-primary"
            : "font-medium text-fg-tertiary",
      ].join(" ")}
    >
      {step.title}
    </span>
  );
}
