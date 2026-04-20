import type { CashflowState } from "@/hooks/useCashflowState";
import { INPUT_CLS, currencyInput } from "./shared";

interface Props {
  s: CashflowState;
}

export default function CostsStep({ s }: Props) {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex gap-3.5">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-medium text-fg-secondary">Council rates (p.a.)</label>
          <input type="text" className={INPUT_CLS} value={s.councilRates} {...currencyInput(s.setCouncilRates)} />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-medium text-fg-secondary">Water rates (p.a.)</label>
          <input type="text" className={INPUT_CLS} value={s.waterRates} {...currencyInput(s.setWaterRates)} />
        </div>
      </div>
      <div className="flex gap-3.5">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-medium text-fg-secondary">Insurance (p.a.)</label>
          <input type="text" className={INPUT_CLS} value={s.insurance} {...currencyInput(s.setInsurance)} />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-medium text-fg-secondary">Maintenance (%)</label>
          <input type="text" className={INPUT_CLS} value={s.maintenance} onChange={(e) => s.setMaintenance(e.target.value)} />
        </div>
      </div>
      <div className="pt-0.5">
        <label className="flex items-center gap-3 cursor-pointer text-[13px] text-fg-secondary">
          <input type="checkbox" className="absolute opacity-0 pointer-events-none peer" checked={s.hasStrata} onChange={(e) => s.setHasStrata(e.target.checked)} />
          <span className="w-[18px] h-[18px] border border-strong rounded bg-transparent transition-all duration-150 shrink-0 relative peer-checked:bg-brand peer-checked:border-brand peer-checked:after:content-[''] peer-checked:after:absolute peer-checked:after:top-[3px] peer-checked:after:left-[6px] peer-checked:after:w-1 peer-checked:after:h-2 peer-checked:after:border-brand-contrast peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:rotate-45" />
          Strata / Body corp
        </label>
      </div>
      {s.hasStrata && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-fg-secondary">Strata fees (quarterly)</label>
          <input type="text" className={INPUT_CLS} value={s.strataFees} {...currencyInput(s.setStrataFees)} />
        </div>
      )}
    </div>
  );
}
