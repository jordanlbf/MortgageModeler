"use client";

import { useMemo } from "react";
import { ArrowRight, X, Home, Building2, Sparkles, Landmark, Coins, Key, Calculator } from "lucide-react";
import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyInput, formatDollarsSigned } from "@/lib/formatters";
import { paymentFromLoanAmount } from "@/lib/calculations";
import { estimateAnnualDepreciation } from "@/lib/depreciation-estimate";

interface Props {
  s: CashflowState;
  currentStep: string;
  onStepComplete: () => void;
  onStepBack: () => void;
  canGoBack: boolean;
  isModal?: boolean;
}

import type { StepId } from "@/lib/cashflow-types";

const STEP_META: Record<StepId, { title: string; subtitle: string; icon: React.ElementType }> = {
  setup:    { title: "Property Setup",   subtitle: "",  icon: Home       },
  property: { title: "Property",         subtitle: "",  icon: Building2  },
  loan:     { title: "Loan",             subtitle: "",  icon: Landmark   },
  costs:    { title: "Costs",            subtitle: "",  icon: Coins      },
  rental:   { title: "Rental Income",    subtitle: "",  icon: Key        },
  tax:      { title: "Tax",              subtitle: "",  icon: Calculator },
};

function getStepOrder(isInvestment: boolean): StepId[] {
  const base: StepId[] = ["setup", "property", "loan", "costs"];
  if (isInvestment) return [...base, "rental", "tax"];
  return base;
}

