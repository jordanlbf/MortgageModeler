"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import "./purchase-costs.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

// ── Types ───────────────────────────────────────

interface GrantApplied {
  scheme_id: string;
  scheme_name: string;
  category: string;
  effect_type: string;
  amount: number;
  description: string;
}

interface CostsData {
  stamp_duty_base: number;
  stamp_duty_concession: number;
  stamp_duty_payable: number;
  lmi_base: number;
  lmi_waived: boolean;
  lmi_payable: number;
  legal_fees: number;
  registration_fee: number;
  mortgage_registration_fee: number;
  building_pest_inspection: number;
  loan_establishment_fee: number;
  total_fees: number;
  grants_applied: GrantApplied[];
  total_grant_savings: number;
  equity_contribution: number;
  effective_loan_amount: number;
  deposit_amount: number;
  min_deposit_percent: number;
  total_upfront_cost: number;
  lvr: number;
}

// ── Helpers ─────────────────────────────────────

function parseCurrency(s: string): number {
  return Number(s.replace(/[^0-9.]/g, "")) || 0;
}

function formatCurrency(n: number): string {
  if (n === 0) return "";
  return "$" + n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
}

function formatDollars(n: number): string {
  const abs = Math.abs(n);
  const formatted = "$" + abs.toLocaleString("en-AU", { maximumFractionDigits: 0 });
  return n < 0 ? `-${formatted}` : formatted;
}

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
}: {
  name: string;
  amount: number;
  isSavings?: boolean;
  details?: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const hasDetails = details && details.length > 0;

  return (
    <>
      <div className="pc-row" onClick={() => hasDetails && setOpen(!open)}>
        <div className="pc-row-left">
          {hasDetails && (
            <ChevronRight className={`pc-row-chevron ${open ? "pc-row-chevron--open" : ""}`} size={14} />
          )}
          {!hasDetails && <span style={{ width: 14 }} />}
          <span className="pc-row-name">{name}</span>
        </div>
        <span className={`pc-row-amount ${isSavings ? "pc-row-amount--savings" : ""}`}>
          {formatDollars(amount)}
        </span>
      </div>
      {open && details && (
        <div className="pc-detail">
          {details.map((d) => (
            <div key={d.label} className="pc-detail-line">
              <span>{d.label}</span>
              <span className="pc-detail-line-value">{d.value}</span>
            </div>
          ))}
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
  const [data, setData] = useState<CostsData | null>(null);

  const price = parseCurrency(priceStr);
  const depositPct = parseFloat(depositStr.replace("%", "")) / 100 || 0;

  // Debounced API call
  useEffect(() => {
    if (price <= 0) {
      setData(null);
      return;
    }

    const timer = setTimeout(() => {
      const controller = new AbortController();

      fetch(`${API_BASE}/api/purchase-costs/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          price,
          deposit_percent: Math.min(depositPct, 1),
          property_type: propertyType,
          buyer_type: couple ? "couple" : "individual",
          owner_occupier: ownerOcc,
          first_home_buyer: firstHome,
          selected_grants: [],
        }),
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then(setData)
        .catch((err) => {
          if (err.name !== "AbortError") console.error("Purchase costs error:", err);
        });

      return () => controller.abort();
    }, 300);

    return () => clearTimeout(timer);
  }, [state, price, depositPct, propertyType, firstHome, ownerOcc, couple]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setPriceStr(raw ? formatCurrency(Number(raw)) : "");
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

  const lmiDetails = data
    ? [
        { label: "Base LMI", value: formatDollars(data.lmi_base) },
        { label: "Waived", value: data.lmi_waived ? "Yes" : "No" },
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
          </div>
        </div>

        {/* Hero total */}
        {data && (
          <>
            <div className="pc-hero">
              <div className="pc-section-label">Total Upfront Cost</div>
              <div className="pc-hero-amount">{formatDollars(data.total_upfront_cost)}</div>
              <div className="pc-hero-subtitle">Total cash needed to purchase (including deposit)</div>
            </div>

            {/* Cost breakdown */}
            <div className="pc-breakdown-card">
              <div className="pc-breakdown-header">
                <div className="pc-section-label" style={{ textAlign: "left" }}>Cost Breakdown</div>
              </div>

              <BreakdownRow name="Deposit" amount={data.deposit_amount} />
              <BreakdownRow name="Stamp Duty" amount={data.stamp_duty_payable} details={stampDutyDetails} />
              {(data.lmi_payable > 0 || data.lmi_base > 0) && (
                <BreakdownRow name="Lenders Mortgage Insurance" amount={data.lmi_payable} details={lmiDetails} />
              )}
              <BreakdownRow name="Fees" amount={data.total_fees} details={feeDetails} />
              {data.total_grant_savings > 0 && (
                <BreakdownRow
                  name="Grant Savings"
                  amount={-data.total_grant_savings}
                  isSavings
                  details={grantDetails}
                />
              )}

              {/* Total row */}
              <div className="pc-total-row">
                <span className="pc-total-amount">{formatDollars(data.total_upfront_cost)}</span>
              </div>
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
