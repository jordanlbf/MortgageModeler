import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";
import { estimateAnnualDepreciation } from "@/lib/depreciation-estimate";
import { INPUT_CLS, currencyInput } from "./shared";

interface Props {
  s: CashflowState;
}

const SMALL_INPUT_CLS = "flex-1 min-w-0 text-[13px] py-1.5 px-2.5 bg-transparent border border-border rounded-xl text-foreground font-[inherit] font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-accent/40";

export default function TaxStep({ s }: Props) {
  const propPrice = s.isNewPurchase ? parseCurrencyInput(s.purchasePrice) : parseCurrencyInput(s.currentValue);
  const estYear = s.isNewPurchase ? new Date().getFullYear() : parseInt(s.purchaseYear) || new Date().getFullYear();
  const estAnnual = estimateAnnualDepreciation(propPrice, s.isNewPurchase, estYear);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-subtle">Taxable income (p.a.)</label>
        <input type="text" className={INPUT_CLS} value={s.taxableIncome} {...currencyInput(s.setTaxableIncome)} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-subtle">Capital growth assumption (%)</label>
        <input type="text" className={INPUT_CLS} value={s.capitalGrowth} onChange={(e) => s.setCapitalGrowth(e.target.value)} />
      </div>

      <div className="h-px bg-border my-1" />

      {/* Depreciation mode toggle */}
      <div className="flex flex-col gap-3.5">
        <span className="text-xs font-medium tracking-[0.06em] uppercase text-faint">Depreciation</span>
        <div className="flex gap-3">
          <button className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border bg-transparent font-medium text-[13px] font-[inherit] cursor-pointer transition-all duration-200 ${s.depreciationMode === "estimate" ? "border-accent/30 text-accent bg-accent/[0.08]" : "border-border text-subtle hover:border-white/[0.12] hover:text-foreground hover:bg-white/[0.03]"}`} onClick={() => s.setDepreciationMode("estimate")}>Estimate</button>
          <button className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border bg-transparent font-medium text-[13px] font-[inherit] cursor-pointer transition-all duration-200 ${s.depreciationMode === "detailed" ? "border-accent/30 text-accent bg-accent/[0.08]" : "border-border text-subtle hover:border-white/[0.12] hover:text-foreground hover:bg-white/[0.03]"}`} onClick={() => s.setDepreciationMode("detailed")}>Detailed</button>
        </div>
      </div>

      {s.depreciationMode === "estimate" && (
        <div className="flex flex-col gap-1 py-3 px-4 bg-accent/[0.05] border border-accent/[0.12] rounded-lg">
          <span className="text-base font-semibold text-accent tabular-nums">~{formatDollarsSigned(estAnnual)}/yr</span>
          <span className="text-xs text-faint">estimated from {formatDollarsSigned(propPrice)} property</span>
        </div>
      )}

      {s.depreciationMode === "detailed" && (
        <>
          {/* Buildings */}
          <div className="flex flex-col gap-3.5">
            <span className="text-xs font-medium tracking-[0.06em] uppercase text-faint">Buildings (Div 43)</span>
            {s.depBuildings.map((b, i) => (
              <div key={i} className="flex gap-2 items-center mb-1.5">
                <input type="text" className={SMALL_INPUT_CLS} value={b.name} onChange={(e) => {
                  const next = [...s.depBuildings]; next[i] = { ...b, name: e.target.value }; s.setDepBuildings(next);
                }} placeholder="Name" />
                <input type="text" className={SMALL_INPUT_CLS} value={`$${b.construction_cost.toLocaleString()}`} onChange={(e) => {
                  const next = [...s.depBuildings]; next[i] = { ...b, construction_cost: parseCurrencyInput(e.target.value) }; s.setDepBuildings(next);
                }} placeholder="Cost" />
                <button className="bg-transparent border-none text-faint cursor-pointer text-base py-1 px-2 rounded hover:text-negative" onClick={() => { const next = [...s.depBuildings]; next.splice(i, 1); s.setDepBuildings(next); }}>×</button>
              </div>
            ))}
            <button className="bg-transparent border border-dashed border-border text-faint cursor-pointer text-xs font-[inherit] py-1.5 px-3 rounded-md transition-all duration-150 w-full mt-1 hover:border-accent hover:text-accent" onClick={() => s.setDepBuildings([...s.depBuildings, { name: "Building", construction_cost: 0, purchase_date: `${estYear}-07-01`, construction_start_date: `${estYear - 2}-01-01` }])}>+ Add building</button>
          </div>

          {/* Assets */}
          <div className="flex flex-col gap-3.5">
            <span className="text-xs font-medium tracking-[0.06em] uppercase text-faint">Assets (Div 40)</span>
            {s.depAssets.map((a, i) => (
              <div key={i} className="flex gap-2 items-center mb-1.5">
                <input type="text" className={SMALL_INPUT_CLS} value={a.name} onChange={(e) => {
                  const next = [...s.depAssets]; next[i] = { ...a, name: e.target.value }; s.setDepAssets(next);
                }} placeholder="Name" />
                <input type="text" className={SMALL_INPUT_CLS} value={`$${a.cost.toLocaleString()}`} onChange={(e) => {
                  const next = [...s.depAssets]; next[i] = { ...a, cost: parseCurrencyInput(e.target.value) }; s.setDepAssets(next);
                }} placeholder="Cost" />
                <input type="text" className={SMALL_INPUT_CLS} value={String(a.effective_life_years)} onChange={(e) => {
                  const next = [...s.depAssets]; next[i] = { ...a, effective_life_years: parseInt(e.target.value) || 1 }; s.setDepAssets(next);
                }} placeholder="Life (yrs)" />
                <button className="bg-transparent border-none text-faint cursor-pointer text-base py-1 px-2 rounded hover:text-negative" onClick={() => { const next = [...s.depAssets]; next.splice(i, 1); s.setDepAssets(next); }}>×</button>
              </div>
            ))}
            <button className="bg-transparent border border-dashed border-border text-faint cursor-pointer text-xs font-[inherit] py-1.5 px-3 rounded-md transition-all duration-150 w-full mt-1 hover:border-accent hover:text-accent" onClick={() => s.setDepAssets([...s.depAssets, { name: "Asset", cost: 0, effective_life_years: 10, purchase_date: `${estYear}-07-01`, method: "diminishing_value", written_down_value: 0 }])}>+ Add asset</button>
          </div>
        </>
      )}
    </div>
  );
}
