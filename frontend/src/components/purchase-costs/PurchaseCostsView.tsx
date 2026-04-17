"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import { fetchPurchaseCosts } from "@/lib/api";
import type { PurchaseCostsResponse } from "@/lib/api";
import { parseCurrencyInput, formatDollars } from "@/lib/formatters";
import { useApiCall } from "@/hooks/useApiCall";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

type CostsData = PurchaseCostsResponse;

// ── Toggle component ────────────────────────────

function Toggle({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="flex items-center gap-2 cursor-pointer select-none" onClick={onToggle}>
      <div className={`relative w-9 h-5 rounded-full shrink-0 border transition-all duration-200 ${
        active
          ? "bg-accent/35 border-accent/50"
          : "bg-accent/12 border-accent/15"
      }`}>
        <div className={`absolute top-[1px] left-[1px] w-4 h-4 rounded-full transition-all duration-200 ${
          active
            ? "translate-x-4 bg-accent shadow-[0_0_8px_var(--color-accent)]"
            : "bg-subtle/50"
        }`} />
      </div>
      <span className={`text-[13px] font-medium transition-colors duration-150 ${
        active ? "text-foreground/85" : "text-muted/55"
      }`}>{label}</span>
    </button>
  );
}

// ── Breakdown row ───────────────────────────────

