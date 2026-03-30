"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import "./grants.css";

// ── Types ───────────────────────────────────────

const ALL_REGIONS = ["Federal", "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;
type Region = (typeof ALL_REGIONS)[number];
type TriValue = "yes" | "no" | "any";

interface Inputs {
  regions: Set<string>;
  price: number;
  income: number;
  propertyType: "new" | "existing" | "";
  buyerType: "individual" | "couple" | "";
  firstHomeBuyer: TriValue;
  ownerOccupier: TriValue;
}

interface CheckResult {
  eligible: boolean;
  reasons: string[];
}

interface Scheme {
  id: string;
  name: string;
  level: "Federal" | "State";
  state?: string;
  benefitPill: string;
  theme: string;
  benefits: string[];
  eligibility: string[];
  summary: string;
  check: (inputs: Inputs) => CheckResult;
}

// ── Helpers ─────────────────────────────────────

function triMatch(input: TriValue, required: boolean): { pass: boolean; reason?: string } {
  if (input === "any") return { pass: true };
  const val = input === "yes";
  return val === required ? { pass: true } : { pass: false, reason: required ? "Must be yes" : "Must be no" };
}

function parseCurrency(s: string): number {
  return Number(s.replace(/[^0-9.]/g, "")) || 0;
}

function formatCurrency(n: number): string {
  if (n === 0) return "";
  return "$" + n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
}

// ── Scheme definitions ──────────────────────────

const SCHEMES: Scheme[] = [
  {
    id: "fhbg",
    name: "First Home Guarantee",
    level: "Federal",
    benefitPill: "No LMI with 5% deposit",
    theme: "Purchase with as little as 5% deposit without paying Lenders Mortgage Insurance.",
    benefits: [
      "No LMI required with 5% deposit",
      "No property price caps (from Oct 2025)",
      "No income caps (from Oct 2025)",
    ],
    eligibility: [
      "Australian citizen or permanent resident",
      "First home buyer",
      "Owner-occupier",
      "Individual or joint application",
    ],
    summary: "You can purchase with 5% deposit and avoid LMI.",
    check: (i) => {
      const reasons: string[] = [];
      const fhb = triMatch(i.firstHomeBuyer, true);
      if (!fhb.pass) reasons.push("Must be a first home buyer");
      const occ = triMatch(i.ownerOccupier, true);
      if (!occ.pass) reasons.push("Must be owner-occupier");
      return { eligible: reasons.length === 0, reasons };
    },
  },
  {
    id: "fhog-qld",
    name: "First Home Owner Grant",
    level: "State",
    state: "QLD",
    benefitPill: "$30,000 grant",
    theme: "A $30,000 grant for first home buyers purchasing or building a new home in Queensland.",
    benefits: [
      "$30,000 cash grant",
      "Applied at settlement or on completion",
    ],
    eligibility: [
      "First home buyer",
      "New or substantially renovated home",
      "Property value up to $750,000",
      "Australian citizen or permanent resident",
      "Owner-occupier (must live in for 1 year)",
    ],
    summary: "You qualify for a $30,000 grant towards your new home.",
    check: (i) => {
      const reasons: string[] = [];
      const fhb = triMatch(i.firstHomeBuyer, true);
      if (!fhb.pass) reasons.push("Must be a first home buyer");
      if (i.propertyType && i.propertyType !== "new") reasons.push("Must be a new build");
      if (i.price > 750_000 && i.price > 0) reasons.push("Property value must be $750,000 or less");
      const occ = triMatch(i.ownerOccupier, true);
      if (!occ.pass) reasons.push("Must be owner-occupier");
      return { eligible: reasons.length === 0, reasons };
    },
  },
  {
    id: "fhb-stamp-qld",
    name: "First Home Stamp Duty Concession",
    level: "State",
    state: "QLD",
    benefitPill: "Up to $17,350 saved",
    theme: "Reduced or zero stamp duty for first home buyers in Queensland on properties up to $800,000.",
    benefits: [
      "Full exemption for properties up to $700,000",
      "Partial concession $700,001 - $799,999",
      "Savings up to $17,350",
    ],
    eligibility: [
      "First home buyer",
      "Property value under $800,000",
      "Australian citizen or permanent resident",
      "Owner-occupier",
    ],
    summary: "You may pay reduced or zero stamp duty on your purchase.",
    check: (i) => {
      const reasons: string[] = [];
      const fhb = triMatch(i.firstHomeBuyer, true);
      if (!fhb.pass) reasons.push("Must be a first home buyer");
      if (i.price >= 800_000 && i.price > 0) reasons.push("Property value must be under $800,000");
      const occ = triMatch(i.ownerOccupier, true);
      if (!occ.pass) reasons.push("Must be owner-occupier");
      return { eligible: reasons.length === 0, reasons };
    },
  },
  {
    id: "help-to-buy",
    name: "Help to Buy",
    level: "Federal",
    benefitPill: "Up to 40% equity contribution",
    theme: "The government contributes up to 40% of a new home's price as an equity partner, reducing your loan.",
    benefits: [
      "Up to 40% equity for new builds, 30% for existing",
      "As little as 2% deposit required",
      "Lower loan repayments",
    ],
    eligibility: [
      "Australian citizen (18+)",
      "Income cap: $100,000 (single) / $160,000 (couple)",
      "Owner-occupier",
      "Must not currently own property",
    ],
    summary: "The government co-owns up to 40%, reducing your loan and repayments.",
    check: (i) => {
      const reasons: string[] = [];
      const occ = triMatch(i.ownerOccupier, true);
      if (!occ.pass) reasons.push("Must be owner-occupier");
      const incomeCap = i.buyerType === "couple" ? 160_000 : 100_000; // default to single cap if unset
      if (i.income > incomeCap && i.income > 0) reasons.push(`Income must be $${incomeCap.toLocaleString()} or less`);
      return { eligible: reasons.length === 0, reasons };
    },
  },
  {
    id: "fhss",
    name: "First Home Super Saver (FHSS)",
    level: "Federal",
    benefitPill: "Withdraw up to $50,000 from super",
    theme: "Withdraw voluntary super contributions for a home deposit, taxed at a lower rate than saving outside super.",
    benefits: [
      "Withdraw up to $50,000 in voluntary contributions",
      "Tax advantage: contributions taxed at 15% vs marginal rate",
      "Withdrawal tax: marginal rate minus 30% offset",
    ],
    eligibility: [
      "First home buyer",
      "Australian citizen or permanent resident",
      "Must have made voluntary super contributions",
      "Must not have previously owned property",
    ],
    summary: "You can withdraw voluntary super contributions at a tax advantage for your deposit.",
    check: (i) => {
      const reasons: string[] = [];
      const fhb = triMatch(i.firstHomeBuyer, true);
      if (!fhb.pass) reasons.push("Must be a first home buyer");
      return { eligible: reasons.length === 0, reasons };
    },
  },
  {
    id: "family-home-guarantee",
    name: "Family Home Guarantee",
    level: "Federal",
    benefitPill: "2% deposit, no LMI",
    theme: "Single parents or eligible single guardians can purchase with as little as 2% deposit without LMI.",
    benefits: [
      "Purchase with 2% deposit",
      "No LMI required",
      "Available for new and existing homes",
    ],
    eligibility: [
      "Single parent or legal guardian of a dependent",
      "Australian citizen or permanent resident",
      "Owner-occupier",
      "Individual application only",
    ],
    summary: "As a single parent, you can purchase with just 2% deposit and no LMI.",
    check: (i) => {
      const reasons: string[] = [];
      if (i.buyerType && i.buyerType !== "individual") reasons.push("Individual application only");
      const occ = triMatch(i.ownerOccupier, true);
      if (!occ.pass) reasons.push("Must be owner-occupier");
      return { eligible: reasons.length === 0, reasons };
    },
  },
];

// ── State colours ───────────────────────────────

const FEDERAL_COLOR = "#A78BFA"; // warm purple

const STATE_COLORS: Record<string, string> = {
  NSW: "#6BB5E8",   // sky blue
  VIC: "#5B8DBE",   // navy blue (lightened)
  QLD: "#C06080",   // maroon (lightened)
  WA:  "#D4A843",   // gold
  SA:  "#E06060",   // red (softened)
  TAS: "#4AAF82",   // forest green (lightened)
  ACT: "#6A9FD8",   // blue
  NT:  "#D87A58",   // ochre
};

// ── Scheme card ─────────────────────────────────

function SchemeCard({ scheme, result, nearMiss }: { scheme: Scheme; result: CheckResult; nearMiss: boolean }) {
  const cardClass = result.eligible
    ? "grants-card--eligible"
    : nearMiss
      ? "grants-card--near-miss"
      : "grants-card--ineligible";
  const schemeColor = scheme.level === "Federal" ? FEDERAL_COLOR : (scheme.state ? STATE_COLORS[scheme.state] : FEDERAL_COLOR);
  return (
    <div
      className={`grants-card ${cardClass}`}
      style={{ "--scheme-color": schemeColor } as React.CSSProperties}
    >
      {/* Top bar: level pill + title */}
      <div className="grants-card-topbar">
        <span className="grants-card-level-pill">
          {scheme.level === "Federal" ? "Federal" : scheme.state}
        </span>
        <h3 className="grants-card-name">{scheme.name}</h3>
      </div>
      <p className="grants-card-theme">{scheme.theme}</p>

      {/* Body sections */}
      <div className="grants-card-body">
        <div className="grants-card-section">
          <div className="grants-card-section-label">Benefits</div>
          <ul className="grants-card-list">
            {scheme.benefits.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>

        <div className="grants-card-section">
          <div className="grants-card-section-label">Eligibility</div>
          <ul className="grants-card-list grants-card-list--eligibility">
            {scheme.eligibility.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      </div>

      {/* Summary footer */}
      <div className={`grants-card-summary ${result.eligible ? "grants-card-summary--eligible" : "grants-card-summary--ineligible"}`}>
        <div className="grants-card-summary-icon">
          {result.eligible ? "\u2713" : "\u2717"}
        </div>
        <div className="grants-card-summary-text">
          {result.eligible ? (
            scheme.summary
          ) : (
            result.reasons.map((r) => <span key={r}>{r}</span>)
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────

export default function GrantsView() {
  const [regions, setRegions] = useState<Set<string>>(() => new Set(["Federal"]));
  const [priceStr, setPriceStr] = useState("");
  const [incomeStr, setIncomeStr] = useState("");
  const [propertyType, setPropertyType] = useState<"new" | "existing" | "">("");
  const [buyerType, setBuyerType] = useState<"individual" | "couple" | "">("");
  const [firstHomeBuyer, setFirstHomeBuyer] = useState<TriValue>("any");
  const [ownerOccupier, setOwnerOccupier] = useState<TriValue>("any");

  const allSelected = regions.size === ALL_REGIONS.length;

  const toggleRegion = (r: Region) => {
    setRegions((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r); else next.add(r);
      return next;
    });
  };

  const toggleAll = () => {
    setRegions(allSelected ? new Set() : new Set(ALL_REGIONS));
  };

  const inputs: Inputs = {
    regions,
    price: parseCurrency(priceStr),
    income: parseCurrency(incomeStr),
    propertyType,
    buyerType,
    firstHomeBuyer,
    ownerOccupier,
  };

  // Has the user actively set any eligibility-relevant filter?
  const hasEligibilityFilters = [
    inputs.price > 0,
    inputs.income > 0,
    propertyType !== "",
    buyerType !== "",
    firstHomeBuyer !== "any",
    ownerOccupier !== "any",
  ].some(Boolean);

  const results = useMemo(() => {
    const filtered = SCHEMES.filter((s) => {
      if (s.level === "Federal" && !regions.has("Federal")) return false;
      if (s.level === "State" && s.state && !regions.has(s.state)) return false;
      return true;
    });
    // Only run eligibility checks when user has actively set filters
    const neutral: CheckResult = { eligible: false, reasons: [] };
    const checked = filtered.map((s) => ({
      scheme: s,
      result: hasEligibilityFilters ? s.check(inputs) : neutral,
    }));
    // Sort: eligible first, then by fewest ineligibility reasons (closest to qualifying)
    return checked.sort((a, b) => {
      if (a.result.eligible !== b.result.eligible) return a.result.eligible ? -1 : 1;
      if (!a.result.eligible && !b.result.eligible) return a.result.reasons.length - b.result.reasons.length;
      return a.scheme.name.localeCompare(b.scheme.name);
    });
  }, [regions, inputs, hasEligibilityFilters]);

  const eligibleCount = results.filter((r) => r.result.eligible).length;
  const nearMissCount = results.filter((r) => !r.result.eligible && r.result.reasons.length === 1).length;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setPriceStr(raw ? formatCurrency(Number(raw)) : "");
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setIncomeStr(raw ? formatCurrency(Number(raw)) : "");
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
            <input className="grants-bar-input" type="text" inputMode="numeric" placeholder="$750,000" value={priceStr} onChange={handlePriceChange} />
          </div>

          <div className="grants-bar-divider" />

          <div className="grants-field grants-field--grow">
            <label className="grants-field-label">Annual Income</label>
            <input className="grants-bar-input" type="text" inputMode="numeric" placeholder="$100,000" value={incomeStr} onChange={handleIncomeChange} />
          </div>

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
            <div className="grants-field grants-field--toggle">
              <label className="grants-field-label">Property</label>
              <div className="grants-bar-pills">
                {([{ value: "new" as const, label: "New" }, { value: "existing" as const, label: "Existing" }]).map((o) => (
                  <button key={o.value} className="grants-pill grants-pill--uniform" data-active={propertyType === o.value} onClick={() => setPropertyType(propertyType === o.value ? "" : o.value)}>{o.label}</button>
                ))}
              </div>
            </div>

            <div className="grants-bar-divider grants-bar-divider--tight" />

            <div className="grants-field grants-field--toggle">
              <label className="grants-field-label">Buyer</label>
              <div className="grants-bar-pills">
                {([{ value: "individual" as const, label: "Individual" }, { value: "couple" as const, label: "Couple" }]).map((o) => (
                  <button key={o.value} className="grants-pill grants-pill--uniform" data-active={buyerType === o.value} onClick={() => setBuyerType(buyerType === o.value ? "" : o.value)}>{o.label}</button>
                ))}
              </div>
            </div>

            <div className="grants-bar-divider grants-bar-divider--tight" />

            <div className="grants-field grants-field--toggle">
              <label className="grants-field-label">First Home</label>
              <div className="grants-bar-pills">
                {(["yes", "no"] as const).map((v) => (
                  <button key={v} className="grants-pill grants-pill--uniform grants-pill--tri" data-active={firstHomeBuyer === v} data-value={v} onClick={() => setFirstHomeBuyer(firstHomeBuyer === v ? "any" : v)}>
                    {v === "yes" ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grants-bar-divider grants-bar-divider--tight" />

            <div className="grants-field grants-field--toggle">
              <label className="grants-field-label">Owner Occupied</label>
              <div className="grants-bar-pills">
                {(["yes", "no"] as const).map((v) => (
                  <button key={v} className="grants-pill grants-pill--uniform grants-pill--tri" data-active={ownerOccupier === v} data-value={v} onClick={() => setOwnerOccupier(ownerOccupier === v ? "any" : v)}>
                    {v === "yes" ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Results bar */}
        <div className="grants-results-bar">
          <span className="grants-results-count">
            <strong>{eligibleCount}</strong> {eligibleCount === 1 ? "scheme" : "schemes"} matched
            {nearMissCount > 0 && (
              <span className="grants-results-near"> &middot; {nearMissCount} close</span>
            )}
          </span>
        </div>

        {/* Card grid */}
        <div className="grants-grid--3col flex-1 min-h-0 custom-scrollbar">
          {results.map(({ scheme, result }) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              result={result}
              nearMiss={!result.eligible && result.reasons.length === 1}
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
