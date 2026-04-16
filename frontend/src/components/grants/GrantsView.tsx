"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchGrantsEligibility } from "@/lib/api";
import type { GrantSchemeWithEligibility } from "@/lib/api";
import Header from "@/components/layout/Header";
import { parseCurrencyInput, formatDollars } from "@/lib/formatters";
import { useApiCall } from "@/hooks/useApiCall";
import DenseSchemeCard, { FEDERAL_COLOR, STATE_COLORS } from "./DenseSchemeCard";
import "./grants.css";

// ── Types ───────────────────────────────────────

const ALL_REGIONS = ["Federal", "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;
type Region = (typeof ALL_REGIONS)[number];

// ── Main component ──────────────────────────────

export default function GrantsView() {
  const [regions, setRegions] = useState<Set<string>>(() => new Set(["Federal"]));
  const [priceStr, setPriceStr] = useState("");
  const [incomeStr, setIncomeStr] = useState("");
  const [propertyType, setPropertyType] = useState<"new" | "existing" | "land" | "off-the-plan" | null>(null);
  const [buyerType, setBuyerType] = useState<"individual" | "couple" | null>(null);
  const [firstHomeBuyer, setFirstHomeBuyer] = useState<boolean | null>(null);
  const [ownerOccupier, setOwnerOccupier] = useState<boolean | null>(null);
  const [singleParent, setSingleParent] = useState<boolean | null>(null);
  const [partnerIncomeStr, setPartnerIncomeStr] = useState("");
  const [ownedPropertyRecently, setOwnedPropertyRecently] = useState<boolean | null>(null);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  const toggleRegion = (r: Region) => {
    setRegions((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r); else next.add(r);
      return next;
    });
  };

  const price = parseCurrencyInput(priceStr);
  const income = parseCurrencyInput(incomeStr);
  const partnerIncome = parseCurrencyInput(partnerIncomeStr);
  const showPartnerIncome = buyerType === "couple";
  const showOwnedRecently = regions.has("ACT");

  // Fetch eligibility from API whenever inputs change (debounced)
  const states = Array.from(regions);
  const { data: results, error } = useApiCall<GrantSchemeWithEligibility[]>(
    async (signal) => {
      if (states.length === 0) return null;
      const resp = await fetchGrantsEligibility({
        states,
        price,
        income,
        partner_income: showPartnerIncome ? partnerIncome : 0,
        property_type: propertyType === "off-the-plan" ? "new" : propertyType,
        buyer_type: buyerType,
        first_home_buyer: firstHomeBuyer,
        owner_occupier: ownerOccupier,
        single_parent: singleParent,
        off_the_plan: propertyType === "off-the-plan" ? true : null,
        owned_property_in_last_2_years: showOwnedRecently ? ownedPropertyRecently : null,
      }, signal);
      return resp.schemes;
    },
    [states.join(","), price, income, partnerIncome, propertyType, buyerType, firstHomeBuyer, ownerOccupier, singleParent, ownedPropertyRecently, showPartnerIncome, showOwnedRecently],
    { debounce: 300 },
  );

  const schemes = results ?? [];
  const eligibleCount = schemes.filter((r) => r.result.eligible).length;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setPriceStr(raw ? formatDollars(Number(raw)) : "");
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setIncomeStr(raw ? formatDollars(Number(raw)) : "");
  };

  const handlePartnerIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setPartnerIncomeStr(raw ? formatDollars(Number(raw)) : "");
  };

  return (
    <>
      <Header />

      <div className="flex flex-col px-9 py-6 overflow-hidden" style={{ height: "calc(100vh - 49px)" }}>
        {/* Hero + Filter bar wrapper */}
        <div className="grants-bar-wrapper">
          <div className="grants-hero">
            <h1 className="text-[44px] font-semibold tracking-[-0.04em] text-foreground">
              Government <span style={{ color: "var(--color-accent)" }}>Grants</span>
            </h1>
          </div>

          {/* Filter bar */}
          <div className="grants-bar">
          <div className="grants-field grants-field--grow">
            <label className="grants-field-label">Purchase Price</label>
            <input className="grants-bar-input" type="text" inputMode="numeric" placeholder="$0" value={priceStr} onChange={handlePriceChange} />
          </div>

          <div className="grants-bar-divider" />

          <div className="grants-field grants-field--grow">
            <label className="grants-field-label">Annual Income</label>
            <input className="grants-bar-input" type="text" inputMode="numeric" placeholder="$0" value={incomeStr} onChange={handleIncomeChange} />
          </div>

          {showPartnerIncome && (
            <>
              <div className="grants-bar-divider" />
              <div className="grants-field grants-field--grow">
                <label className="grants-field-label">Partner Income</label>
                <input className="grants-bar-input" type="text" inputMode="numeric" placeholder="$0" value={partnerIncomeStr} onChange={handlePartnerIncomeChange} />
              </div>
            </>
          )}

          <div className="grants-bar-divider" />

          <div className="grants-field grants-field--regions">
            <label className="grants-field-label">State</label>
            <div className="grants-region-grid">
              {ALL_REGIONS.map((r) => (
                <button
                  key={r}
                  className="grants-pill grants-pill--region"
                  data-active={regions.has(r)}
                  style={{ "--region-color": r === "Federal" ? FEDERAL_COLOR : STATE_COLORS[r] } as React.CSSProperties}
                  onClick={() => toggleRegion(r)}
                >{r}</button>
              ))}
            </div>
          </div>

          <div className="grants-bar-divider" />

          <div className="grants-toggles">
            <div className="grants-field grants-field--toggle-wide">
              <label className="grants-field-label">Property</label>
              <div className="grants-bar-pills">
                {([
                  { value: "new" as const, label: "New" },
                  { value: "existing" as const, label: "Existing" },
                  { value: "land" as const, label: "Land" },
                  { value: "off-the-plan" as const, label: "OTP" },
                ]).map((o) => (
                  <button key={o.value} className="grants-pill grants-pill--uniform" data-active={propertyType === o.value} onClick={() => setPropertyType(propertyType === o.value ? null : o.value)}>{o.label}</button>
                ))}
              </div>
            </div>

            <div className="grants-bar-divider grants-bar-divider--tight" />

            <div className="grants-field grants-field--toggle-wide">
              <label className="grants-field-label">Buyer</label>
              <div className="grants-bar-pills">
                {([{ value: "individual" as const, label: "Individual" }, { value: "couple" as const, label: "Couple" }]).map((o) => (
                  <button key={o.value} className="grants-pill grants-pill--uniform" data-active={buyerType === o.value} onClick={() => setBuyerType(buyerType === o.value ? null : o.value)}>{o.label}</button>
                ))}
              </div>
            </div>

            <div className="grants-bar-divider grants-bar-divider--tight" />

            <div className="grants-field grants-field--toggle">
              <label className="grants-field-label">First Home</label>
              <div className="grants-bar-pills">
                {([true, false] as const).map((v) => (
                  <button key={String(v)} className="grants-pill grants-pill--uniform grants-pill--tri" data-active={firstHomeBuyer === v} data-value={String(v)} onClick={() => setFirstHomeBuyer(firstHomeBuyer === v ? null : v)}>
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grants-bar-divider grants-bar-divider--tight" />

            <div className="grants-field grants-field--toggle">
              <label className="grants-field-label">Owner Occupied</label>
              <div className="grants-bar-pills">
                {([true, false] as const).map((v) => (
                  <button key={String(v)} className="grants-pill grants-pill--uniform grants-pill--tri" data-active={ownerOccupier === v} data-value={String(v)} onClick={() => setOwnerOccupier(ownerOccupier === v ? null : v)}>
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grants-bar-divider grants-bar-divider--tight" />

            <div className="grants-field grants-field--toggle">
              <label className="grants-field-label">Single Parent</label>
              <div className="grants-bar-pills">
                {([true, false] as const).map((v) => (
                  <button key={String(v)} className="grants-pill grants-pill--uniform grants-pill--tri" data-active={singleParent === v} data-value={String(v)} onClick={() => setSingleParent(singleParent === v ? null : v)}>
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>

            {showOwnedRecently && (
              <>
                <div className="grants-bar-divider grants-bar-divider--tight" />

                <div className="grants-field grants-field--toggle">
                  <label className="grants-field-label">Owned in 2yr</label>
                  <div className="grants-bar-pills">
                    {([true, false] as const).map((v) => (
                      <button key={String(v)} className="grants-pill grants-pill--uniform grants-pill--tri" data-active={ownedPropertyRecently === v} data-value={String(v)} onClick={() => setOwnedPropertyRecently(ownedPropertyRecently === v ? null : v)}>
                        {v ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>

        {/* Results bar */}
        <div className="grants-results-bar">
          <span>
            <strong>{eligibleCount}</strong> {eligibleCount === 1 ? "scheme" : "schemes"} matched
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-[14px] text-red-400/80">
            {error}
          </div>
        )}

        {/* Card grid — only show eligible schemes */}
        <div className="grants-card-grid flex-1 min-h-0 custom-scrollbar">
          {schemes.filter((r) => r.result.eligible).map(({ scheme, result }) => (
            <DenseSchemeCard
              key={scheme.id}
              scheme={scheme}
              result={result}
              isExpanded={expandedSchemeId === scheme.id}
              onToggleExpand={() => setExpandedSchemeId((prev) => (prev === scheme.id ? null : scheme.id))}
            />
          ))}
        </div>

        {/* Footer */}
        <Link
          href="/"
          className="group mt-auto flex items-center justify-center gap-2 py-4 text-[14px] font-medium tracking-wide text-muted/30 no-underline transition-colors duration-300 hover:text-accent/70"
        >
          <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">&larr;</span>
          All Tools
        </Link>
      </div>
    </>
  );
}
