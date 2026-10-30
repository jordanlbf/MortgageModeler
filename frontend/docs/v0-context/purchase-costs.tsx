"use client";

/**
 * Purchase Costs screen: one-file snapshot for designing in v0.
 *
 * Presentational only. Every number arrives through props (`PurchaseCostsState`);
 * the real app calculates them elsewhere, and that code is not included.
 * Generated variants must keep this contract: take data via props, no
 * calculation logic. (Small view-only derivations such as "% of price" are fine.)
 *
 * Imports are the app's shadcn/ui components (see shadcn-components.md).
 * Several use custom variants (Card "panel", Slider/Switch "accent",
 * ToggleGroup "segment-pill"/"pill", Button "disclosure"/"ghost-muted",
 * Input/NativeSelect "form", Table "bare", Label "bare", TooltipContent "surface").
 * Tokens such as bg-card, text-fg-primary and bg-brand come from globals.css.
 */

import { forwardRef, Fragment, useEffect, useId, useRef, useState } from "react";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// ══ Props and result types ══════════════════════════════════════════════

export const PC_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

export interface CostDetail {
  label: string;
  /** Pre-formatted, e.g. "$2,000" or "−$8,750" (a leading "−" renders as a saving). */
  value: string;
}

export interface CostItem {
  key: "deposit" | "duty" | "lmi" | "fees" | "grants";
  name: string;
  amount: number;
  color?: string;
  /** Short data-bearing note (e.g. "−$8,750 concession"); empty when there's nothing to add. */
  subtitle: string;
  /** Line items shown when the row is expanded (e.g. the fees breakdown). */
  details?: CostDetail[];
  /** A saving (grants): shown as a negative, kept out of the donut. */
  saving?: boolean;
}

/** What the user has entered. */
export interface PurchaseCostsInputs {
  state: string;
  /** "existing" | "new" | "land" */
  propertyType: string;
  firstHome: boolean;
  ownerOcc: boolean;
  couple: boolean;
  lmiExempt: boolean;
  /** Parsed dollars (0 when empty). */
  price: number;
  depositAmount: number;
}

/** Callbacks for changing inputs. The money setters take digits as a string. */
export interface PurchaseCostsSetters {
  setState: (v: string) => void;
  setPropertyType: (v: string) => void;
  setFirstHome: (v: boolean) => void;
  setOwnerOcc: (v: boolean) => void;
  setCouple: (v: boolean) => void;
  setLmiExempt: (v: boolean) => void;
  setPriceInput: (digits: string) => void;
  setDepositAmountInput: (digits: string) => void;
}

/** The estimate, already calculated. */
export interface PurchaseCostsResult {
  deposit: number;
  /** Stamp duty + LMI + fees − grants. */
  costs: number;
  /** Cash needed: deposit + costs. */
  total: number;
  grants: number;
  loanAmount: number;
  /** Loan-to-value ratio as a decimal (0.84 = 84%). */
  lvr: number;
  /** Stamp duty, LMI, fees (and grants when any), in display order. */
  items: CostItem[];
}

export interface PurchaseCostsState {
  inputs: PurchaseCostsInputs;
  setters: PurchaseCostsSetters;
  /** null until the first estimate arrives (and while price is 0). */
  result: PurchaseCostsResult | null;
  loading: boolean;
  error: string | null;
}

// ══ Helpers (copies of small app utilities) ═════════════════════════════

/** "$1,234" (en-AU, no decimals); empty string for 0. */
function formatDollars(n: number): string {
  if (n === 0) return "";
  const formatted = "$" + Math.abs(n).toLocaleString("en-AU", { maximumFractionDigits: 0 });
  return n < 0 ? `-${formatted}` : formatted;
}

/** Tweens a number towards `target` (ease-out cubic). */
function useAnimatedValue(target: number, duration = 300) {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number>(0);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    const delta = target - from;
    if (delta === 0) return;
    const start = performance.now();
    cancelAnimationFrame(raf.current);
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(from + delta * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      prev.current = target;
    };
  }, [target, duration]);
  return display;
}

