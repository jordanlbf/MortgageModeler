"use client";

import { useId, useState, type CSSProperties } from "react";
import Link from "next/link";
import { fetchGrantsEligibility } from "@/lib/api";
import type { GrantSchemeWithEligibility } from "@/lib/api";
import { parseCurrencyInput, formatDollars } from "@/lib/formatters";
import { useApiCall } from "@/hooks/useApiCall";
import { STATE_COLORS } from "@/lib/theme";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import DenseSchemeCard from "./DenseSchemeCard";

// ── Types ───────────────────────────────────────

const ALL_REGIONS = ["Federal", "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

type PropertyType = "new" | "existing" | "land" | "off-the-plan";
type BuyerType = "individual" | "couple";

const PROPERTY_OPTIONS = [
  { value: "new", label: "New" },
  { value: "existing", label: "Existing" },
  { value: "land", label: "Land" },
  { value: "off-the-plan", label: "OTP" },
] as const satisfies readonly { value: PropertyType; label: string }[];

const BUYER_OPTIONS = [
  { value: "individual", label: "Individual" },
  { value: "couple", label: "Couple" },
] as const satisfies readonly { value: BuyerType; label: string }[];

/** Caption above a filter-bar field (15px uppercase, fg-primary 70%). */
const CAPTION = "text-[15px] text-fg-primary/70 leading-none";

// ── Compact bar input ───────────────────────────

function BarInput({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col items-center gap-4 flex-1 min-w-0">
      <Label variant="caps" htmlFor={id} className={CAPTION}>{label}</Label>
      <Input
        id={id}
        variant="bar"
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
  return <Separator orientation="vertical" className={cn("w-px h-7 bg-white/[0.05] shrink-0 data-vertical:self-auto", tight ? "mx-2" : "mx-4")} />;
}

// ── Labelled pill group ─────────────────────────

/**
 * Caption + single-choice pill group. Clicking the active pill clears the
 * choice (Radix single ToggleGroup deselects to ""), mapped back to `null`.
 */
function PillField<T extends string>({ label, value, options, onChange, className }: {
  label: string;
  value: T | null;
  options: readonly { value: T; label: string; tone?: "negative" }[];
  onChange: (v: T | null) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-col items-center gap-4 shrink-0", className)}>
      <Label asChild variant="caps" className={CAPTION}><span id={id}>{label}</span></Label>
      <ToggleGroup
        type="single"
        variant="pill"
        aria-labelledby={id}
        className="flex gap-1.5"
        value={value ?? ""}
        onValueChange={(v) => onChange(v ? (v as T) : null)}
      >
        {options.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value} data-tone={o.tone}>{o.label}</ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

// ── Tri-state toggle field (Yes / No / unset) ───

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No", tone: "negative" },
] as const;

function TriField({ label, value, onToggle }: { label: string; value: boolean | null; onToggle: (v: boolean | null) => void }) {
  return (
    <PillField
      label={label}
      className="w-[140px]"
      options={YES_NO}
      value={value === null ? null : value ? "yes" : "no"}
      onChange={(v) => onToggle(v === null ? null : v === "yes")}
    />
  );
}

// ── Main component ──────────────────────────────

export default function GrantsView() {
  const [regions, setRegions] = useState<Set<string>>(() => new Set(["Federal"]));
  const [priceStr, setPriceStr] = useState("");
  const [incomeStr, setIncomeStr] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | null>(null);
  const [buyerType, setBuyerType] = useState<BuyerType | null>(null);
  const [firstHomeBuyer, setFirstHomeBuyer] = useState<boolean | null>(null);
  const [ownerOccupier, setOwnerOccupier] = useState<boolean | null>(null);
  const [singleParent, setSingleParent] = useState<boolean | null>(null);
  const [partnerIncomeStr, setPartnerIncomeStr] = useState("");
  const [ownedPropertyRecently, setOwnedPropertyRecently] = useState<boolean | null>(null);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  const stateLabelId = useId();

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
      <div className="flex flex-col">
        {/* Hero + Filter bar */}
        <div className="flex flex-col items-center mb-5">
          {/* Filter bar */}
          <div className="flex items-center min-h-[80px] px-6 py-3.5 rounded-[14px] bg-surface-raised border-t-2 border-t-accent-border shadow-[0_1px_4px_rgba(0,0,0,0.20)] shrink-0 w-full overflow-visible animate-fade-up [animation-delay:0.1s]">
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
              <Label asChild variant="caps" className={CAPTION}><span id={stateLabelId}>State</span></Label>
              <ToggleGroup
                type="multiple"
                variant="pill"
                aria-labelledby={stateLabelId}
                className="grid grid-flow-col auto-cols-fr gap-5"
                value={Array.from(regions)}
                onValueChange={(v) => setRegions(new Set(v))}
              >
                {ALL_REGIONS.map((r) => {
                  const color = r === "Federal" ? STATE_COLORS.FEDERAL : STATE_COLORS[r];
                  return (
                    <ToggleGroupItem key={r} value={r} style={{ "--pill-accent": color } as CSSProperties}>{r}</ToggleGroupItem>
                  );
                })}
              </ToggleGroup>
            </div>

            <Divider />

            {/* Toggle fields */}
            <div className="flex items-center shrink-0 ml-auto">
              <PillField label="Property" className="w-[220px]" options={PROPERTY_OPTIONS} value={propertyType} onChange={setPropertyType} />

              <Divider tight />

              <PillField label="Buyer" className="w-[220px]" options={BUYER_OPTIONS} value={buyerType} onChange={setBuyerType} />

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
        <div className="flex justify-center items-center py-4 text-[16px] text-fg-primary/40 animate-fade-up [animation-delay:0.2s]">
          <span>
            <strong className="text-brand font-semibold">{eligibleCount}</strong> {eligibleCount === 1 ? "scheme" : "schemes"} matched
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
        <Button asChild variant="link-back-footer" className="mt-auto">
          <Link href="/">
            <span data-back-arrow aria-hidden="true">&larr;</span>
            All Tools
          </Link>
        </Button>
      </div>
    </>
  );
}
