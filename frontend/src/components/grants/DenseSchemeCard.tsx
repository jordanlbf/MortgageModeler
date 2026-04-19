"use client";

import { useEffect, useRef } from "react";
import { Maximize2, Minimize2, House, BadgeCheck, Check } from "lucide-react";
import type { GrantScheme, GrantEligibilityResult } from "@/lib/api";
import { mix, STATE_COLORS } from "@/lib/theme";

// ── Small helpers ───────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-white/[0.42]">{children}</div>;
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="list-none m-0 p-0 grid grid-cols-1 gap-2">
      {items.map((item) => (
        <li key={item} className="relative pl-[18px] text-[14px] leading-[1.45] text-white/[0.62]">
          <span className="absolute left-0 top-[7px] w-[5px] h-[5px] rounded-full" style={{ background: mix(color, 50) }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ── Card sections ───────────────────────────────

function CardContent({ scheme, color }: { scheme: GrantScheme; color: string }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2 max-[900px]:grid-cols-1">
        {[
          { label: "Deposit", icon: House, value: scheme.meta.deposit },
          { label: "LMI", icon: Check, value: scheme.meta.lmi },
          { label: "Buyer type", icon: BadgeCheck, value: scheme.meta.buyer },
        ].map((fact) => (
          <div key={fact.label} className="rounded-[14px] border border-white/[0.08] bg-white/[0.045] px-3 py-[11px]">
            <div className="flex items-center justify-between gap-2 text-[12px] uppercase tracking-widest text-white/[0.42]">
              <span>{fact.label}</span>
              <fact.icon className="h-4 w-4" style={{ color }} />
            </div>
            <div className="mt-1.5 text-[14px] font-semibold leading-[1.3]">{fact.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 mt-4">
        {[
          { title: "Benefits", items: scheme.benefits },
          { title: "Eligibility", items: scheme.eligibility },
        ].map((section) => (
          <div key={section.title} className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-4 py-3.5">
            <SectionTitle>{section.title}</SectionTitle>
            <BulletList items={section.items} color={color} />
          </div>
        ))}
      </div>
    </>
  );
}

function ExpandedContent({ scheme, result, color }: { scheme: GrantScheme; result: GrantEligibilityResult; color: string }) {
  return (
    <div className="mt-2.5 flex flex-col gap-2.5">
      <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-3 py-[11px]">
        <SectionTitle>Overview</SectionTitle>
        <p className="m-0 text-[14px] leading-[1.5] text-white/[0.68]">
          {scheme.details ?? scheme.theme}
        </p>
      </div>

      {!!scheme.rules?.length && (
        <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-3 py-[11px]">
          <SectionTitle>Key Rules</SectionTitle>
          <BulletList items={scheme.rules} color={color} />
        </div>
      )}

      <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-3 py-[11px]">
        <SectionTitle>Current Match Status</SectionTitle>
        {result.eligible ? (
          <p className="m-0 text-[14px] leading-[1.5] text-white/[0.68]">
            This scheme currently matches your selected filters.
          </p>
        ) : result.reasons.length ? (
          <BulletList items={result.reasons} color={color} />
        ) : (
          <p className="m-0 text-[14px] leading-[1.5] text-white/[0.68]">
            Set more filters to evaluate this scheme.
          </p>
        )}
      </div>
    </div>
  );
}

function CardFooter({ scheme, result, color }: { scheme: GrantScheme; result: GrantEligibilityResult; color: string }) {
  return (
    <div
      className="flex items-start gap-2 mt-auto px-5 py-3 rounded-b-[18px] border-t border-white/[0.04] text-[14px] leading-[1.4] font-medium"
      style={result.eligible ? {
        background: mix(color, 4),
        color: mix(color, 75),
      } : undefined}
    >
      <span className="shrink-0 text-[18px] leading-[1.3]">{result.eligible ? "✓" : "✕"}</span>
      <div>
        {result.eligible
          ? scheme.summary
          : result.reasons.length
            ? result.reasons.join(" · ")
            : "Set filters to evaluate eligibility."}
      </div>
    </div>
  );
}

// ── Card shadow ─────────────────────────────────

const CARD_SHADOW = "0 1px 4px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.02)";
const CARD_HOVER_SHADOW = "0 8px 28px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.03)";

// ── Main card ───────────────────────────────────

interface DenseSchemeCardProps {
  scheme: GrantScheme;
  result: GrantEligibilityResult;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function DenseSchemeCard({ scheme, result, isExpanded, onToggleExpand }: DenseSchemeCardProps) {
  const color =
    scheme.level === "Federal"
      ? STATE_COLORS.FEDERAL
      : scheme.state
        ? (STATE_COLORS as Record<string, string>)[scheme.state]
        : STATE_COLORS.FEDERAL;

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

  const header = (
    <div className="relative flex justify-between items-center gap-3 mb-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          className="inline-flex items-baseline justify-center h-9 rounded-[14px] border border-white/[0.08] px-3 text-[13px] font-semibold uppercase tracking-widest"
          style={{ color, background: mix(color, 10) }}
        >
          {scheme.level === "Federal" ? "Federal" : scheme.state}
        </div>
        <h3 className="absolute left-0 right-0 m-0 text-[20px] leading-[1.2] font-semibold tracking-[-0.02em] text-center pointer-events-none">
          {scheme.name}
        </h3>
      </div>
      <button
        type="button"
        className="inline-flex items-center justify-center w-9 h-9 rounded-[14px] border cursor-pointer shrink-0 outline-none transition-all duration-200 hover:-translate-y-px"
        style={{
          borderColor: mix(color, 24),
          background: mix(color, 12),
          color,
        }}
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
    <p className="m-0 mb-2 text-[14px] leading-[1.45] text-white/[0.62]">{scheme.theme}</p>
  );

  const cardClasses = "flex flex-col rounded-[18px] bg-white/[0.04] border border-white/[0.08] transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)]";

  return (
    <>
      {/* Compact card */}
      <div
        className={`${cardClasses} hover:-translate-y-0.5 ${isExpanded ? "invisible" : ""}`}
        style={{ borderTop: `3px solid ${mix(color, 55)}`, boxShadow: CARD_SHADOW }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = CARD_HOVER_SHADOW; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = CARD_SHADOW; }}
      >
        <div className="px-5 pt-5 pb-4 min-h-0 flex-1">
          {header}
          {subheader}
          <CardContent scheme={scheme} color={color} />
        </div>
        <CardFooter scheme={scheme} result={result} color={color} />
      </div>

      {/* Expanded overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 animate-overlay-in max-[900px]:p-4">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
          <div
            ref={overlayRef}
            id={`grant-details-${scheme.id}`}
            className={`${cardClasses} relative z-[1] w-full max-w-[720px] max-h-[calc(100vh-96px)] overflow-y-auto animate-card-pop-in`}
            style={{ borderTop: `3px solid ${mix(color, 55)}`, boxShadow: CARD_SHADOW }}
          >
            <div className="px-5 pt-5 pb-4 min-h-0 flex-1">
              {header}
              {subheader}
              <CardContent scheme={scheme} color={color} />
              <ExpandedContent scheme={scheme} result={result} color={color} />
            </div>
            <CardFooter scheme={scheme} result={result} color={color} />
          </div>
        </div>
      )}
    </>
  );
}
