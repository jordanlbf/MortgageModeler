import type { CashflowState } from "@/hooks/useCashflowState";
import Input from "@/components/ui/Input";
import { currencyInput } from "./shared";

interface Props {
  s: CashflowState;
}

export default function RentalStep({ s }: Props) {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-fg-secondary">Weekly rent</label>
        <Input value={s.weeklyRent} {...currencyInput(s.setWeeklyRent)} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-fg-secondary">Vacancy rate (%)</label>
        <Input value={s.vacancyRate} onChange={(e) => s.setVacancyRate(e.target.value)} />
      </div>
      <div className="pt-0.5">
        <label className="flex items-center gap-3 cursor-pointer text-[13px] text-fg-secondary">
          <input type="checkbox" className="absolute opacity-0 pointer-events-none peer" checked={s.usePropertyManager} onChange={(e) => s.setUsePropertyManager(e.target.checked)} />
          <span className="w-[18px] h-[18px] border border-strong rounded bg-transparent transition-all duration-150 shrink-0 relative peer-checked:bg-brand peer-checked:border-brand peer-checked:after:content-[''] peer-checked:after:absolute peer-checked:after:top-[3px] peer-checked:after:left-[6px] peer-checked:after:w-1 peer-checked:after:h-2 peer-checked:after:border-brand-contrast peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:rotate-45" />
          Property manager
        </label>
      </div>
      {s.usePropertyManager && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-fg-secondary">Management fee (%)</label>
          <Input value={s.managementFee} onChange={(e) => s.setManagementFee(e.target.value)} />
        </div>
      )}
    </div>
  );
}