function BreakdownRow({
  name,
  amount,
  isSavings,
  details,
  waterfall,
  note,
}: {
  name: string;
  amount: number;
  isSavings?: boolean;
  details?: { label: string; value: string }[];
  waterfall?: boolean;
  note?: string;
}) {
  const [open, setOpen] = useState(false);
  const hasDetails = details && details.length > 0;

  const maxDetail = waterfall && details
    ? Math.max(...details.map(d => parseCurrencyInput(d.value)))
    : 0;

  return (
    <>
      <div
        className="flex justify-between items-center px-7 py-3.5 cursor-pointer transition-colors hover:bg-accent/[0.04] [&+&]:border-t [&+&]:border-accent/[0.08]"
        onClick={() => hasDetails && setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {hasDetails ? (
            <ChevronRight className={`text-accent/50 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`} size={14} />
          ) : (
            <span className="w-3.5" />
          )}
          <span className="text-[15px] font-semibold text-foreground/85">{name}</span>
          {note && <span className="text-[11px] font-medium text-faint ml-1.5">{note}</span>}
        </div>
        <span className={`text-[15px] font-semibold tabular-nums ${isSavings ? "text-accent" : "text-foreground/85"}`}>
          {formatDollars(amount)}
        </span>
      </div>
      {open && details && (
        <div className="flex flex-col gap-1.5 px-7 py-2 pl-[52px] border-t border-accent/[0.06] bg-accent/[0.02]">
          {details.map((d) => {
            const val = parseCurrencyInput(d.value);
            const pct = waterfall && maxDetail > 0 ? (val / maxDetail) * 100 : 0;
            return (
              <div key={d.label} className={`flex justify-between items-center text-[13px] text-muted/50 ${waterfall ? "gap-3" : ""}`}>
                <span className={`shrink-0 ${waterfall ? "w-[170px]" : ""}`}>{d.label}</span>
                {waterfall && (
                  <div className="flex-1 h-1.5 rounded-sm bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-sm bg-accent/40 transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                )}
                <span className="tabular-nums font-medium shrink-0">{d.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Card shell (reused for inputs + breakdown) ──

const CARD_SHADOW = "shadow-[0_1px_4px_rgba(0,0,0,0.20),0_0_0_0.5px_color-mix(in_srgb,var(--color-accent)_8%,transparent),inset_0_1px_0_rgba(255,255,255,0.02)]";

// ── Main component ──────────────────────────────

export default function PurchaseCostsView() {
  const [state, setState] = useState<string>("QLD");
  const [priceStr, setPriceStr] = useState("$600,000");
  const [depositStr, setDepositStr] = useState("10%");
  const [propertyType, setPropertyType] = useState<string>("existing");
  const [firstHome, setFirstHome] = useState(true);
  const [ownerOcc, setOwnerOcc] = useState(true);
  const [couple, setCouple] = useState(false);
  const [lmiExempt, setLmiExempt] = useState(false);

  const price = parseCurrencyInput(priceStr);
  const depositPct = parseFloat(depositStr.replace("%", "")) / 100 || 0;

  const { data, error } = useApiCall<CostsData>(
    (signal) => fetchPurchaseCosts({
      state,
      price,
      deposit_percent: Math.min(depositPct, 1),
      property_type: propertyType,
      buyer_type: couple ? "couple" : "individual",
      owner_occupier: ownerOcc,
      first_home_buyer: firstHome,
      selected_grants: [],
      income: 0,
      partner_income: 0,
    }, signal),
    [state, price, depositPct, propertyType, firstHome, ownerOcc, couple],
    { debounce: 300, enabled: price > 0 },
  );

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setPriceStr(raw ? formatDollars(Number(raw)) : "");
  };

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    setDepositStr(raw ? `${raw}%` : "");
  };

  // Build breakdown details
  const stampDutyDetails = data
    ? [
        { label: "Base duty", value: formatDollars(data.stamp_duty_base) },
        { label: "Concession", value: data.stamp_duty_concession > 0 ? `-${formatDollars(data.stamp_duty_concession)}` : "$0" },
      ]
    : [];

  const effectiveLmi = data ? (lmiExempt ? 0 : data.lmi_payable) : 0;
  const lmiSaving = data ? data.lmi_payable - effectiveLmi : 0;

  const lmiDetails = data
    ? [
        { label: "Base LMI", value: formatDollars(data.lmi_base) },
        { label: "Waived", value: (data.lmi_waived || lmiExempt) ? "Yes" : "No" },
        ...(lmiExempt && data.lmi_payable > 0 ? [{ label: "Professional exemption", value: `-${formatDollars(data.lmi_payable)}` }] : []),
      ]
    : [];

  const feeDetails = data
    ? [
        { label: "Legal / conveyancing", value: formatDollars(data.legal_fees) },
        { label: "Title registration", value: formatDollars(data.registration_fee) },
        { label: "Mortgage registration", value: formatDollars(data.mortgage_registration_fee) },
        { label: "Building & pest", value: formatDollars(data.building_pest_inspection) },
        { label: "Loan establishment", value: formatDollars(data.loan_establishment_fee) },
      ]
    : [];

  const grantDetails = data?.grants_applied.length
    ? data.grants_applied.map((g) => ({
        label: g.scheme_name,
        value: g.amount > 0 ? `-${formatDollars(g.amount)}` : g.description,
      }))
    : [];

  return (
    <>
      <Header />

      <div className="flex flex-col items-center gap-7 px-9 py-6 pb-4 overflow-y-auto custom-scrollbar" style={{ height: "calc(100vh - 49px)" }}>
        {/* Section label */}
        <div className="text-[11px] font-semibold uppercase tracking-widest text-accent/60 text-center">
          Property Details
        </div>

        {/* Property details card */}
        <div className={`w-full max-w-[720px] rounded-2xl bg-card border border-accent/15 px-9 py-8 ${CARD_SHADOW} animate-fade-up [animation-delay:0.1s]`}>
          <div className="flex gap-6 items-end max-sm:flex-wrap">
            <div className="flex flex-col gap-2.5 flex-[0_0_100px] min-w-[100px]">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted/50 whitespace-nowrap">State</label>
              <select className="form-select" value={state} onChange={(e) => setState(e.target.value)}>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2.5 flex-[1_1_180px] min-w-[160px]">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted/50 whitespace-nowrap">Purchase Price</label>
              <input className="form-input" type="text" inputMode="numeric" placeholder="$600,000" value={priceStr} onChange={handlePriceChange} />
            </div>
            <div className="flex flex-col gap-2.5 flex-[0_0_100px] min-w-[100px]">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted/50 whitespace-nowrap">Deposit</label>
              <input className="form-input" type="text" inputMode="numeric" placeholder="10%" value={depositStr} onChange={handleDepositChange} />
            </div>
            <div className="flex flex-col gap-2.5 flex-[0_0_130px] min-w-[130px]">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted/50 whitespace-nowrap">Type</label>
              <select className="form-select" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option value="existing">Existing</option>
                <option value="new">New</option>
                <option value="land">Land</option>
              </select>
            </div>
          </div>

          <div className="flex gap-8 mt-8 pt-7 border-t border-accent/10 max-sm:flex-wrap max-sm:gap-4">
            <Toggle label="First Home" active={firstHome} onToggle={() => setFirstHome(!firstHome)} />
            <Toggle label="Owner Occupied" active={ownerOcc} onToggle={() => setOwnerOcc(!ownerOcc)} />
            <Toggle label="Couple" active={couple} onToggle={() => setCouple(!couple)} />
            <Toggle label="LMI Exempt" active={lmiExempt} onToggle={() => setLmiExempt(!lmiExempt)} />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-[14px] text-red-400/80">
            {error}
          </div>
        )}

        {/* Hero total */}
        {data && (
          <>
            <div className="text-center animate-fade-up [animation-delay:0.2s]">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-accent/60 text-center">
                Total Cash to Purchase
              </div>
              <div className="text-[56px] font-bold tracking-[-0.04em] text-foreground leading-[1.1] tabular-nums max-sm:text-[40px]">
                {formatDollars(data.total_upfront_cost - lmiSaving)}
              </div>
              <div className="text-[14px] text-subtle/60 mt-1">
                Total cash needed to purchase (including deposit)
              </div>

              {/* Deposit / costs split */}
              <div className="flex justify-center items-center gap-8 mt-5">
                <div className="text-center">
                  <div className="text-[22px] font-semibold text-foreground tabular-nums">{formatDollars(data.deposit_amount)}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-subtle mt-1">Deposit ({(depositPct * 100).toFixed(0)}%)</div>
                </div>
                <div className="w-px h-9 bg-border" />
                <div className="text-center">
                  <div className="text-[22px] font-semibold text-foreground tabular-nums">{formatDollars(data.stamp_duty_payable + effectiveLmi + data.total_fees - data.total_grant_savings)}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-subtle mt-1">Purchase Costs</div>
                </div>
              </div>

              {/* Loan metadata */}
              <div className="text-[13px] text-subtle mt-4 pb-6 border-b border-border mb-2">
                Loan amount <span className="font-semibold text-foreground">{formatDollars(data.effective_loan_amount)}</span> · LVR <span className="font-semibold text-foreground">{(data.lvr * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Cost breakdown */}
            <div className={`w-full max-w-[720px] rounded-2xl bg-card border border-accent/15 py-6 ${CARD_SHADOW} animate-fade-up [animation-delay:0.3s]`}>
              <div className="px-7 pb-4">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-accent/60 text-left">
                  Cost Breakdown
                </div>
              </div>

              <BreakdownRow name="Stamp Duty" amount={data.stamp_duty_payable} details={stampDutyDetails} />
              {(data.lmi_payable > 0 || data.lmi_base > 0) && (
                <BreakdownRow name="Lenders Mortgage Insurance" amount={effectiveLmi} details={lmiDetails} />
              )}
              <BreakdownRow name="Fees" amount={data.total_fees} details={feeDetails} waterfall />
              <BreakdownRow
                name="Grant Savings"
                amount={data.total_grant_savings > 0 ? -data.total_grant_savings : 0}
                isSavings={data.total_grant_savings > 0}
                details={grantDetails}
                note={data.grants_applied.length > 0 ? data.grants_applied.map(g => g.scheme_name.split(" ").map(w => w[0]).join("")).join(", ") : undefined}
              />
            </div>

            {/* Loan summary */}
            <div className="text-[11px] font-semibold uppercase tracking-widest text-accent/60 text-center">
              Loan Summary
            </div>
            <div className="w-full max-w-[720px] flex justify-center gap-16 py-5 rounded-2xl bg-accent/[0.04] border border-accent/12 animate-fade-up [animation-delay:0.4s] max-sm:gap-8">
              <div className="text-center">
                <div className="text-[22px] font-semibold text-foreground tabular-nums">{formatDollars(data.deposit_amount)}</div>
                <div className="text-[12px] text-faint font-medium uppercase tracking-widest mt-0.5">Deposit</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] font-semibold text-foreground tabular-nums">{formatDollars(data.effective_loan_amount)}</div>
                <div className="text-[12px] text-faint font-medium uppercase tracking-widest mt-0.5">Loan Amount</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] font-semibold text-foreground tabular-nums">{(data.lvr * 100).toFixed(0)}%</div>
                <div className="text-[12px] text-faint font-medium uppercase tracking-widest mt-0.5">LVR</div>
              </div>
            </div>
          </>
        )}

        {!data && price <= 0 && (
          <div className="text-center">
            <div className="text-[14px] text-subtle/60">Enter property details to calculate costs</div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-2">
          <Link
            href="/"
            className="group flex items-center justify-center gap-2 py-4 text-[14px] font-medium tracking-wide text-muted/30 no-underline transition-colors duration-300 hover:text-accent/70"
          >
            <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">&larr;</span>
            All Tools
          </Link>
        </div>
      </div>
    </>
  );
}
