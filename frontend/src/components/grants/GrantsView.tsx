"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchGrantsEligibility } from "@/lib/api";
import type { GrantSchemeWithEligibility } from "@/lib/api";
import Header from "@/components/layout/Header";
import { parseCurrencyInput, formatDollars } from "@/lib/formatters";
import { useApiCall } from "@/hooks/useApiCall";
import { mix, STATE_COLORS } from "@/lib/theme";
import DenseSchemeCard from "./DenseSchemeCard";

// ── Types ───────────────────────────────────────

const ALL_REGIONS = ["Federal", "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;
type Region = (typeof ALL_REGIONS)[number];

// ── Pill button ─────────────────────────────────

function Pill({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  const accent = color ?? "var(--color-accent)";
  return (
    <button
      className="h-[26px] px-2.5 rounded-full border text-[14px] font-semibold cursor-pointer whitespace-nowrap outline-none leading-none transition-all duration-150 min-w-[72px] text-center justify-center"
      style={active ? {
        background: mix(accent, 14),
        color: accent,
        borderColor: mix(accent, 25),
        boxShadow: `0 0 8px ${mix(accent, 10)}`,
      } : {
        background: "transparent",
        color: mix("var(--color-muted)", 50),
        borderColor: "rgba(255,255,255,0.07)",
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function TriPill({ label, active, isNo, onClick }: { label: string; active: boolean; isNo?: boolean; onClick: () => void }) {
  const red = active && isNo;
  return (
    <button
      className="h-[26px] px-2.5 rounded-full border text-[14px] font-semibold cursor-pointer whitespace-nowrap outline-none leading-none transition-all duration-150 min-w-[72px] text-center justify-center"
      style={red ? {
        background: "rgba(248,113,113,0.12)",
        color: "#f87171",
        borderColor: "rgba(248,113,113,0.25)",
        boxShadow: "0 0 8px rgba(248,113,113,0.08)",
      } : active ? {
        background: mix("var(--color-accent)", 14),
        color: "var(--color-accent)",
        borderColor: mix("var(--color-accent)", 25),
        boxShadow: `0 0 8px ${mix("var(--color-accent)", 10)}`,
      } : {
        background: "transparent",
        color: mix("var(--color-muted)", 50),
        borderColor: "rgba(255,255,255,0.07)",
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ── Compact bar input ───────────────────────────

function BarInput({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="flex flex-col items-center gap-4 flex-1 min-w-0">
      <label className="text-[15px] font-semibold uppercase tracking-widest text-muted/70 leading-none whitespace-nowrap">{label}</label>
      <input
        className="w-full h-[30px] px-2.5 text-center rounded-lg border border-white/[0.06] bg-white/[0.04] text-foreground/90 text-[15px] font-semibold tabular-nums outline-none caret-accent transition-all duration-150 hover:border-white/10 hover:bg-white/[0.06] focus:border-accent/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-accent)_10%,transparent)] placeholder:text-subtle/35 placeholder:font-normal"
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

// ── Divider ─────────────────────────────────────

function Divider({ tight }: { tight?: boolean }) {
  return <div className={`w-px h-7 bg-white/[0.05] shrink-0 ${tight ? "mx-2" : "mx-4"}`} />;
}

// ── Tri-state toggle field ──────────────────────

function TriField({ label, value, onToggle, wide }: { label: string; value: boolean | null; onToggle: (v: boolean | null) => void; wide?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-4 shrink-0 ${wide ? "w-[220px]" : "w-[140px]"}`}>
      <label className="text-[15px] font-semibold uppercase tracking-widest text-muted/70 leading-none whitespace-nowrap">{label}</label>
      <div className="flex gap-1.5">
        <TriPill label="Yes" active={value === true} onClick={() => onToggle(value === true ? null : true)} />
        <TriPill label="No" active={value === false} isNo onClick={() => onToggle(value === false ? null : false)} />
      </div>
    </div>
  );
}

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

  const statesArr = Array.from(regions);
  const { data: results, error } = useApiCall<GrantSchemeWithEligibility[]>(
    async (signal) => {
      if (statesArr.length === 0) return null;
      const resp = await fetchGrantsEligibility({
        states: statesArr,
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
    [statesArr.join(","), price, income, partnerIncome, propertyType, buyerType, firstHomeBuyer, ownerOccupier, singleParent, ownedPropertyRecently, showPartnerIncome, showOwnedRecently],
    { debounce: 300 },
  );

  const schemes = results ?? [];
  const eligibleCount = schemes.filter((r) => r.result.eligible).length;

  const handleCurrencyInput = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setter(raw ? formatDollars(Number(raw)) : "");
  };

  return (
    <>
      <Header />

      <div className="flex flex-col px-9 py-6 overflow-hidden" style={{ height: "calc(100vh - 49px)" }}>
        {/* Hero + Filter bar */}
        <div className="flex flex-col items-center mb-5">
          <div className="text-center py-2 pb-5 animate-fade-up">
            <h1 className="text-[44px] font-semibold tracking-[-0.04em] text-foreground">
              Government <span className="text-accent">Grants</span>
            </h1>
          </div>

          {/* Filter bar */}
          <div className="flex items-center min-h-[80px] px-6 py-3.5 rounded-[14px] bg-card-elevated border border-border border-t-2 border-t-accent-border shadow-[0_1px_4px_rgba(0,0,0,0.20)] shrink-0 w-full overflow-visible animate-fade-up [animation-delay:0.1s]">
            <BarInput label="Purchase Price" value={priceStr} placeholder="$0" onChange={handleCurrencyInput(setPriceStr)} />
            <Divider />
            <BarInput label="Annual Income" value={incomeStr} placeholder="$0" onChange={handleCurrencyInput(setIncomeStr)} />

            {showPartnerIncome && (
              <>
                <Divider />
                <BarInput label="Partner Income" value={partnerIncomeStr} placeholder="$0" onChange={handleCurrencyInput(setPartnerIncomeStr)} />
              </>
            )}

            <Divider />

            {/* Region pills */}
            <div className="flex flex-col items-center gap-4 shrink-0">
              <label className="text-[15px] font-semibold uppercase tracking-widest text-muted/70 leading-none whitespace-nowrap">State</label>
              <div className="grid grid-flow-col auto-cols-fr gap-5">
                {ALL_REGIONS.map((r) => {
                  const color = r === "Federal" ? STATE_COLORS.FEDERAL : STATE_COLORS[r];
                  return (
                    <Pill key={r} label={r} active={regions.has(r)} color={color} onClick={() => toggleRegion(r)} />
                  );
                })}
              </div>
            </div>

            <Divider />

            {/* Toggle fields */}
            <div className="flex items-center shrink-0 ml-auto">
              <div className="flex flex-col items-center gap-4 shrink-0 w-[220px]">
                <label className="text-[15px] font-semibold uppercase tracking-widest text-muted/70 leading-none whitespace-nowrap">Property</label>
                <div className="flex gap-1.5">
                  {([
                    { value: "new" as const, label: "New" },
                    { value: "existing" as const, label: "Existing" },
                    { value: "land" as const, label: "Land" },
                    { value: "off-the-plan" as const, label: "OTP" },
                  ]).map((o) => (
                    <Pill key={o.value} label={o.label} active={propertyType === o.value} onClick={() => setPropertyType(propertyType === o.value ? null : o.value)} />
                  ))}
                </div>
              </div>

              <Divider tight />

              <div className="flex flex-col items-center gap-4 shrink-0 w-[220px]">
                <label className="text-[15px] font-semibold uppercase tracking-widest text-muted/70 leading-none whitespace-nowrap">Buyer</label>
                <div className="flex gap-1.5">
                  {([{ value: "individual" as const, label: "Individual" }, { value: "couple" as const, label: "Couple" }]).map((o) => (
                    <Pill key={o.value} label={o.label} active={buyerType === o.value} onClick={() => setBuyerType(buyerType === o.value ? null : o.value)} />
                  ))}
                </div>
              </div>

              <Divider tight />
              <TriField label="First Home" value={firstHomeBuyer} onToggle={setFirstHomeBuyer} />
              <Divider tight />
              <TriField label="Owner Occupied" value={ownerOccupier} onToggle={setOwnerOccupier} />
              <Divider tight />
              <TriField label="Single Parent" value={singleParent} onToggle={setSingleParent} />

              {showOwnedRecently && (
                <>
                  <Divider tight />
                  <TriField label="Owned in 2yr" value={ownedPropertyRecently} onToggle={setOwnedPropertyRecently} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Results bar */}
        <div className="flex justify-center items-center py-4 text-[16px] text-muted/40 animate-fade-up [animation-delay:0.2s]">
          <span>
            <strong className="text-accent font-semibold">{eligibleCount}</strong> {eligibleCount === 1 ? "scheme" : "schemes"} matched
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-[14px] text-red-400/80">
            {error}
          </div>
        )}

        {/* Card grid */}
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0 overflow-y-auto pb-2 custom-scrollbar max-[1100px]:grid-cols-2 max-[700px]:grid-cols-1 animate-fade-up [animation-delay:0.25s]">
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
