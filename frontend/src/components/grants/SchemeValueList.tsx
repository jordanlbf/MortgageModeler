"use client";

import { memo } from "react";
import {
  Baby, Banknote, CalendarX, ChevronRight, CircleCheck, ClipboardList, Hammer, Handshake, House, KeyRound, LandPlot, Lock,
  PiggyBank, ShieldCheck, Stamp, Tag, User, Users, Wallet, type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { grantKind } from "@/hooks/useGrantsState";
import type { GrantSchemeWithEligibility } from "@/lib/api";
import { formatDollarsShort } from "@/lib/formatters";
import { GRANT_KIND_COLORS, mix, t } from "@/lib/theme";
import SectionCard from "@/components/patterns/cards/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RegionBadge, useSchemeSheet } from "./SchemeList";

type Item = GrantSchemeWithEligibility;

/** Co-ownership bars fill the track at this share. */
const SHARE_FULL = 0.5;
/** Below this much of the track, the figure sits after the bar instead of in it. */
const LABEL_INSIDE = 0.22;
/** Schemes of these kinds don't stack: only the best of each counts toward the total. */
const BEST_ONLY = ["concession", "guarantee"];

const colorOf = (i: Item) => GRANT_KIND_COLORS[grantKind(i.scheme.category)];

const ICONS: Record<string, LucideIcon> = { grant: Banknote, concession: Stamp, guarantee: ShieldCheck, super: PiggyBank };

/** The scheme's icon: by category; co-ownership is a handshake (federal) or people (state). */
function SchemeIcon({ item, className, style }: { item: Item; className: string; style?: React.CSSProperties }) {
  const Icon = ICONS[item.scheme.category] ?? (item.scheme.level === "Federal" ? Handshake : Users);
  return <Icon className={className} style={style} aria-hidden="true" />;
}

/** Drops a trailing acronym: "First Home Super Saver (FHSS)" → "First Home Super Saver". Other brackets tell schemes apart. */
const shortName = (name: string) => name.replace(/\s*\([A-Z]+\)\s*$/, "");

const stripes = (color: string) => `repeating-linear-gradient(135deg, ${color} 0 6px, ${mix(color, 55)} 6px 10px)`;

/** What counts toward the headline: dollar schemes, best one only where they don't stack. */
function counted(items: Item[]) {
  const best = new Map<string, Item>();
  const rest: Item[] = [];
  for (const i of items) {
    if (!i.value.amount) continue;
    if (!BEST_ONLY.includes(i.scheme.category)) { rest.push(i); continue; }
    const cur = best.get(i.scheme.category);
    if (!cur || i.value.amount > (cur.value.amount ?? 0)) best.set(i.scheme.category, i);
  }
  return [...rest, ...best.values()].sort((a, b) => (b.value.amount ?? 0) - (a.value.amount ?? 0));
}

type Blocker = Item["result"]["blockers"][number];

const PROPERTY_LABELS: Record<string, string> = {
  existing: "Existing home",
  new: "New build",
  land: "Vacant land",
  "off-the-plan": "Off the plan",
};

/** What each failing rule needs, as a chip: icon and a word or two. */
const BLOCKERS: Record<string, { icon: LucideIcon; label: (b: Blocker) => string }> = {
  property_type: { icon: House, label: (b) => (b.options ?? []).map((o) => PROPERTY_LABELS[o] ?? o).join(" or ") },
  single_parent: { icon: Baby, label: () => "Single parent" },
  first_home: { icon: KeyRound, label: () => "First home buyer" },
  not_first_home: { icon: KeyRound, label: () => "Not a first home" },
  owner_occupier: { icon: House, label: () => "Living in it" },
  off_the_plan: { icon: ClipboardList, label: () => "Off the plan" },
  individual: { icon: User, label: () => "Buying alone" },
  no_recent_property: { icon: CalendarX, label: () => "No home in 2 yrs" },
  price: { icon: Tag, label: (b) => `Under ${formatDollarsShort(b.amount ?? 0)}` },
  income: { icon: Wallet, label: (b) => `Income under ${formatDollarsShort(b.amount ?? 0)}` },
};
/** Property type icons, so "New build" and "Vacant land" read at a glance. */
const PROPERTY_ICONS: Record<string, LucideIcon> = { new: Hammer, land: LandPlot, "off-the-plan": ClipboardList };
/** Which blocker the chip shows: what you'd change first. */
const BLOCKER_ORDER = Object.keys(BLOCKERS);

/** The main thing that rules a scheme out (and how many more), as an amber chip. */
function BlockerChip({ blockers }: { blockers: Blocker[] }) {
  const [first] = [...blockers].sort((a, b) => BLOCKER_ORDER.indexOf(a.kind) - BLOCKER_ORDER.indexOf(b.kind));
  if (!first) return null;
  const rule = BLOCKERS[first.kind];
  const Icon = (first.kind === "property_type" && PROPERTY_ICONS[first.options?.[0] ?? ""]) || rule?.icon || Lock;
  const more = blockers.length - 1;
  return (
    <span className="flex h-7 w-36 shrink-0 items-center gap-2 rounded-md bg-status-warning-bg pr-2 pl-1 text-[12.5px] font-semibold text-status-warning">
      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-status-warning text-surface-page">
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <span className="truncate"><span className="sr-only">Needs: </span>{rule ? rule.label(first) : first.kind}</span>
      {more > 0 && <span className="ml-auto text-[11px] font-medium opacity-70"><span className="sr-only">and </span>+{more}</span>}
    </span>
  );
}

/** A scheme's bar: dollars against the biggest, or a striped share for co-ownership. `missed`: grey and locked. */
function Bar({ item, max, missed }: { item: Item; max: number; missed: boolean }) {
  const { amount, share } = item.value;
  const color = missed ? mix(t.fg.muted, 30) : colorOf(item);
  const coBuy = share !== null;
  const fill = coBuy ? Math.min(1, share / SHARE_FULL) : amount ? amount / max : 0;
  const figure = coBuy ? `${Math.round(share * 100)}%` : amount ? formatDollarsShort(amount) : null;
  const inside = fill >= LABEL_INSIDE;
  const label = figure && (
    <span
      className={cn(
        "flex items-center gap-1.5 text-[13px] font-semibold tabular-nums",
        missed ? "text-fg-tertiary" : inside ? "text-surface-page" : "text-fg-primary",
      )}
    >
      {missed ? <Lock className="size-3.5" aria-hidden="true" /> : <SchemeIcon item={item} className="size-3.5" />}
      {figure}
    </span>
  );

  return (
    <span className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md bg-surface-subtle">
      {fill > 0 && (
        <span
          className="flex h-full shrink-0 items-center justify-end rounded-md px-2.5"
          style={{ width: `${Math.max(fill * 100, 4)}%`, background: coBuy ? stripes(color) : color }}
        >
          {inside && label}
        </span>
      )}
      {!inside && label}
      {/* No figure: no price yet (—), or no dollar effect (say what it does instead). */}
      {!figure && (
        <span className="truncate px-2.5 text-[12.5px] text-fg-tertiary">
          {amount === null ? "—" : item.scheme.benefit_pill}
        </span>
      )}
    </span>
  );
}

const Row = memo(function Row({ item, max, missed, onOpen }: { item: Item; max: number; missed: boolean; onOpen: (id: string) => void }) {
  const color = colorOf(item);
  return (
    <li>
      <Button
        type="button"
        variant="disclosure-row"
        onClick={() => onOpen(item.scheme.id)}
        aria-haspopup="dialog"
        className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-6 py-2 whitespace-normal @[34rem]:grid-cols-[auto_10rem_1fr_auto]"
      >
        <span
          className={cn(
            "row-span-2 flex size-8 items-center justify-center self-center rounded-lg @[34rem]:row-span-1",
            missed && "bg-surface-subtle text-fg-muted ring-1 ring-border-subtle ring-inset",
          )}
          style={missed ? undefined : { background: mix(color, 16), color }}
        >
          <SchemeIcon item={item} className="size-4" />
        </span>
        <span className={cn("min-w-0 text-[13.5px] font-medium", missed ? "text-fg-secondary" : "text-fg-primary")}>{shortName(item.scheme.name)}</span>
        <span className="col-start-2 row-start-2 flex min-w-0 gap-2 @[34rem]:col-start-3 @[34rem]:row-start-1">
          {missed && <BlockerChip blockers={item.result.blockers} />}
          <Bar item={item} max={max} missed={missed} />
        </span>
        <span className="col-start-3 row-start-1 flex items-center justify-end gap-2 @[34rem]:col-start-4">
          <span className="flex w-16 justify-end"><RegionBadge scheme={item.scheme} muted={missed} /></span>
          <ChevronRight className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
        </span>
      </Button>
    </li>
  );
});

/**
 * Schemes as bars of what they're worth: dollars (grant, duty saved, LMI
 * avoided, super) against `scale` (the biggest, by default), then
 * co-ownership schemes as striped shares. A row opens the scheme's details
 * in a side panel. `items` null means not loaded yet.
 *
 * - Default, "Schemes for you": the page's heading (h1), a count and the
 *   dollars totalled in the header (best only where schemes don't stack).
 * - `missed`, "Not for you": grey, locked bars, with a chip for what rules
 *   each one out, and no total (they aren't yours to add up).
 */
export default function SchemeValueList({
  title,
  items,
  empty,
  titleId,
  missed = false,
  scale,
}: {
  title: string;
  items: Item[] | null;
  empty: string;
  titleId?: string;
  missed?: boolean;
  /** The dollar figure that fills a bar; pass one across lists so their bars compare. */
  scale?: number;
}) {
  const { open, sheet } = useSchemeSheet(items);
  const dollars = (items ?? [])
    .filter((i) => i.value.share === null)
    .sort((a, b) => (b.value.amount ?? -1) - (a.value.amount ?? -1));
  const coBuys = (items ?? []).filter((i) => i.value.share !== null).sort((a, b) => (b.value.share ?? 0) - (a.value.share ?? 0));
  const max = scale ?? Math.max(1, ...dollars.map((i) => i.value.amount ?? 0));
  const total = counted(dollars).reduce((sum, i) => sum + (i.value.amount ?? 0), 0);
  const Sub = missed ? "h3" : "h2";
  const accent = missed ? t.fg.muted : t.data.positive;
  const HeadIcon = missed ? Lock : CircleCheck;

  const heading = (
    <span className="flex items-center gap-3">
      <span
        className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", missed && "ring-1 ring-border-subtle ring-inset")}
        style={{ background: mix(accent, missed ? 10 : 14), color: accent }}
        aria-hidden="true"
      >
        <HeadIcon className="size-4" />
      </span>
      <span className={missed ? "text-fg-secondary" : undefined}>{title}</span>
      {!!items?.length && <span className="sr-only">, </span>}
      {!!items?.length && (
        <Badge variant="soft" className="rounded-full px-2 py-1" style={{ "--badge-accent": accent } as React.CSSProperties}>
          {items.length} {missed ? "locked" : "eligible"}
        </Badge>
      )}
    </span>
  );

  const headline = !missed && total > 0 && (
    <span className="text-[20px] font-semibold tracking-[-0.01em] text-data-positive tabular-nums">
      <span className="sr-only">Worth about </span>~{formatDollarsShort(total)}
    </span>
  );

  return (
    <SectionCard
      flush
      title={heading}
      titleAs={missed ? "h2" : "h1"}
      titleId={titleId}
      action={headline}
      className="@container"
    >
      {items === null ? (
        <div className="flex flex-col gap-3 border-t border-border-subtle px-6 py-4" aria-hidden="true">
          {[0, 1, 2].map((n) => <Skeleton key={n} className="h-8" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="mx-6 mb-6 rounded-xl border border-dashed border-border-subtle px-6 py-8 text-center text-[13px] text-fg-tertiary">{empty}</p>
      ) : (
        <div className="border-t border-border-subtle py-3">
          <ul>
            {dollars.map((item) => <Row key={item.scheme.id} item={item} max={max} missed={missed} onOpen={open} />)}
          </ul>
          {coBuys.length > 0 && (
            <>
              <div className="flex items-center gap-2.5 px-6 pt-3 pb-1" role="presentation">
                <span
                  className="h-2.5 w-5 rounded-sm"
                  style={{ background: stripes(missed ? mix(t.fg.muted, 30) : GRANT_KIND_COLORS.deposit) }}
                  aria-hidden="true"
                />
                <Label variant="caps" asChild><Sub>Gov co-buys</Sub></Label>
                <span className="flex-1 border-t border-dashed border-border-default" aria-hidden="true" />
              </div>
              <ul>
                {coBuys.map((item) => <Row key={item.scheme.id} item={item} max={max} missed={missed} onOpen={open} />)}
              </ul>
            </>
          )}
        </div>
      )}
      {sheet}
    </SectionCard>
  );
}
