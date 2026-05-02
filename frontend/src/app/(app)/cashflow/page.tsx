"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
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
              <button
                type="button"
                onClick={() => setEditingStep("setup")}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer"
                style={{
                  background: "transparent",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "var(--color-border-default)",
                  color: "var(--color-fg-primary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border-strong)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border-default)";
                }}
              >
                <Pencil size={13} strokeWidth={1.8} />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer"
              style={{
                background: "transparent",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--color-border-default)",
                color: "var(--color-fg-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-default)";
              }}
            >
              <Plus size={13} strokeWidth={1.8} />
              Model new property
            </button>
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