/** Cost colours, shared by the donut, its legend and the list dots. */
const PURCHASE_COST_COLORS = {
  deposit: "var(--color-fg-tertiary)",
  stampDuty: "#3b82f6", // blue-500
  lmi: "#ec4899", // pink-500
  fees: "#8b5cf6", // violet-500
} as const;

const LVR_COLORS = {
  safe: "var(--color-data-positive)",
  moderate: "var(--color-data-warning)",
  high: "var(--color-data-negative)",
} as const;

// ══ Shared bits ═════════════════════════════════════════════════════════

const CAPTION = "text-[11px] font-medium uppercase tracking-[0.08em] text-fg-tertiary";

function Money({ value }: { value: number }) {
  const v = useAnimatedValue(value, 400);
  return <>{formatDollars(Math.round(v)) || "$0"}</>;
}

// ══ Input column ══════════════════════════════════════════════════════

/**
 * Reads typed money: "650000", "650,000", "$650k", "1.2m", and for the deposit
 * "20%" (of `percentOf`). Returns null while the text isn't a number yet.
 */
function parseAmount(text: string, percentOf?: number): number | null {
  const t = text.trim().toLowerCase().replace(/[$,\s]/g, "");
  if (!t) return 0;
  const m = t.match(/^(\d*\.?\d*)(k|m|%)?$/);
  if (!m || m[1] === "" || m[1] === ".") return null;
  const n = parseFloat(m[1]);
  if (m[2] === "k") return Math.round(n * 1e3);
  if (m[2] === "m") return Math.round(n * 1e6);
  if (m[2] === "%") return percentOf ? Math.round((percentOf * Math.min(n, 100)) / 100) : null;
  return Math.round(n);
}

const MONEY_SIZE = {
  lg: { dollar: "text-[22px]", input: "h-10 text-[30px] tracking-[-0.02em]" },
  md: { dollar: "text-[17px]", input: "h-8 text-[20px]" },
} as const;

/**
 * Money input with a "$" prefix. Keeps what you type while focused (so "1.2m"
 * or "20%" can be typed), updates the estimate on every keystroke, and tidies
 * to "600,000" on blur. Arrow keys step by `step`.
 */
function MoneyField({
  id,
  value,
  onCommit,
  placeholder,
  step,
  percentOf,
  autoFocus,
  aside,
  size = "md",
}: {
  id: string;
  value: number;
  onCommit: (n: number) => void;
  placeholder: string;
  step: number;
  percentOf?: number;
  autoFocus?: boolean;
  aside?: React.ReactNode;
  size?: keyof typeof MONEY_SIZE;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const shown = draft ?? (value > 0 ? formatDollars(value).replace(/^\$/, "") : "");
  const sz = MONEY_SIZE[size];

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
    // Focus once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className={`${sz.dollar} font-semibold ${value > 0 || draft ? "text-fg-secondary" : "text-fg-muted"}`} aria-hidden="true">$</span>
      <Input
        ref={ref}
        variant="form"
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={shown}
        onChange={(e) => {
          const text = e.target.value;
          const n = parseAmount(text, percentOf);
          if (n !== null) onCommit(n);
          // Plain numbers show formatted as you type; shorthand ("1.2m", "20%") stays as typed until blur.
          setDraft(/^[\s$\d,]*$/.test(text) ? null : text);
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setDraft(null);
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const dir = e.key === "ArrowUp" ? 1 : -1;
            const next = Math.max(0, (dir > 0 ? Math.floor(value / step) + 1 : Math.ceil(value / step) - 1) * step);
            setDraft(null);
            onCommit(next);
          }
        }}
        className={`${sz.input} min-w-0 flex-1 border-0 bg-transparent px-0 font-semibold tabular-nums shadow-none placeholder:font-normal placeholder:text-fg-muted hover:bg-transparent focus:bg-transparent focus:shadow-none`}
      />
      {aside}
    </span>
  );
}