export default function CashflowWizardStep({ s, currentStep, onStepComplete, onStepBack, canGoBack, isModal }: Props) {
  const step = currentStep as StepId;
  const meta = STEP_META[step];

  const stepOrder = useMemo(() => getStepOrder(s.isInvestment), [s.isInvestment]);
  const currentStepIndex = stepOrder.indexOf(step);

  const handleContinue = () => {
    onStepComplete();
  };

  if (!meta) return null;

  const INPUT_CLS = "py-3.5 px-4 bg-transparent border border-border rounded-xl text-foreground font-[inherit] text-base font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-accent/40";

  /** Format-on-change for currency inputs: store formatted string, parse only for calculations. */
  const currencyInput = (setter: (v: string) => void) => ({
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, "");
      setter(raw ? formatDollarsSigned(Number(raw)) : "");
    },
  });

  const fieldsContent = (
    <>
      {step === "setup" && (
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
      )}

      {step === "property" && (
        <>
          {s.isNewPurchase ? (
            <div className="flex flex-col gap-7">
              <div className="flex gap-3.5">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xs font-medium text-subtle">Purchase price</label>
                  <input type="text" className={INPUT_CLS} value={s.purchasePrice} {...currencyInput(s.setPurchasePrice)} />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xs font-medium text-subtle">Deposit</label>
                  <input type="text" className={INPUT_CLS} value={s.depositAmount} {...currencyInput(s.setDepositAmount)} />
                </div>
              </div>
              <div className="flex items-stretch bg-accent/[0.04] border border-accent/[0.12] rounded-[14px] overflow-hidden">
                <div className="flex-1 flex flex-col gap-1.5 py-4 px-5">
                  <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-accent/50">Loan amount</span>
                  <span className="text-lg font-semibold text-accent tabular-nums tracking-tight">{formatDollarsSigned(parseCurrencyInput(s.purchasePrice) - parseCurrencyInput(s.depositAmount))}</span>
                </div>
                <div className="w-px bg-accent/10 shrink-0 my-3" />
                <div className="flex-1 flex flex-col gap-1.5 py-4 px-5">
                  <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-accent/50">LVR</span>
                  <span className="text-lg font-semibold text-accent tabular-nums tracking-tight">{parseCurrencyInput(s.purchasePrice) > 0 ? ((1 - parseCurrencyInput(s.depositAmount) / parseCurrencyInput(s.purchasePrice)) * 100).toFixed(1) : "0.0"}%</span>
                </div>
                <div className="w-px bg-accent/10 shrink-0 my-3" />
                <div className="flex-1 flex flex-col gap-1.5 py-4 px-5">
                  <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-accent/50">Deposit</span>
                  <span className="text-lg font-semibold text-accent tabular-nums tracking-tight">{parseCurrencyInput(s.purchasePrice) > 0 ? ((parseCurrencyInput(s.depositAmount) / parseCurrencyInput(s.purchasePrice)) * 100).toFixed(1) : "0.0"}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              <div className="flex gap-3.5">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xs font-medium text-subtle">Current value</label>
                  <input type="text" className={INPUT_CLS} value={s.currentValue} {...currencyInput(s.setCurrentValue)} />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xs font-medium text-subtle">Loan balance</label>
                  <input type="text" className={INPUT_CLS} value={s.currentLoanBalance} {...currencyInput(s.setCurrentLoanBalance)} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-subtle">Original purchase price</label>
                <input type="text" className={INPUT_CLS} value={s.originalPurchasePrice} {...currencyInput(s.setOriginalPurchasePrice)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-subtle">Year purchased</label>
                <input type="text" className={INPUT_CLS} value={s.purchaseYear} onChange={(e) => s.setPurchaseYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2021" />
              </div>
              <div className="flex items-stretch bg-accent/[0.04] border border-accent/[0.12] rounded-[14px] overflow-hidden">
                <div className="flex-1 flex flex-col gap-1.5 py-4 px-5">
                  <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-accent/50">Equity</span>
                  <span className="text-lg font-semibold text-accent tabular-nums tracking-tight">{formatDollarsSigned(parseCurrencyInput(s.currentValue) - parseCurrencyInput(s.currentLoanBalance))}</span>
                </div>
                <div className="w-px bg-accent/10 shrink-0 my-3" />
                <div className="flex-1 flex flex-col gap-1.5 py-4 px-5">
                  <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-accent/50">LVR</span>
                  <span className="text-lg font-semibold text-accent tabular-nums tracking-tight">{parseCurrencyInput(s.currentValue) > 0 ? (parseCurrencyInput(s.currentLoanBalance) / parseCurrencyInput(s.currentValue) * 100).toFixed(1) : "0.0"}%</span>
                </div>
                <div className="w-px bg-accent/10 shrink-0 my-3" />
                <div className="flex-1 flex flex-col gap-1.5 py-4 px-5">
                  <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-accent/50">Growth</span>
                  <span className="text-lg font-semibold text-accent tabular-nums tracking-tight">{parseCurrencyInput(s.originalPurchasePrice) > 0 ? formatDollarsSigned(parseCurrencyInput(s.currentValue) - parseCurrencyInput(s.originalPurchasePrice)) : "—"}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {step === "loan" && (() => {
        const principal = s.isNewPurchase
          ? parseCurrencyInput(s.purchasePrice) - parseCurrencyInput(s.depositAmount)
          : parseCurrencyInput(s.currentLoanBalance);
        const annualRate = parseFloat(s.interestRate) / 100 || 0;
        const years = parseFloat(s.loanTerm) || 30;
        const offset = parseCurrencyInput(s.offsetBalance);
        const effectivePrincipal = Math.max(0, principal - (s.hasOffset ? offset : 0));
        const monthlyRepayment = annualRate > 0 && years > 0
          ? paymentFromLoanAmount(effectivePrincipal, annualRate, years, 12)
          : 0;
        const dailyRate = annualRate / 365;
        const monthlyRate = Math.pow(1 + dailyRate, 365 / 12) - 1;
        const monthlyInterest = effectivePrincipal * monthlyRate;
        const monthlyPrincipal = monthlyRepayment - monthlyInterest;

        return (
          <div className="flex flex-col gap-7">
            {/* Live repayment banner */}
            <div className="flex items-center justify-between py-5 px-6 bg-accent/[0.05] border border-accent/[0.15] rounded-[14px] gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-bold text-accent tabular-nums tracking-[-0.03em]">{formatDollarsSigned(monthlyRepayment)}</span>
                <span className="text-sm text-accent/60 font-medium">/ month</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className="text-xs text-faint tabular-nums">{formatDollarsSigned(monthlyInterest)} interest</span>
                <span className="text-xs text-faint opacity-40">·</span>
                <span className="text-xs text-faint tabular-nums">{formatDollarsSigned(monthlyPrincipal)} principal</span>
              </div>
            </div>

            {/* Rate & term */}
            <div className="flex gap-3.5">
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-xs font-medium text-subtle">Interest rate</label>
                <div className="relative">
                  <input type="text" className="py-3.5 px-4 pr-10 bg-transparent border border-border rounded-xl text-foreground font-[inherit] text-base font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-accent/40 w-full" value={s.interestRate} onChange={(e) => s.setInterestRate(e.target.value)} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-faint pointer-events-none">%</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-xs font-medium text-subtle">Loan term</label>
                <div className="relative">
                  <input type="text" className="py-3.5 px-4 pr-10 bg-transparent border border-border rounded-xl text-foreground font-[inherit] text-base font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-accent/40 w-full" value={s.loanTerm} onChange={(e) => s.setLoanTerm(e.target.value)} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-faint pointer-events-none">yrs</span>
                </div>
              </div>
            </div>

            {/* Offset & extras */}
            <div className="h-px bg-border my-1" />
            <div className="pt-0.5">
              <label className="flex items-center gap-3 cursor-pointer text-[13px] text-subtle">
                <input type="checkbox" className="absolute opacity-0 pointer-events-none peer" checked={s.hasOffset} onChange={(e) => s.setHasOffset(e.target.checked)} />
                <span className="w-[18px] h-[18px] border border-border-hover rounded bg-transparent transition-all duration-150 shrink-0 relative peer-checked:bg-accent peer-checked:border-accent peer-checked:after:content-[''] peer-checked:after:absolute peer-checked:after:top-[3px] peer-checked:after:left-[6px] peer-checked:after:w-1 peer-checked:after:h-2 peer-checked:after:border-accent-contrast peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:rotate-45" />
                Offset account
              </label>
            </div>
            {s.hasOffset && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-subtle">Offset balance</label>
                <input type="text" className={INPUT_CLS} value={s.offsetBalance} {...currencyInput(s.setOffsetBalance)} />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-subtle">Extra repayments / month</label>
              <input type="text" className={INPUT_CLS} value={s.extraRepayments} {...currencyInput(s.setExtraRepayments)} />
            </div>
          </div>
        );
      })()}

      {step === "costs" && (
        <div className="flex flex-col gap-7">
          <div className="flex gap-3.5">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs font-medium text-subtle">Council rates (p.a.)</label>
              <input type="text" className={INPUT_CLS} value={s.councilRates} {...currencyInput(s.setCouncilRates)} />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs font-medium text-subtle">Water rates (p.a.)</label>
              <input type="text" className={INPUT_CLS} value={s.waterRates} {...currencyInput(s.setWaterRates)} />
            </div>
          </div>
          <div className="flex gap-3.5">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs font-medium text-subtle">Insurance (p.a.)</label>
              <input type="text" className={INPUT_CLS} value={s.insurance} {...currencyInput(s.setInsurance)} />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs font-medium text-subtle">Maintenance (%)</label>
              <input type="text" className={INPUT_CLS} value={s.maintenance} onChange={(e) => s.setMaintenance(e.target.value)} />
            </div>
          </div>
          <div className="pt-0.5">
            <label className="flex items-center gap-3 cursor-pointer text-[13px] text-subtle">
              <input type="checkbox" className="absolute opacity-0 pointer-events-none peer" checked={s.hasStrata} onChange={(e) => s.setHasStrata(e.target.checked)} />
              <span className="w-[18px] h-[18px] border border-border-hover rounded bg-transparent transition-all duration-150 shrink-0 relative peer-checked:bg-accent peer-checked:border-accent peer-checked:after:content-[''] peer-checked:after:absolute peer-checked:after:top-[3px] peer-checked:after:left-[6px] peer-checked:after:w-1 peer-checked:after:h-2 peer-checked:after:border-accent-contrast peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:rotate-45" />
              Strata / Body corp
            </label>
          </div>
          {s.hasStrata && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-subtle">Strata fees (quarterly)</label>
              <input type="text" className={INPUT_CLS} value={s.strataFees} {...currencyInput(s.setStrataFees)} />
            </div>
          )}
        </div>
      )}

      {step === "rental" && (
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-subtle">Weekly rent</label>
            <input type="text" className={INPUT_CLS} value={s.weeklyRent} {...currencyInput(s.setWeeklyRent)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-subtle">Vacancy rate (%)</label>
            <input type="text" className={INPUT_CLS} value={s.vacancyRate} onChange={(e) => s.setVacancyRate(e.target.value)} />
          </div>
          <div className="pt-0.5">
            <label className="flex items-center gap-3 cursor-pointer text-[13px] text-subtle">
              <input type="checkbox" className="absolute opacity-0 pointer-events-none peer" checked={s.usePropertyManager} onChange={(e) => s.setUsePropertyManager(e.target.checked)} />
              <span className="w-[18px] h-[18px] border border-border-hover rounded bg-transparent transition-all duration-150 shrink-0 relative peer-checked:bg-accent peer-checked:border-accent peer-checked:after:content-[''] peer-checked:after:absolute peer-checked:after:top-[3px] peer-checked:after:left-[6px] peer-checked:after:w-1 peer-checked:after:h-2 peer-checked:after:border-accent-contrast peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:rotate-45" />
              Property manager
            </label>
          </div>
          {s.usePropertyManager && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-subtle">Management fee (%)</label>
              <input type="text" className={INPUT_CLS} value={s.managementFee} onChange={(e) => s.setManagementFee(e.target.value)} />
            </div>
          )}
        </div>
      )}

      {step === "tax" && (() => {
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
                      <input type="text" className="flex-1 min-w-0 text-[13px] py-1.5 px-2.5 bg-transparent border border-border rounded-xl text-foreground font-[inherit] font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-accent/40" value={b.name} onChange={(e) => {
                        const next = [...s.depBuildings]; next[i] = { ...b, name: e.target.value }; s.setDepBuildings(next);
                      }} placeholder="Name" />
                      <input type="text" className="flex-1 min-w-0 text-[13px] py-1.5 px-2.5 bg-transparent border border-border rounded-xl text-foreground font-[inherit] font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-accent/40" value={`$${b.construction_cost.toLocaleString()}`} onChange={(e) => {
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
                      <input type="text" className="flex-1 min-w-0 text-[13px] py-1.5 px-2.5 bg-transparent border border-border rounded-xl text-foreground font-[inherit] font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-accent/40" value={a.name} onChange={(e) => {
                        const next = [...s.depAssets]; next[i] = { ...a, name: e.target.value }; s.setDepAssets(next);
                      }} placeholder="Name" />
                      <input type="text" className="flex-1 min-w-0 text-[13px] py-1.5 px-2.5 bg-transparent border border-border rounded-xl text-foreground font-[inherit] font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-accent/40" value={`$${a.cost.toLocaleString()}`} onChange={(e) => {
                        const next = [...s.depAssets]; next[i] = { ...a, cost: parseCurrencyInput(e.target.value) }; s.setDepAssets(next);
                      }} placeholder="Cost" />
                      <input type="text" className="flex-1 min-w-0 text-[13px] py-1.5 px-2.5 bg-transparent border border-border rounded-xl text-foreground font-[inherit] font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-accent/40" value={String(a.effective_life_years)} onChange={(e) => {
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
      })()}
    </>
  );

  const footerContent = (
    <div className="pt-6 flex items-center gap-3.5">
      {canGoBack && (
        <button className="flex items-center gap-2 py-3.5 px-[22px] bg-transparent border border-border rounded-xl text-faint font-[inherit] text-sm font-medium cursor-pointer transition-all duration-150 whitespace-nowrap shrink-0 hover:border-white/[0.12] hover:text-subtle" onClick={onStepBack}>
          {isModal ? <X size={16} /> : null}
          {isModal ? "Cancel" : "Back"}
        </button>
      )}
      <button className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-8 bg-accent border-none rounded-xl text-accent-contrast font-[inherit] text-sm font-semibold cursor-pointer transition-all duration-150 tracking-[0.01em] hover:enabled:brightness-[1.08] disabled:opacity-30 disabled:cursor-not-allowed ${step === "setup" ? "flex-none min-w-[200px]" : ""}`} onClick={handleContinue} disabled={step === "setup" && (!s.propertyUse || !s.purchaseMode)}>
        {isModal ? "Save" : (step === "tax" || (!s.isInvestment && step === "costs") ? "Calculate" : "Continue")}
        <ArrowRight size={16} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-stretch justify-start min-h-[520px] w-full">
      <div className="flex flex-col gap-[35px] w-full max-w-[480px]">
        {/* Breadcrumb progress indicator */}
        <div className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase text-subtle h-4 leading-none">
          <span className="font-semibold text-accent tabular-nums">Step {currentStepIndex + 1} of {stepOrder.length}</span>
          <span className="text-faint">·</span>
          <span className="text-subtle">{meta.title}</span>
        </div>

        {/* Card */}
        <div className={step === "setup" ? "flex flex-col items-center" : ""}>
          <div className="pt-4 pb-3">{fieldsContent}</div>
          {footerContent}
        </div>
      </div>
    </div>
  );
}
