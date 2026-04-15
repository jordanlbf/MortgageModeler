"use client";

import { useEffect, useRef } from "react";
import { Check, Maximize2, Minimize2, House, BadgeCheck } from "lucide-react";
import type { GrantScheme, GrantEligibilityResult } from "@/lib/api";

// ── State colours ───────────────────────────────

const FEDERAL_COLOR = "#A78BFA";

const STATE_COLORS: Record<string, string> = {
  NSW: "#6BB5E8",
  VIC: "#5B8DBE",
  QLD: "#C06080",
  WA:  "#D4A843",
  SA:  "#E06060",
  TAS: "#4AAF82",
  ACT: "#6A9FD8",
  NT:  "#D87A58",
};

export { FEDERAL_COLOR, STATE_COLORS };

// ── Small helpers ───────────────────────────────

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

// ── Card sections ───────────────────────────────

function CardContent({ scheme, result }: { scheme: GrantScheme; result: GrantEligibilityResult }) {
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

function ExpandedContent({ scheme, result }: { scheme: GrantScheme; result: GrantEligibilityResult }) {
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

function CardFooter({ scheme, result }: { scheme: GrantScheme; result: GrantEligibilityResult }) {
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

// ── Main card ───────────────────────────────────

interface DenseSchemeCardProps {
  scheme: GrantScheme;
  result: GrantEligibilityResult;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function DenseSchemeCard({ scheme, result, isExpanded, onToggleExpand }: DenseSchemeCardProps) {
  const schemeColor =
    scheme.level === "Federal"
      ? FEDERAL_COLOR
      : scheme.state
        ? STATE_COLORS[scheme.state]
        : FEDERAL_COLOR;

  const cardState = "eligible";
  const overlayRef = useRef<HTMLDivElement>(null);

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
