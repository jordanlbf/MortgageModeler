"use client";

import { useCallback, useState, type CSSProperties } from "react";
import type { GrantSchemeWithEligibility } from "@/lib/api";
import { STATE_COLORS, t } from "@/lib/theme";
import InlineAlert from "@/components/patterns/blocks/InlineAlert";
import KeyValueList, { KeyValueRow } from "@/components/patterns/blocks/KeyValueList";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

type Item = GrantSchemeWithEligibility;

/** The jurisdiction's colour and short name ("Federal", "QLD"). */
function region(s: Item["scheme"]) {
  const key = s.level === "Federal" || !s.state ? "FEDERAL" : s.state;
  return {
    name: key === "FEDERAL" ? "Federal" : key,
    color: (STATE_COLORS as Record<string, string>)[key] ?? STATE_COLORS.FEDERAL,
  };
}

/** `muted`: grey, for schemes that don't fit. */
export function RegionBadge({ scheme, muted = false }: { scheme: Item["scheme"]; muted?: boolean }) {
  const r = region(scheme);
  return <Badge variant="soft" style={{ "--badge-accent": muted ? t.fg.muted : r.color } as CSSProperties}>{r.name}</Badge>;
}

/** "2026-06-30" → "30 Jun 2026". */
function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function Bullets({ title, items }: { title: string; items: string[] | null | undefined }) {
  if (!items?.length) return null;
  return (
    <section className="flex flex-col gap-2.5">
      <Label variant="caps" asChild><h3>{title}</h3></Label>
      <ul className="flex list-disc flex-col gap-1.5 pl-4 text-[13px] leading-snug text-fg-secondary marker:text-fg-muted">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </section>
  );
}

/** Everything about one scheme, in a side panel: whether it fits you, the key facts, then the detail. */
export function SchemeDetails({ item }: { item: Item }) {
  const { scheme, result } = item;
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col items-start gap-2 pr-8">
        <RegionBadge scheme={scheme} />
        <SheetTitle className="text-[18px] font-semibold tracking-[-0.01em] text-fg-primary">{scheme.name}</SheetTitle>
        <SheetDescription className="text-[13px] leading-snug text-fg-tertiary">{scheme.theme}</SheetDescription>
      </div>

      {result.eligible ? (
        <InlineAlert tone="success">{scheme.summary}</InlineAlert>
      ) : (
        <InlineAlert tone="warning">Not for you: {result.reasons.join(" · ")}</InlineAlert>
      )}

      <KeyValueList divided>
        <KeyValueRow label="Benefit" value={scheme.benefit_pill} size="md" />
        <KeyValueRow label="Deposit" value={scheme.meta.deposit} size="md" />
        <KeyValueRow label="LMI" value={scheme.meta.lmi} size="md" />
        <KeyValueRow label="Buyer" value={scheme.meta.buyer} size="md" />
        {scheme.valid_to && <KeyValueRow label="Ends" value={formatDate(scheme.valid_to)} size="md" />}
      </KeyValueList>

      <Bullets title="What you get" items={scheme.benefits} />
      <Bullets title="Who it's for" items={scheme.eligibility} />
      <Bullets title="Key rules" items={scheme.rules} />
      {scheme.details && (
        <section className="flex flex-col gap-2.5">
          <Label variant="caps" asChild><h3>About</h3></Label>
          <p className="text-[13px] leading-relaxed text-fg-secondary">{scheme.details}</p>
        </section>
      )}
    </div>
  );
}

/**
 * The scheme details side panel: `open(id)` shows that scheme; render `sheet`
 * once. The last scheme opened stays mounted while the panel slides closed.
 */
export function useSchemeSheet(items: Item[] | null) {
  const [shownId, setShownId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const shown = items?.find((s) => s.scheme.id === shownId) ?? null;
  const open = useCallback((schemeId: string) => { setShownId(schemeId); setIsOpen(true); }, []);
  const sheet = (
    <Sheet open={isOpen && !!shown} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-border-subtle bg-surface-raised sm:max-w-md">
        {shown && <SchemeDetails item={shown} />}
      </SheetContent>
    </Sheet>
  );
  return { open, sheet };
}
