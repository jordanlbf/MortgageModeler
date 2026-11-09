"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import PageBar from "@/components/patterns/cards/PageBar";
import { Button } from "@/components/ui/button";
import SegmentToggle from "@/components/domain/SegmentToggle";
import CashflowCalculator from "./CashflowView";
import { useCashflowState, type CashflowSource } from "@/hooks/useCashflowState";
import type { DashboardView, StepId } from "@/lib/cashflow-types";

/**
 * The Cashflow screen: page bar over the wizard, or over the output once the
 * wizard is done. `source` is for the kitchen sink (sample data instead of the
 * API); the app passes nothing. "Model new property" remounts it from scratch.
 */
export default function CashflowScreen({ source }: { source?: CashflowSource }) {
  const [resetKey, setResetKey] = useState(0);
  return (
    <CashflowScreenContent
      key={resetKey}
      source={source}
      onReset={() => setResetKey((k) => k + 1)}
    />
  );
}

function CashflowScreenContent({ source, onReset }: { source?: CashflowSource; onReset: () => void }) {
  const s = useCashflowState(source);
  const [editingStep, setEditingStep] = useState<StepId | null>(null);
  const [dashboardView, setDashboardView] = useState<DashboardView>("overview");

  return (
    // Fills the content area, so the wizard card can take the height left under the bar.
    <div className="flex min-h-[calc(100dvh-2*var(--layout-page-padding-y))] flex-col gap-6">
      <PageBar
        eyebrow="Cashflow"
        title={s.allComplete ? "12 Example Street, Clayfield, QLD 4011" : "New property"}
        actions={
          <>
            {s.allComplete && (
              <SegmentToggle
                aria-label="Layout"
                value={dashboardView}
                onChange={setDashboardView}
                options={[{ value: "overview", label: "Overview" }, { value: "details", label: "Details" }]}
              />
            )}
            {s.allComplete && (
              <Button
                type="button"
                variant="outline-action"
                onClick={() => setEditingStep("setup")}
              >
                <Pencil size={13} strokeWidth={1.8} />
                Edit
              </Button>
            )}
            <Button
              type="button"
              variant="outline-action"
              onClick={onReset}
            >
              <Plus size={13} strokeWidth={1.8} />
              Model new property
            </Button>
          </>
        }
      />
      <CashflowCalculator
        s={s}
        editingStep={editingStep}
        onEditingStepChange={setEditingStep}
        dashboardView={dashboardView}
      />
    </div>
  );
}
