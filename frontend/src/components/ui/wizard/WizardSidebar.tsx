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
  index: number;
  isCurrent: boolean;
  isComplete: boolean;
}

export interface WizardSidebarProgress {
  percent: number;
  completedCount: number;
  totalCount: number;
  /** Header label above the donut. Defaults to "Setup Progress". */
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
  /** Optional progress indicator at the top (circular donut + count). */
  progress?: WizardSidebarProgress;
  className?: string;
}

const DEFAULT_SIDEBAR_CLASS =
  "w-[300px] min-w-[300px] max-w-[300px] shrink-0 flex flex-col bg-surface-raised/50 backdrop-blur-xl border-r border-white/[0.06] rounded-l-2xl";

// 2π · 26 — circumference of the progress ring (r=26).
const RING_CIRCUMFERENCE = 163.4;

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
        <ul className="space-y-1">
          {steps.map((step, index) => {
            const stepIsComplete = isComplete(step.id);
            const stepIsCurrent = currentStepId === step.id;
            const stepIsClickable = selectable(step.id);
            const Icon = step.icon;

            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => stepIsClickable && onSelect(step.id)}
                  disabled={!stepIsClickable}
                  className={[
                    "w-full flex items-center gap-3.5 px-3 py-3.5 rounded-xl text-left group relative overflow-hidden transition-all duration-300",
                    stepIsClickable ? "cursor-pointer" : "cursor-default",
                  ].join(" ")}
                >
                  {/* Luminous left edge for active step */}
                  {stepIsCurrent && (
                    <>
                      <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-brand shadow-[0_0_12px_0] shadow-brand/70" />
                      <div className="absolute inset-0 bg-gradient-to-r from-brand/[0.12] via-brand/[0.05] to-transparent pointer-events-none" />
                    </>
                  )}

                  {/* Subtle indicator for completed (non-active) steps */}
                  {stepIsComplete && !stepIsCurrent && (
                    <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-brand/40" />
                  )}

                  {/* Hover wash (only when not active) */}
                  {!stepIsCurrent && stepIsClickable && (
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.03] transition-colors duration-200 pointer-events-none rounded-xl" />
                  )}

                  {/* Icon container */}
                  <div
                    className={[
                      "relative z-10 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                      stepIsCurrent && "bg-brand/20 text-brand",
                      stepIsComplete && !stepIsCurrent && "bg-brand/10 text-brand/70",
                      !stepIsCurrent && !stepIsComplete && "bg-white/[0.04] text-fg-tertiary group-hover:text-fg-secondary group-hover:bg-white/[0.06]",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {stepIsComplete && !stepIsCurrent ? (
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  {/* Body slot — caller renders label / details / step number */}
                  <div className="relative z-10 flex-1 min-w-0">
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
  const { percent, completedCount, totalCount, label = "Setup Progress" } = progress;
  const dashLength = (Math.max(0, Math.min(100, percent)) / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="px-7 pt-9 pb-6">
      <div className="flex items-center gap-5">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
            <circle
              className="text-white/[0.06]"
              strokeWidth="5"
              stroke="currentColor"
              fill="none"
              r="26"
              cx="32"
              cy="32"
            />
            <circle
              className="text-brand transition-all duration-700 ease-out"
              strokeWidth="5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              r="26"
              cx="32"
              cy="32"
              strokeDasharray={`${dashLength} ${RING_CIRCUMFERENCE}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-fg-primary tabular-nums">{percent}%</span>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-medium tracking-[0.12em] text-fg-muted uppercase mb-1">
            {label}
          </p>
          <p className="text-sm font-medium text-fg-primary">
            {completedCount} of {totalCount} complete
          </p>
        </div>
      </div>
      <div className="mt-6 -mx-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
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
