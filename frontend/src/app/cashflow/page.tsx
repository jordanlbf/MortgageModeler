"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import CashflowCalculator from "@/components/cashflow/CashflowView";

export default function CashflowPage() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <>
      <PageHeader
        title="Cashflow"
        subtitle="12 Example Street, Clayfield, QLD 4011"
        actions={
          <button
            type="button"
            onClick={() => setResetKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
            style={{
              background: "color-mix(in srgb, var(--color-brand) 3%, transparent)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "color-mix(in srgb, var(--color-brand) 20%, transparent)",
              color: "var(--color-fg-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "color-mix(in srgb, var(--color-brand) 8%, transparent)";
              e.currentTarget.style.borderColor = "color-mix(in srgb, var(--color-brand) 35%, transparent)";
              e.currentTarget.style.color = "var(--color-fg-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "color-mix(in srgb, var(--color-brand) 3%, transparent)";
              e.currentTarget.style.borderColor = "color-mix(in srgb, var(--color-brand) 20%, transparent)";
              e.currentTarget.style.color = "var(--color-fg-secondary)";
            }}
          >
            <Plus size={13} strokeWidth={1.8} />
            Model new property
          </button>
        }
      />
      <CashflowCalculator key={resetKey} />
    </>
  );
}
