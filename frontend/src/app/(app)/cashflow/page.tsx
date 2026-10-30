"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import CashflowCalculator from "@/components/cashflow/CashflowView";
import { useCashflowState } from "@/hooks/useCashflowState";
import type { StepId } from "@/lib/cashflow-types";

export default function CashflowPage() {
  const [resetKey, setResetKey] = useState(0);
  return (
    <CashflowPageContent
      key={resetKey}
      onReset={() => setResetKey((k) => k + 1)}
    />
  );
}

function CashflowPageContent({ onReset }: { onReset: () => void }) {
  const s = useCashflowState();
  const [editingStep, setEditingStep] = useState<StepId | null>(null);

  return (
    <>
      <PageHeader
        title="Cashflow"
        subtitle="12 Example Street, Clayfield, QLD 4011"
        actions={
          <>
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
      />
    </>
  );
}
