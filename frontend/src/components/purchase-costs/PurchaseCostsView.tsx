"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import { fetchPurchaseCosts } from "@/lib/api";
import type { PurchaseCostsResponse } from "@/lib/api";
import { parseCurrencyInput, formatDollars } from "@/lib/formatters";
import { useApiCall } from "@/hooks/useApiCall";
import "./purchase-costs.css";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

type CostsData = PurchaseCostsResponse;

// ── Toggle component ────────────────────────────

function Toggle({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="pc-toggle" data-active={active} onClick={onToggle}>
      <div className="pc-toggle-track">
        <div className="pc-toggle-thumb" />
      </div>
      <span className="pc-toggle-label">{label}</span>
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
      <div className="pc-row" onClick={() => hasDetails && setOpen(!open)}>
        <div className="pc-row-left">
          {hasDetails && (
            <ChevronRight className={`pc-row-chevron ${open ? "pc-row-chevron--open" : ""}`} size={14} />
          )}
          {!hasDetails && <span style={{ width: 14 }} />}
          <span className="pc-row-name">{name}</span>
          {note && <span className="pc-row-note">{note}</span>}
        </div>
        <span className={`pc-row-amount ${isSavings ? "pc-row-amount--savings" : ""}`}>
          {formatDollars(amount)}
        </span>
      </div>
      {open && details && (
        <div className="pc-detail">
          {details.map((d) => {
            const val = parseCurrencyInput(d.value);
            const pct = waterfall && maxDetail > 0 ? (val / maxDetail) * 100 : 0;
            return (
              <div key={d.label} className={`pc-detail-line ${waterfall ? "pc-detail-line--waterfall" : ""}`}>
                <span className="pc-detail-line-label">{d.label}</span>
                {waterfall && (
                  <div className="pc-waterfall-track">
                    <div className="pc-waterfall-bar" style={{ width: `${pct}%` }} />
                  </div>
                )}
                <span className="pc-detail-line-value">{d.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

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

  // Debounced API call
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

      <div className="pc-page custom-scrollbar">
        {/* Property Details */}
        <div className="pc-section-label">Property Details</div>
        <div className="pc-inputs-card">
          <div className="pc-inputs-row">
            <div className="pc-field pc-field--state">
              <label className="pc-field-label">State</label>
              <select className="pc-select" value={state} onChange={(e) => setState(e.target.value)}>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="pc-field pc-field--price">
              <label className="pc-field-label">Purchase Price</label>
              <input className="pc-input" type="text" inputMode="numeric" placeholder="$600,000" value={priceStr} onChange={handlePriceChange} />
            </div>
            <div className="pc-field pc-field--deposit">
              <label className="pc-field-label">Deposit</label>
              <input className="pc-input" type="text" inputMode="numeric" placeholder="10%" value={depositStr} onChange={handleDepositChange} />
            </div>
            <div className="pc-field pc-field--type">
              <label className="pc-field-label">Type</label>
              <select className="pc-select" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option value="existing">Existing</option>
                <option value="new">New</option>
                <option value="land">Land</option>
              </select>
            </div>
          </div>

          <div className="pc-inputs-toggles">
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
            <div className="pc-hero">
              <div className="pc-section-label">Total Cash to Purchase</div>
              <div className="pc-hero-amount">{formatDollars(data.total_upfront_cost - lmiSaving)}</div>
              <div className="pc-hero-subtitle">Total cash needed to purchase (including deposit)</div>

              {/* Deposit / costs split */}
              <div className="pc-hero-split">
                <div className="pc-hero-split-item">
                  <div className="pc-hero-split-value">{formatDollars(data.deposit_amount)}</div>
                  <div className="pc-hero-split-label">Deposit ({(depositPct * 100).toFixed(0)}%)</div>
                </div>
                <div className="pc-hero-split-divider" />
                <div className="pc-hero-split-item">
                  <div className="pc-hero-split-value">{formatDollars(data.stamp_duty_payable + effectiveLmi + data.total_fees - data.total_grant_savings)}</div>
                  <div className="pc-hero-split-label">Purchase Costs</div>
                </div>
              </div>

              {/* Loan metadata */}
              <div className="pc-hero-meta">
                Loan amount <span className="pc-hero-meta-value">{formatDollars(data.effective_loan_amount)}</span> · LVR <span className="pc-hero-meta-value">{(data.lvr * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="pc-breakdown-card">
              <div className="pc-breakdown-header">
                <div className="pc-section-label" style={{ textAlign: "left" }}>Cost Breakdown</div>
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
            <div className="pc-section-label">Loan Summary</div>
            <div className="pc-loan-summary">
              <div className="pc-loan-metric">
                <div className="pc-loan-value">{formatDollars(data.deposit_amount)}</div>
                <div className="pc-loan-label">Deposit</div>
              </div>
              <div className="pc-loan-metric">
                <div className="pc-loan-value">{formatDollars(data.effective_loan_amount)}</div>
                <div className="pc-loan-label">Loan Amount</div>
              </div>
              <div className="pc-loan-metric">
                <div className="pc-loan-value">{(data.lvr * 100).toFixed(0)}%</div>
                <div className="pc-loan-label">LVR</div>
              </div>
            </div>
          </>
        )}

        {!data && price <= 0 && (
          <div className="pc-hero">
            <div className="pc-hero-subtitle">Enter property details to calculate costs</div>
          </div>
        )}

        {/* Footer */}
        <div className="pc-footer">
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
