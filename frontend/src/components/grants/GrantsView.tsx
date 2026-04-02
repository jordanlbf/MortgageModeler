"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Check, Maximize2, Minimize2, House, BadgeCheck } from "lucide-react";
import { fetchGrantsEligibility } from "@/lib/api";
import type { GrantSchemeWithEligibility } from "@/lib/api";
import Header from "@/components/layout/Header";
import "./grants.css";

// ── Types ───────────────────────────────────────

const ALL_REGIONS = ["Federal", "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;
type Region = (typeof ALL_REGIONS)[number];

type Scheme = import("@/lib/api").GrantScheme;
type CheckResult = import("@/lib/api").GrantEligibilityResult;

// ── Helpers ─────────────────────────────────────

function parseCurrency(s: string): number {
  return Number(s.replace(/[^0-9.]/g, "")) || 0;
}

function formatCurrency(n: number): string {
  if (n === 0) return "";
  return "$" + n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
}

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

function DenseSchemeCard({ scheme, result, isExpanded, onToggleExpand }: { scheme: Scheme; result: CheckResult; isExpanded: boolean; onToggleExpand: () => void }) {
  const schemeColor =
    scheme.level === "Federal"
      ? FEDERAL_COLOR
      : scheme.state
        ? STATE_COLORS[scheme.state]
        : FEDERAL_COLOR;

  const cardState = "eligible";
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
  const [propertyType, setPropertyType] = useState<"new" | "existing" | "land" | "off-the-plan" | null>(null);
  const [buyerType, setBuyerType] = useState<"individual" | "couple" | null>(null);
  const [firstHomeBuyer, setFirstHomeBuyer] = useState<boolean | null>(null);
  const [ownerOccupier, setOwnerOccupier] = useState<boolean | null>(null);
  const [singleParent, setSingleParent] = useState<boolean | null>(null);
  const [partnerIncomeStr, setPartnerIncomeStr] = useState("");
  const [ownedPropertyRecently, setOwnedPropertyRecently] = useState<boolean | null>(null);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);
  const [results, setResults] = useState<GrantSchemeWithEligibility[]>([]);

  const toggleRegion = (r: Region) => {
    setRegions((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r); else next.add(r);
      return next;
    });
  };

  const price = parseCurrency(priceStr);
  const income = parseCurrency(incomeStr);
  const partnerIncome = parseCurrency(partnerIncomeStr);
  const showPartnerIncome = buyerType === "couple";
  const showOwnedRecently = regions.has("ACT");

  // Fetch eligibility from API whenever inputs change (debounced)
  useEffect(() => {
    const states = Array.from(regions);
    if (states.length === 0) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const controller = new AbortController();

      fetchGrantsEligibility(
        {
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
        },
        controller.signal,
      )
        .then((data) => setResults(data.schemes))
        .catch((err) => {
          if (err.name !== "AbortError") console.error("Grants API error:", err);
        });

      return () => controller.abort();
    }, 300);

    return () => clearTimeout(timer);
  }, [regions, price, income, partnerIncome, propertyType, buyerType, firstHomeBuyer, ownerOccupier, singleParent, ownedPropertyRecently, showPartnerIncome, showOwnedRecently]);

  const eligibleCount = results.filter((r) => r.result.eligible).length;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setPriceStr(raw ? formatCurrency(Number(raw)) : "");
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setIncomeStr(raw ? formatCurrency(Number(raw)) : "");
  };

  const handlePartnerIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setPartnerIncomeStr(raw ? formatCurrency(Number(raw)) : "");
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

        {/* Card grid — only show eligible schemes */}
        <div className="grants-card-grid flex-1 min-h-0 custom-scrollbar">
          {results.filter((r) => r.result.eligible).map(({ scheme, result }) => (
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
