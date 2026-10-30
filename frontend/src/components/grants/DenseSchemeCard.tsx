"use client";

import { useRef, type CSSProperties } from "react";
import { Maximize2, Minimize2, House, BadgeCheck, Check } from "lucide-react";
import type { GrantScheme, GrantEligibilityResult } from "@/lib/api";
import { mix, STATE_COLORS } from "@/lib/theme";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
          <div key={fact.label} className="rounded-[14px] bg-white/[0.045] px-3 py-[11px]">
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
          <div key={section.title} className="rounded-[14px] bg-white/[0.03] px-4 py-3.5">
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
      <div className="rounded-[14px] bg-white/[0.03] px-3 py-[11px]">
        <SectionTitle>Overview</SectionTitle>
        <p className="m-0 text-[14px] leading-[1.5] text-white/[0.68]">
          {scheme.details ?? scheme.theme}
        </p>
      </div>

      {!!scheme.rules?.length && (
        <div className="rounded-[14px] bg-white/[0.03] px-3 py-[11px]">
          <SectionTitle>Key Rules</SectionTitle>
          <BulletList items={scheme.rules} color={color} />
        </div>
      )}

      <div className="rounded-[14px] bg-white/[0.03] px-3 py-[11px]">
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

// ── Main card ───────────────────────────────────

/** Hover lift + deeper shadow for the compact (in-grid) card. */
const COMPACT_HOVER =
  "hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.3),0_0_0_0.5px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.03)]";

interface DenseSchemeCardProps {
  scheme: GrantScheme;
  result: GrantEligibilityResult;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

/**
 * Grant scheme card. "View grant details" opens the same card, expanded,
 * in a Radix Dialog rendered in place (no portal, own backdrop) so it keeps
 * the original stacking and positioning; the compact card stays as an
 * invisible placeholder. Escape, a press outside the card and the
 * minimise button close it.
 */
export default function DenseSchemeCard({ scheme, result, isExpanded, onToggleExpand }: DenseSchemeCardProps) {
  const color =
    scheme.level === "Federal"
      ? STATE_COLORS.FEDERAL
      : scheme.state
        ? (STATE_COLORS as Record<string, string>)[scheme.state]
        : STATE_COLORS.FEDERAL;
  const accent = { "--card-accent": color } as CSSProperties;

  const contentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const header = (expanded: boolean) => {
    const icon = (
      <Button
        type="button"
        variant="tinted-icon"
        style={{ "--tint-accent": color } as CSSProperties}
        aria-label={expanded ? "Close grant details" : "View grant details"}
      >
        {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>
    );
    return (
      <div className="relative flex justify-between items-center gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Badge variant="tinted" style={{ "--badge-accent": color } as CSSProperties}>
            {scheme.level === "Federal" ? "Federal" : scheme.state}
          </Badge>
          <h3 className="absolute left-0 right-0 m-0 text-[20px] leading-[1.2] font-semibold tracking-[-0.02em] text-center pointer-events-none">
            {scheme.name}
          </h3>
        </div>
        {expanded ? <DialogClose asChild>{icon}</DialogClose> : <DialogTrigger asChild>{icon}</DialogTrigger>}
      </div>
    );
  };

  const subheader = (
    <p className="m-0 mb-2 text-[14px] leading-[1.45] text-white/[0.62]">{scheme.theme}</p>
  );

  return (
    <Dialog open={isExpanded} onOpenChange={(open) => { if (open !== isExpanded) onToggleExpand(); }}>
      {/* Compact card */}
      <Card variant="scheme" className={cn(COMPACT_HOVER, isExpanded && "invisible")} style={accent}>
        <div className="px-5 pt-5 pb-4 min-h-0 flex-1">
          {header(false)}
          {subheader}
          <CardContent scheme={scheme} color={color} />
        </div>
        <CardFooter scheme={scheme} result={result} color={color} />
      </Card>

      {/* Expanded card */}
      <DialogContent
        ref={contentRef}
        variant="bare"
        portal={false}
        overlay={false}
        aria-describedby={undefined}
        className="fixed inset-0 z-[100] flex items-center justify-center p-12 animate-overlay-in outline-none max-[900px]:p-4"
        // Nothing was focused on open before; focus the dialog itself rather
        // than its first button so no focus ring appears.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          contentRef.current?.focus({ preventScroll: true });
        }}
        // The backdrop is inside the dialog: a press anywhere off the card closes it.
        onPointerDown={(e) => {
          if (!cardRef.current?.contains(e.target as Node)) onToggleExpand();
        }}
      >
        <DialogTitle className="sr-only">{scheme.name}</DialogTitle>
        <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
        <Card
          ref={cardRef}
          variant="scheme"
          className="relative z-[1] w-full max-w-[720px] max-h-[calc(100vh-96px)] overflow-y-auto animate-card-pop-in"
          style={accent}
        >
          <div className="px-5 pt-5 pb-4 min-h-0 flex-1">
            {header(true)}
            {subheader}
            <CardContent scheme={scheme} color={color} />
            <ExpandedContent scheme={scheme} result={result} color={color} />
          </div>
          <CardFooter scheme={scheme} result={result} color={color} />
        </Card>
      </DialogContent>
    </Dialog>
  );
}