/** Caption + money input (clicking either focuses the input), with a slider underneath. */
function MoneyBlock({ label, htmlFor, children, slider }: { label: string; htmlFor: string; children: React.ReactNode; slider: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 px-6 py-4">
      <label htmlFor={htmlFor} className="flex cursor-text flex-col gap-1">
        <span className={CAPTION}>{label}</span>
        {children}
      </label>
      {slider}
    </div>
  );
}

/**
 * A collapsible group, like an account group in a finance sidebar: chevron and
 * title on the left; when collapsed, the current values sit right-aligned.
 */
function Group({ title, summary, defaultOpen, children }: { title: string; summary: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t border-border-subtle">
      <CollapsibleTrigger asChild>
        <Button variant="disclosure" className="h-auto gap-3 px-6 py-3.5 hover:bg-surface-hover/30">
          <span className="flex items-center gap-2 text-[14px] font-medium text-fg-primary">
            <ChevronRight
              size={15}
              className={`shrink-0 text-fg-tertiary transition-transform duration-200 ${open ? "rotate-90" : ""}`}
              aria-hidden="true"
            />
            {title}
          </span>
          {!open && <span className="truncate text-[13px] text-fg-tertiary">{summary}</span>}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3.5 px-6 pt-0.5 pb-5">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** A setting row: label (and optional hint) on the left, a switch on the right. */
function SwitchRow({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Label variant="bare" htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13.5px] text-fg-primary">{label}</span>
        <span className="text-[12px] text-fg-tertiary">{hint}</span>
      </span>
      <Switch variant="accent" id={id} checked={checked} onCheckedChange={onChange} />
    </Label>
  );
}

const PROPERTY_TYPES = [
  { value: "existing", label: "Existing" },
  { value: "new", label: "New" },
  { value: "land", label: "Land" },
] as const;

const ITEM = "h-8 min-w-0 px-3 text-[12.5px]";

/** The input column: price and deposit always visible, everything else in collapsible groups. */
function InputPanel({ pc }: { pc: PurchaseCostsState }) {
  const id = useId();
  const { inputs, setters } = pc;
  const { price, depositAmount } = inputs;

  const overPrice = price > 0 && depositAmount > price;
  const pct = price > 0 && depositAmount > 0 ? `${+((depositAmount / price) * 100).toFixed(1)}%` : null;

  const priceMin = 100_000;
  const priceMax = Math.max(3_000_000, price);
  const depositMax = Math.max(price, depositAmount, 50_000);

  const typeLabel = PROPERTY_TYPES.find((t) => t.value === inputs.propertyType)?.label ?? "";
  const buyerSummary = [inputs.ownerOcc ? "Live in it" : "Investment", inputs.firstHome && "First home"].filter(Boolean).join(" · ");
  const advancedSummary = [inputs.couple && "Couple", inputs.lmiExempt && "LMI exempt"].filter(Boolean).join(" · ") || "None";

  return (
    <Card variant="panel" role="group" aria-label="Purchase details" className="rounded-2xl">
      <h2 className="px-6 pt-6 pb-1 text-[17px] font-semibold tracking-[-0.01em] text-fg-primary">Your purchase</h2>

      <MoneyBlock
        label="Purchase price"
        htmlFor={`${id}-price`}
        slider={
          <Slider
            variant="accent"
            aria-label="Purchase price"
            min={priceMin}
            max={priceMax}
            step={10_000}
            value={[Math.max(priceMin, price)]}
            onValueChange={([v]) => setters.setPriceInput(String(v))}
            thumbProps={{ "aria-valuetext": formatDollars(price) }}
          />
        }
      >
        <MoneyField
          id={`${id}-price`}
          size="lg"
          value={price}
          onCommit={(n) => setters.setPriceInput(String(n))}
          placeholder="e.g. 650k"
          step={10000}
          autoFocus={price === 0}
        />
      </MoneyBlock>

      <MoneyBlock
        label="Deposit"
        htmlFor={`${id}-deposit`}
        slider={
          <Slider
            variant="accent"
            aria-label="Deposit"
            min={0}
            max={depositMax}
            step={5_000}
            disabled={price <= 0}
            value={[Math.min(depositAmount, depositMax)]}
            onValueChange={([v]) => setters.setDepositAmountInput(String(v))}
            thumbProps={{ "aria-valuetext": formatDollars(depositAmount) }}
          />
        }
      >
        <MoneyField
          id={`${id}-deposit`}
          value={depositAmount}
          onCommit={(n) => setters.setDepositAmountInput(String(n))}
          placeholder={price > 0 ? "e.g. 20% or 130k" : "e.g. 130k"}
          step={5000}
          percentOf={price}
          aside={
            pct && (
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-medium tabular-nums ${
                  overPrice ? "bg-data-negative/10 text-data-negative" : "bg-surface-hover text-fg-secondary"
                }`}
                aria-live="polite"
              >
                {overPrice ? "Over price" : pct}
              </span>
            )
          }
        />
      </MoneyBlock>

      <div className="h-2" />

      <Group title="Property" summary={`${inputs.state} · ${typeLabel}`} defaultOpen>
        <div className="flex items-center justify-between gap-4">
          <Label variant="bare" htmlFor={`${id}-state`} className="text-[13.5px] text-fg-secondary">State</Label>
          <NativeSelect
            variant="form"
            id={`${id}-state`}
            aria-label="State"
            value={inputs.state}
            onChange={(e) => setters.setState(e.target.value)}
            className="h-8 w-[84px] rounded-lg pl-3 pr-7 text-[13px] font-medium"
          >
            {PC_STATES.map((s) => (
              <NativeSelectOption variant="form" key={s} value={s}>{s}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <ToggleGroup
          type="single"
          variant="segment-pill"
          aria-label="Property type"
          className="grid grid-cols-3 gap-1.5"
          value={inputs.propertyType}
          onValueChange={(v) => { if (v) setters.setPropertyType(v); }}
        >
          {PROPERTY_TYPES.map((t) => (
            <ToggleGroupItem key={t.value} value={t.value} className={ITEM}>{t.label}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Group>

      <Group title="Buyer" summary={buyerSummary} defaultOpen>
        <ToggleGroup
          type="single"
          variant="segment-pill"
          aria-label="Occupancy"
          className="grid grid-cols-2 gap-1.5"
          value={inputs.ownerOcc ? "owner" : "investor"}
          onValueChange={(v) => { if (v) setters.setOwnerOcc(v === "owner"); }}
        >
          <ToggleGroupItem value="owner" className={ITEM}>Live in it</ToggleGroupItem>
          <ToggleGroupItem value="investor" className={ITEM}>Investment</ToggleGroupItem>
        </ToggleGroup>
        <SwitchRow
          id={`${id}-first`}
          label="First home"
          hint="Unlocks state concessions and grants"
          checked={inputs.firstHome}
          onChange={setters.setFirstHome}
        />
      </Group>

      <Group title="Advanced" summary={advancedSummary}>
        <SwitchRow id={`${id}-couple`} label="Couple" hint="Two buyers on the title" checked={inputs.couple} onChange={setters.setCouple} />
        <SwitchRow
          id={`${id}-lmi`}
          label="LMI exempt"
          hint="Some medical, legal and finance professions"
          checked={inputs.lmiExempt}
          onChange={setters.setLmiExempt}
        />
      </Group>

      <div className="h-2" />
    </Card>
  );
}

// ══ Cash needed hero ══════════════════════════════════════════════════

interface Slice {
  key: string;
  name: string;
  amount: number;
  color: string;
}

const SIZE = 168;

/** Donut of the purchase costs (not the deposit), with a legend underneath. */
function CostsDonut({ slices, active, onActive }: { slices: Slice[]; active: string | null; onActive: (k: string | null) => void }) {
  const shown = slices.filter((s) => s.amount > 0);
  const empty = shown.length === 0;
  const sum = shown.reduce((a, s) => a + s.amount, 0);
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative"
        style={{ width: SIZE, height: SIZE }}
        role="img"
        aria-label={empty ? "No purchase costs yet" : `Purchase costs: ${shown.map((s) => `${s.name} ${formatDollars(s.amount)}`).join(", ")}`}
        onMouseLeave={() => onActive(null)}
      >
        <PieChart width={SIZE} height={SIZE}>
          <Pie
            data={empty ? [{ key: "empty", amount: 1 }] : shown}
            dataKey="amount"
            nameKey="key"
            innerRadius={SIZE / 2 - 22}
            outerRadius={SIZE / 2 - 2}
            paddingAngle={empty || shown.length === 1 ? 0 : 2}
            cornerRadius={4}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={!empty}
            animationDuration={400}
          >
            {empty
              ? <Cell fill="var(--color-surface-hover)" />
              : shown.map((s) => (
                  <Cell
                    key={s.key}
                    fill={s.color}
                    fillOpacity={active && active !== s.key ? 0.25 : 1}
                    className="cursor-default outline-none transition-[fill-opacity] duration-150"
                    onMouseEnter={() => onActive(s.key)}
                  />
                ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5" aria-hidden="true">
          <span className="text-[11px] text-fg-tertiary">Costs</span>
          <span className="text-[16px] font-semibold tabular-nums text-fg-primary">{empty ? "—" : <Money value={sum} />}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5 self-stretch" onMouseLeave={() => onActive(null)}>
        {slices.map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-2.5 text-[12.5px] transition-opacity duration-150"
            style={{ opacity: active && active !== s.key ? 0.4 : 1 }}
            onPointerEnter={(e) => { if (e.pointerType === "mouse" && s.amount > 0) onActive(s.key); }}
          >
            <span className="size-2 shrink-0 rounded-full" style={{ background: s.color, opacity: s.amount > 0 ? 1 : 0.4 }} aria-hidden="true" />
            <span className="flex-1 text-fg-secondary">{s.name}</span>
            <span className="tabular-nums text-fg-tertiary">{empty ? "—" : formatDollars(s.amount) || "$0"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The one hero number: cash needed, with its share of the price and a
 * deposit + costs line, beside a donut splitting the purchase costs.
 */
const CashNeededHero = forwardRef<HTMLDivElement, {
  total: number | null;
  price: number;
  deposit: number;
  costs: number;
  /** Grants, already taken off `costs`. */
  grants: number;
  slices: Slice[];
  status: React.ReactNode;
  active: string | null;
  onActive: (k: string | null) => void;
}>(function CashNeededHero({ total, price, deposit, costs, grants, slices, status, active, onActive }, ref) {
  const share = total !== null && price > 0 ? (total / price) * 100 : null;
  return (
    <Card ref={ref} variant="panel" className="relative overflow-hidden rounded-2xl px-7 py-7 sm:px-8">
      <span className="absolute inset-x-0 top-0 h-px bg-brand/50" aria-hidden="true" />
      <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 id="pc-cash-needed" className={`${CAPTION} text-brand/80`}>Cash needed</h2>
            {status}
          </div>
          <div className="text-[48px] font-semibold leading-none tracking-[-0.03em] text-brand tabular-nums sm:text-[56px]">
            {total === null ? <span className="text-fg-muted">—</span> : <Money value={total} />}
          </div>
          <p className="text-[14px] text-fg-tertiary tabular-nums">
            {share === null ? "Enter a purchase price to see your estimate" : `≈ ${share.toFixed(1)}% of purchase price`}
          </p>
          {total !== null && (
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] tabular-nums text-fg-secondary">
              <span><span className="text-fg-tertiary">Deposit</span> {formatDollars(deposit) || "$0"}</span>
              <span><span className="text-fg-tertiary">Purchase costs</span> {formatDollars(costs) || "$0"}</span>
              {grants > 0 && <span><span className="text-fg-tertiary">after grants</span> <span className="text-data-positive">−{formatDollars(grants)}</span></span>}
            </p>
          )}
        </div>
        <CostsDonut slices={slices} active={active} onActive={onActive} />
      </div>
    </Card>
  );
});


// ══ Loan and LVR tiles ════════════════════════════════════════════════

const LMI_THRESHOLD = 0.8;
const EMPTY = <span className="text-fg-muted">—</span>;

function Tile({ label, value, visual }: { label: string; value: React.ReactNode; visual?: React.ReactNode }) {
  return (
    <Card variant="panel" className="flex h-full min-w-0 flex-col gap-3 rounded-2xl px-6 py-5">
      <span className={CAPTION}>{label}</span>
      <div className="text-[26px] font-semibold leading-none tracking-[-0.025em] tabular-nums text-fg-primary">{value}</div>
      {visual && <div className="mt-auto pt-1">{visual}</div>}
    </Card>
  );
}

function lvrColor(lvr: number) {
  if (lvr <= LMI_THRESHOLD) return LVR_COLORS.safe;
  if (lvr <= 0.9) return LVR_COLORS.moderate;
  return LVR_COLORS.high;
}

/** LVR meter with the 80% LMI threshold marked and labelled. */
function LvrMeter({ lvr }: { lvr: number | null }) {
  const pct = lvr === null ? 0 : Math.min(Math.max(lvr, 0), 1) * 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="relative h-1.5 w-full rounded-full bg-surface-hover"
        role="meter"
        aria-label="Loan to value ratio"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-valuetext={lvr === null ? "No estimate yet" : `${Math.round(pct)}%${lvr > LMI_THRESHOLD ? ", over the 80% LMI threshold" : ""}`}
      >
        {lvr !== null && (
          <span
            className="block h-full rounded-full transition-[width,background-color] duration-300"
            style={{ width: `${pct}%`, background: lvrColor(lvr) }}
          />
        )}
        <span
          className="absolute -top-[3px] -bottom-[3px] w-0.5 rounded-full bg-fg-tertiary"
          style={{ left: `calc(${LMI_THRESHOLD * 100}% - 1px)` }}
          aria-hidden="true"
        />
      </div>
      {/* Label under the 80% marker: above it, LMI applies. */}
      <div className="relative h-3 text-[10.5px] tabular-nums text-fg-muted" aria-hidden="true">
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${LMI_THRESHOLD * 100}%` }}>80% · LMI</span>
      </div>
    </div>
  );
}

/** Supporting numbers beside the hero: loan amount and LVR. "—" until there's an estimate. */
function EstimateTiles({ loanAmount, lvr }: { loanAmount: number | null; lvr: number | null }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Tile label="Loan amount" value={loanAmount === null ? EMPTY : <Money value={loanAmount} />} />
      <Tile
        label="LVR"
        value={lvr === null ? EMPTY : <span style={{ color: lvrColor(lvr) }}>{Math.round(lvr * 100)}%</span>}
        visual={<LvrMeter lvr={lvr} />}
      />
    </div>
  );
}

