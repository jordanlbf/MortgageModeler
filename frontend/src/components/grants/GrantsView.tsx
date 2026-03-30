"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Check, Maximize2, Minimize2, House, BadgeCheck } from "lucide-react";
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

interface SchemeMeta {
  deposit: string;
  lmi: string;
  buyer: string;
}

interface Scheme {
  id: string;
  name: string;
  level: "Federal" | "State";
  state?: string;
  benefitPill: string;
  meta: SchemeMeta;
  theme: string;
  benefits: string[];
  eligibility: string[];
  summary: string;
  details?: string;
  rules?: string[];
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
    meta: { deposit: "5%", lmi: "Waived", buyer: "Individual / Joint" },
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
    details: "The First Home Guarantee allows eligible first home buyers to purchase a property with a deposit as low as 5% without needing to pay Lenders Mortgage Insurance. The government guarantees the remaining deposit gap up to 15%. From October 2025 property price caps and income caps are removed, broadening access significantly.",
    rules: [
      "Limited places released each financial year",
      "Must use a participating lender",
      "Property must be owner-occupied within 12 months",
      "Cannot currently own property in Australia",
    ],
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
    meta: { deposit: "Any", lmi: "N/A", buyer: "Individual / Joint" },
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
    details: "The Queensland First Home Owner Grant provides a one-off $30,000 payment to eligible first home buyers purchasing or building a brand new home valued at up to $750,000. The grant is applied at settlement for purchases or on completion for builds, reducing the upfront cash needed.",
    rules: [
      "Must be a new or substantially renovated home",
      "Contract must be dated on or after 20 November 2023 for the $30,000 amount",
      "Must move in within 1 year and live there for at least 1 continuous year",
      "Cannot have previously received a first home owner grant in any state",
    ],
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
    meta: { deposit: "Any", lmi: "N/A", buyer: "Individual / Joint" },
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
    details: "Queensland offers stamp duty concessions for first home buyers. Properties valued up to $700,000 receive a full exemption from transfer duty. Properties between $700,001 and $799,999 receive a sliding scale concession, with savings up to $17,350.",
    rules: [
      "Full exemption applies to properties up to $700,000",
      "Partial concession tapers between $700,001 and $799,999",
      "No concession for properties at $800,000 or above",
      "Must be a home (not vacant land) for the concession",
    ],
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
    benefitPill: "Up to 40% equity",
    meta: { deposit: "2%", lmi: "Waived", buyer: "Individual / Joint" },
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
    details: "Help to Buy is a shared equity scheme where the government contributes up to 40% of a new home's purchase price (or 30% for existing homes) as an equity partner. This reduces the size of your home loan and repayments. You can buy back the government's share over time or when you sell.",
    rules: [
      "Income cap: $100,000 individual / $160,000 couple",
      "Must not currently own property",
      "Government equity must be repaid on sale or can be bought back progressively",
      "Limited places available each year",
    ],
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
    benefitPill: "Up to $50k from super",
    meta: { deposit: "N/A", lmi: "N/A", buyer: "Individual" },
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
    details: "The First Home Super Saver scheme lets you withdraw voluntary super contributions (up to $50,000) to put towards a home deposit. Contributions are taxed at 15% going in (vs your marginal rate), and withdrawals are taxed at your marginal rate minus a 30% offset, making it more tax-efficient than saving outside super.",
    rules: [
      "Maximum $15,000 in voluntary contributions per financial year count towards FHSS",
      "Total withdrawable amount capped at $50,000",
      "Must request a determination from the ATO before signing a contract",
      "Must sign a contract within 12 months of requesting withdrawal (or 24 months with extension)",
    ],
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
    meta: { deposit: "2%", lmi: "Waived", buyer: "Individual only" },
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
    details: "The Family Home Guarantee supports eligible single parents or single legal guardians to buy a home with as little as 2% deposit without paying LMI. The government guarantees up to 18% of the property value. Available for both new and existing homes.",
    rules: [
      "Must be a single parent or legal guardian with at least one dependent",
      "Individual application only — not available for joint applications",
      "Limited places each financial year",
      "Must use a participating lender",
    ],
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

// ── Dense card helpers ──────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="grant-section-title">{children}</div>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grant-bullets">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// ── Dense scheme card ───────────────────────────

function CardContent({ scheme, result }: { scheme: Scheme; result: CheckResult }) {
  return (
    <>
      <div className="dense-grant-card__facts">
        <div className="dense-fact">
          <div className="dense-fact__top">
            <span>Deposit</span>
            <House className="h-4 w-4" />
          </div>
          <div className="dense-fact__value">{scheme.meta.deposit}</div>
        </div>
        <div className="dense-fact">
          <div className="dense-fact__top">
            <span>LMI</span>
            <Check className="h-4 w-4" />
          </div>
          <div className="dense-fact__value">{scheme.meta.lmi}</div>
        </div>
        <div className="dense-fact">
          <div className="dense-fact__top">
            <span>Buyer type</span>
            <BadgeCheck className="h-4 w-4" />
          </div>
          <div className="dense-fact__value">{scheme.meta.buyer}</div>
        </div>
      </div>

      <div className="dense-grant-card__sections">
        <div className="dense-grant-card__panel">
          <SectionTitle>Benefits</SectionTitle>
          <BulletList items={scheme.benefits} />
        </div>
        <div className="dense-grant-card__panel">
          <SectionTitle>Eligibility</SectionTitle>
          <BulletList items={scheme.eligibility} />
        </div>
      </div>
    </>
  );
}

function ExpandedContent({ scheme, result }: { scheme: Scheme; result: CheckResult }) {
  return (
    <div className="dense-grant-card__expanded">
      <div className="dense-grant-card__expandedSection">
        <SectionTitle>Overview</SectionTitle>
        <p className="dense-grant-card__expandedText">
          {scheme.details ?? scheme.theme}
        </p>
      </div>

      {!!scheme.rules?.length && (
        <div className="dense-grant-card__expandedSection">
          <SectionTitle>Key Rules</SectionTitle>
          <BulletList items={scheme.rules} />
        </div>
      )}

      <div className="dense-grant-card__expandedSection">
        <SectionTitle>Current Match Status</SectionTitle>
        {result.eligible ? (
          <p className="dense-grant-card__expandedText">
            This scheme currently matches your selected filters.
          </p>
        ) : result.reasons.length ? (
          <BulletList items={result.reasons} />
        ) : (
          <p className="dense-grant-card__expandedText">
            Set more filters to evaluate this scheme.
          </p>
        )}
      </div>
    </div>
  );
}

function CardFooter({ scheme, result }: { scheme: Scheme; result: CheckResult }) {
  return (
    <div className={`dense-grant-card__footer ${result.eligible ? "is-eligible" : "is-ineligible"}`}>
      <span className="dense-grant-card__footerIcon">{result.eligible ? "✓" : "✕"}</span>
      <div className="dense-grant-card__footerText">
        {result.eligible
          ? scheme.summary
          : result.reasons.length
            ? result.reasons.join(" · ")
            : "Set filters to evaluate eligibility."}
      </div>
    </div>
  );
}

function DenseSchemeCard({ scheme, result, nearMiss, isExpanded, onToggleExpand }: { scheme: Scheme; result: CheckResult; nearMiss: boolean; isExpanded: boolean; onToggleExpand: () => void }) {
  const schemeColor =
    scheme.level === "Federal"
      ? FEDERAL_COLOR
      : scheme.state
        ? STATE_COLORS[scheme.state]
        : FEDERAL_COLOR;

  const cardState = result.eligible ? "eligible" : nearMiss ? "near" : "ineligible";
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onToggleExpand(); };
    const onClick = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) onToggleExpand();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onClick); };
  }, [isExpanded, onToggleExpand]);

  const cardStyle = { ["--scheme-color" as string]: schemeColor } as React.CSSProperties;

  const header = (
    <div className="dense-grant-card__header">
      <div className="dense-grant-card__tagRow">
        <div className="dense-grant-card__tag">
          {scheme.level === "Federal" ? "Federal" : scheme.state}
        </div>
        <h3 className="dense-grant-card__title">{scheme.name}</h3>
      </div>
      <button
        type="button"
        className="dense-grant-card__iconButton"
        aria-expanded={isExpanded}
        aria-controls={`grant-details-${scheme.id}`}
        aria-label={isExpanded ? "Close grant details" : "View grant details"}
        onClick={onToggleExpand}
      >
        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  );

  const subheader = (
    <p className="dense-grant-card__theme">{scheme.theme}</p>
  );

  return (
    <>
      {/* Compact card (always in grid) */}
      <div
        className={`dense-grant-card dense-grant-card--${cardState} ${isExpanded ? "dense-grant-card--hidden" : ""}`}
        style={cardStyle}
      >
        <div className="dense-grant-card__inner">
          {header}
          {subheader}
          <CardContent scheme={scheme} result={result} />
        </div>
        <CardFooter scheme={scheme} result={result} />
      </div>

      {/* Expanded overlay */}
      {isExpanded && (
        <div className="grant-overlay">
          <div className="grant-overlay__backdrop" />
          <div
            ref={overlayRef}
            id={`grant-details-${scheme.id}`}
            className={`dense-grant-card dense-grant-card--${cardState} grant-overlay__card`}
            style={cardStyle}
          >
            <div className="dense-grant-card__inner">
              {header}
              {subheader}
              <CardContent scheme={scheme} result={result} />
              <ExpandedContent scheme={scheme} result={result} />
            </div>
            <CardFooter scheme={scheme} result={result} />
          </div>
        </div>
      )}
    </>
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
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

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
            <input className="grants-bar-input" type="text" inputMode="numeric" placeholder="$0" value={priceStr} onChange={handlePriceChange} />
          </div>

          <div className="grants-bar-divider" />

          <div className="grants-field grants-field--grow">
            <label className="grants-field-label">Annual Income</label>
            <input className="grants-bar-input" type="text" inputMode="numeric" placeholder="$0" value={incomeStr} onChange={handleIncomeChange} />
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
          <span>
            <strong>{eligibleCount}</strong> {eligibleCount === 1 ? "scheme" : "schemes"} matched
            {nearMissCount > 0 && (
              <span className="grants-near"> &middot; {nearMissCount} close</span>
            )}
          </span>
        </div>

        {/* Card grid */}
        <div className="grants-card-grid flex-1 min-h-0 custom-scrollbar">
          {results.map(({ scheme, result }) => (
            <DenseSchemeCard
              key={scheme.id}
              scheme={scheme}
              result={result}
              nearMiss={!result.eligible && result.reasons.length === 1}
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
