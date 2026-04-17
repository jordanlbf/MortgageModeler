import { Building2, Home, Sparkles } from "lucide-react";
import type { CashflowState } from "@/hooks/useCashflowState";

interface Props {
  s: CashflowState;
}

export default function SetupStep({ s }: Props) {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3.5">
        <span className="text-xs font-medium tracking-[0.06em] uppercase text-faint">Property type</span>
        <div className="flex gap-3">
          <button
            className={`flex-1 flex items-center justify-center gap-2.5 py-[18px] px-5 rounded-xl border bg-transparent font-medium text-sm font-[inherit] cursor-pointer transition-all duration-200 ${s.propertyUse === "investment" ? "border-accent/30 text-accent bg-accent/[0.08]" : "border-border text-subtle hover:border-white/[0.12] hover:text-foreground hover:bg-white/[0.03]"}`}
            onClick={() => { s.setPropertyUse("investment"); s.setPurchaseMode(null); }}
          >
            <Building2 size={18} />
            <span>Investment</span>
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2.5 py-[18px] px-5 rounded-xl border bg-transparent font-medium text-sm font-[inherit] cursor-pointer transition-all duration-200 ${s.propertyUse === "ppor" ? "border-accent/30 text-accent bg-accent/[0.08]" : "border-border text-subtle hover:border-white/[0.12] hover:text-foreground hover:bg-white/[0.03]"}`}
            onClick={() => { s.setPropertyUse("ppor"); s.setPurchaseMode(null); }}
          >
            <Home size={18} />
            <span>Owner-occupier</span>
          </button>
        </div>
      </div>
      {s.propertyUse && (
        <div className="flex flex-col gap-3.5">
          <span className="text-xs font-medium tracking-[0.06em] uppercase text-faint">Purchase type</span>
          <div className="flex gap-3">
            <button
              className={`flex-1 flex items-center justify-center gap-2.5 py-[18px] px-5 rounded-xl border bg-transparent font-medium text-sm font-[inherit] cursor-pointer transition-all duration-200 ${s.purchaseMode === "new" ? "border-accent/30 text-accent bg-accent/[0.08]" : "border-border text-subtle hover:border-white/[0.12] hover:text-foreground hover:bg-white/[0.03]"}`}
              onClick={() => s.setPurchaseMode("new")}
            >
              <Sparkles size={18} />
              <span>New purchase</span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2.5 py-[18px] px-5 rounded-xl border bg-transparent font-medium text-sm font-[inherit] cursor-pointer transition-all duration-200 ${s.purchaseMode === "existing" ? "border-accent/30 text-accent bg-accent/[0.08]" : "border-border text-subtle hover:border-white/[0.12] hover:text-foreground hover:bg-white/[0.03]"}`}
              onClick={() => s.setPurchaseMode("existing")}
            >
              <Building2 size={18} />
              <span>Existing property</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