// ══ Where your cash goes ══════════════════════════════════════════════

/** Shorter names for phone widths. */
const SHORT_NAME: Partial<Record<CostItem["key"], string>> = { lmi: "LMI" };

/**
 * Itemised list: the deposit, then each cost. Dots match the donut and its
 * legend. Line items (fees, concessions) fold away under their row.
 * `empty` shows "—" before there's an estimate.
 */
function CostTable({
  items,
  deposit,
  empty,
  active,
  onActive,
}: {
  items: CostItem[];
  deposit: number;
  empty: boolean;
  active: string | null;
  onActive: (key: string | null) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const rows: CostItem[] = [
    { key: "deposit", name: "Deposit", amount: deposit, color: PURCHASE_COST_COLORS.deposit, subtitle: "" },
    ...items,
  ];

  return (
    <Table variant="bare" className="w-full table-fixed border-collapse text-left" onMouseLeave={() => onActive(null)}>
      <TableHeader className="sr-only">
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((item) => {
          const dim = active !== null && active !== item.key;
          const zero = item.amount === 0 && !item.saving;
          const lines = empty ? [] : (item.details ?? []);
          const expanded = open.has(item.key);
          const hover = (e: React.PointerEvent) => { if (e.pointerType === "mouse") onActive(item.saving ? null : item.key); };
          return (
            <Fragment key={item.key}>
              <TableRow
                className="border-t border-border-subtle transition-opacity duration-150 first:border-t-0"
                style={{ opacity: dim ? 0.4 : 1 }}
                onPointerEnter={hover}
              >
                <TableCell className="py-3 pr-3 pl-2">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="size-2 shrink-0 rounded-[3px]"
                      style={{ background: item.saving ? "var(--color-data-positive)" : item.color, opacity: zero ? 0.4 : 1 }}
                      aria-hidden="true"
                    />
                    <span className="flex min-w-0 flex-col items-start gap-0.5">
                      {lines.length > 0 ? (
                        <Button
                          variant="ghost-muted"
                          aria-expanded={expanded}
                          onClick={() => toggle(item.key)}
                          className="-my-1 -ml-1.5 flex h-7 min-w-0 items-center gap-1 rounded-md px-1.5 text-[13.5px] font-medium text-fg-primary"
                        >
                          <span className="truncate">{item.name}</span>
                          <ChevronRight
                            size={14}
                            className={`shrink-0 text-fg-tertiary transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                            aria-hidden="true"
                          />
                        </Button>
                      ) : (
                        <span className={`truncate text-[13.5px] font-medium ${zero ? "text-fg-tertiary" : "text-fg-primary"}`}>
                          {SHORT_NAME[item.key] ? (
                            <>
                              <span className="max-sm:hidden">{item.name}</span>
                              <span className="sm:hidden">{SHORT_NAME[item.key]}</span>
                            </>
                          ) : item.name}
                        </span>
                      )}
                      {item.subtitle && !empty && (
                        <span className="max-w-full truncate text-[12px] tabular-nums text-fg-tertiary">{item.subtitle}</span>
                      )}
                    </span>
                  </span>
                </TableCell>
                <TableCell
                  className={`w-[112px] py-3 pr-2 text-right text-[13.5px] font-semibold tabular-nums max-sm:w-[92px] ${
                    item.saving ? "text-data-positive" : zero ? "text-fg-tertiary" : "text-fg-primary"
                  }`}
                >
                  {empty ? <span className="font-normal text-fg-muted">—</span> : item.saving ? `−${formatDollars(item.amount)}` : formatDollars(item.amount) || "$0"}
                </TableCell>
              </TableRow>

              {expanded && lines.map((d, i) => {
                const last = i === lines.length - 1 ? "pb-3" : "";
                return (
                  <TableRow key={d.label} className="transition-opacity duration-150" style={{ opacity: dim ? 0.4 : 1 }} onPointerEnter={hover}>
                    <TableCell className={`py-[5px] pr-3 pl-[26px] text-[12.5px] text-fg-secondary ${last}`}>
                      <span className="flex items-center gap-2.5">
                        <span className="h-px w-2.5 shrink-0 bg-border-default" aria-hidden="true" />
                        <span className="truncate">{d.label}</span>
                      </span>
                    </TableCell>
                    <TableCell
                      className={`py-[5px] pr-2 text-right text-[12.5px] tabular-nums ${d.value.startsWith("−") ? "text-data-positive" : "text-fg-secondary"} ${last}`}
                    >
                      {d.value}
                    </TableCell>
                  </TableRow>
                );
              })}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ══ Mobile summary bar ════════════════════════════════════════════════

/**
 * Phones and tablets only: a "Cash needed" bar pinned to the top of the
 * results once the hero card has scrolled up out of view.
 * Render it as the first child of the results column; it takes no space.
 */
function MobileSummaryBar({ target, total }: { target: React.RefObject<HTMLElement | null>; total: number | null }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <div className="sticky top-0 z-20 h-0 lg:hidden">
      <div
        className={`flex items-center justify-between rounded-xl border border-border-subtle bg-surface-raised/95 px-4 py-3 shadow-raised backdrop-blur-md transition-[opacity,translate] duration-200 ${
          show ? "translate-y-2 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
        aria-hidden={!show}
      >
        <span className="text-[13px] text-fg-secondary">Cash needed</span>
        <span className="text-[17px] font-semibold tabular-nums text-brand">{total === null ? "—" : formatDollars(total) || "$0"}</span>
      </div>
    </div>
  );
}

// ══ Page ══════════════════════════════════════════════════════════════

/** Rows shown before there's an estimate, so the layout never jumps. */
const PLACEHOLDER_ITEMS: CostItem[] = [
  { key: "duty", name: "Stamp duty", amount: 0, color: PURCHASE_COST_COLORS.stampDuty, subtitle: "" },
  { key: "lmi", name: "Lenders mortgage insurance", amount: 0, color: PURCHASE_COST_COLORS.lmi, subtitle: "" },
  { key: "fees", name: "Fees", amount: 0, color: PURCHASE_COST_COLORS.fees, subtitle: "" },
];

/** Shorter names for the donut legend. */
const LEGEND_NAME: Partial<Record<CostItem["key"], string>> = { lmi: "LMI" };

function Status({ pc }: { pc: PurchaseCostsState }) {
  const { inputs, loading, error, result } = pc;
  const s = inputs.price <= 0
    ? { label: "Waiting for a price", dot: "bg-fg-muted", pulse: false }
    : error
      ? { label: "Couldn't update", dot: "bg-data-negative", pulse: false }
      : loading || !result
        ? { label: "Updating", dot: "bg-data-warning", pulse: true }
        : { label: "Live", dot: "bg-brand", pulse: false };
  return (
    <span className="flex shrink-0 items-center gap-2 rounded-full border border-border-subtle px-3 py-1 text-[12px] text-fg-secondary" aria-live="polite">
      <span className={`size-1.5 rounded-full ${s.dot} ${s.pulse ? "animate-pulse" : ""}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}

/**
 * Two-column calculator: inputs on the left (sticky on desktop), results on
 * the right: the cash-needed hero with a costs donut, loan and LVR, then the
 * itemised list. Stacks below lg, with a summary bar once the hero scrolls away.
 */
export default function PurchaseCostsView(pc: PurchaseCostsState) {
  const [active, setActive] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { result, error, loading, inputs } = pc;
  const empty = !result;

  // LMI is the cost you can act on: say how much more deposit avoids it.
  const lmiGap = Math.max(0, Math.round(inputs.price * 0.2 - (result?.deposit ?? 0)));
  const items = empty
    ? PLACEHOLDER_ITEMS
    : result.items.map((i) =>
        i.key === "lmi" && i.amount > 0 && lmiGap > 0
          ? { ...i, subtitle: `${i.subtitle} · +${formatDollars(lmiGap)} deposit avoids it` }
          : i,
      );
  const deposit = result?.deposit ?? 0;
  const total = result?.total ?? null;
  const slices = items
    .filter((i) => !i.saving)
    .map((i) => ({ key: i.key, name: LEGEND_NAME[i.key] ?? i.name, amount: i.amount, color: i.color ?? "" }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)] lg:items-start">
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <InputPanel pc={pc} />
      </aside>

      <section className="flex min-w-0 flex-col gap-4" aria-labelledby="pc-cash-needed">
        <MobileSummaryBar target={heroRef} total={total} />

        {error && (
          <div role="alert" className="flex items-center gap-2.5 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-[13px] text-red-400/80">
            <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <div className={`flex flex-col gap-4 transition-opacity duration-200 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
          <CashNeededHero
            ref={heroRef}
            total={total}
            price={inputs.price}
            deposit={deposit}
            costs={result?.costs ?? 0}
            grants={result?.grants ?? 0}
            slices={slices}
            status={<Status pc={pc} />}
            active={active}
            onActive={setActive}
          />

          <EstimateTiles loanAmount={result?.loanAmount ?? null} lvr={result?.lvr ?? null} />

          <Card variant="panel" className="flex flex-col gap-3 rounded-2xl px-6 pt-5 pb-3">
            <h3 className="text-[15px] font-semibold text-fg-primary">Where your cash goes</h3>
            <CostTable items={items} deposit={deposit} empty={empty} active={active} onActive={setActive} />
          </Card>
        </div>
      </section>
    </div>
  );
}
