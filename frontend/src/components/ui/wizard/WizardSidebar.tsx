"use client";

import type { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

export interface WizardSidebarStep<TStepId extends string> {
  id: TStepId;
  title: string;
  icon: LucideIcon;
}

interface RenderStepBodyArgs<TStepId extends string> {
  step: WizardSidebarStep<TStepId>;
  index: number;
  isCurrent: boolean;
  isComplete: boolean;
}

export interface WizardSidebarProgress {
  percent: number;
  completedCount: number;
  totalCount: number;
  /** Header label. Defaults to "Progress". */
  label?: string;
}

interface WizardSidebarProps<TStepId extends string> {
  steps: WizardSidebarStep<TStepId>[];
  currentStepId: TStepId | null;
  isComplete: (id: TStepId) => boolean;
  /** Whether a given step is clickable. Caller can gate by completion or mode. */
  selectable: (id: TStepId) => boolean;
  onSelect: (id: TStepId) => void;
  /** Render the content beside each step indicator. Defaults to label + step number. */
  renderStepBody?: (args: RenderStepBodyArgs<TStepId>) => ReactNode;
  /** Optional progress indicator at the top. */
  progress?: WizardSidebarProgress;
  className?: string;
}

const DEFAULT_SIDEBAR_CLASS =
  "w-[260px] min-w-[260px] max-w-[260px] shrink-0 flex flex-col bg-surface-raised/60 backdrop-blur-xl border-r border-white/[0.06] rounded-l-2xl";

export default function WizardSidebar<TStepId extends string>({
  steps,
  currentStepId,
  isComplete,
  selectable,
  onSelect,
  renderStepBody = defaultRenderStepBody,
  progress,
  className,
}: WizardSidebarProps<TStepId>) {
  return (
    <aside className={className ?? DEFAULT_SIDEBAR_CLASS}>
      {progress && <ProgressHeader progress={progress} />}

      <nav className="flex-1 px-5 py-6 overflow-y-auto">
        <ul className="space-y-0.5">
          {steps.map((step, index) => {
            const stepIsComplete = isComplete(step.id);
            const stepIsCurrent = currentStepId === step.id;
            const stepIsClickable = selectable(step.id);

            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => stepIsClickable && onSelect(step.id)}
                  disabled={!stepIsClickable}
                  className={[
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group relative transition-all duration-150",
                    stepIsClickable ? "cursor-pointer" : "cursor-default",
                    stepIsCurrent && "bg-brand/[0.08]",
                    !stepIsCurrent && stepIsClickable && "hover:bg-white/[0.03]",
                  ].filter(Boolean).join(" ")}
                >
                  {/* Simple dot indicator */}
                  <div
                    className={[
                      "w-2 h-2 rounded-full shrink-0 transition-all duration-200",
                      stepIsCurrent && "bg-brand shadow-[0_0_8px_1px] shadow-brand/60",
                      stepIsComplete && !stepIsCurrent && "bg-brand/60",
                      !stepIsCurrent && !stepIsComplete && "bg-white/[0.15]",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />

                  {/* Body slot */}
                  <div className="flex-1 min-w-0">
                    {renderStepBody({
                      step,
                      index,
                      isCurrent: stepIsCurrent,
                      isComplete: stepIsComplete,
                    })}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

function ProgressHeader({ progress }: { progress: WizardSidebarProgress }) {
  const { percent, completedCount, totalCount, label = "Progress" } = progress;

  return (
    <div className="px-6 pt-8 pb-6 border-b border-white/[0.04]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider">{label}</span>
        <span className="text-xs font-semibold text-fg-primary tabular-nums">{completedCount} of {totalCount}</span>
      </div>
      {/* Horizontal progress bar */}
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function defaultRenderStepBody<TStepId extends string>({
  step,
  index,
  isCurrent,
  isComplete,
}: RenderStepBodyArgs<TStepId>) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={[
          "text-sm font-medium block transition-colors duration-200",
          isCurrent && "text-fg-primary",
          isComplete && !isCurrent && "text-fg-secondary",
          !isCurrent && !isComplete && "text-fg-tertiary group-hover:text-fg-secondary",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {step.title}
      </span>
      <span
        className={[
          "text-[10px] font-semibold tabular-nums transition-colors duration-200",
          isCurrent && "text-brand",
          isComplete && !isCurrent && "text-fg-muted",
          !isCurrent && !isComplete && "text-fg-muted/50",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}
