import { useCallback, useState } from "react";
import { t, mix } from "@/lib/theme";
import { formatCurrencyShort } from "@/lib/formatters";
import { parseCurrency } from "@/lib/constants";
import type { AdvancedTaxInputs, AdvancedTaxSetters } from "@/hooks/useAdvancedTaxState";
import { useEditableInput } from "@/hooks/useEditableInput";
import GlassCard from "@/components/ui/GlassCard";
import Toggle from "@/components/ui/Toggle";

const CARD_STYLE = { borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated };

// ── Field definitions ────────────────────────────

type CurrencyField = {
  type: "currency";
  label: string;
  field: keyof AdvancedTaxInputs & string;
  setter: keyof AdvancedTaxSetters & string;
  min: number;
  max: number;
};

type ToggleField = {
  type: "toggle";
  label: string;
  field: keyof AdvancedTaxInputs & string;
  setter: keyof AdvancedTaxSetters & string;
};

type FieldDef = CurrencyField | ToggleField;

interface FieldGroupDef {
  label: string;
  fields: FieldDef[];
}

interface SectionDef {
  id: string;
  title: string;
  shortTitle: string;
  color: string;
  groups: FieldGroupDef[];
}

const SECTIONS: SectionDef[] = [
  {
    id: "income",
    title: "Assessable Income",
    shortTitle: "Income",
    color: "#6b9fcc",
    groups: [
      {
        label: "Employment & Passive",
        fields: [
          { type: "currency", label: "Salary and Wages", field: "salary", setter: "setSalary", min: 0, max: 500_000 },
          { type: "currency", label: "Rental Income", field: "rental", setter: "setRental", min: 0, max: 200_000 },
          { type: "currency", label: "Interest Income", field: "interest", setter: "setInterest", min: 0, max: 50_000 },
        ],
      },
      {
        label: "Dividends",
        fields: [
          { type: "currency", label: "Dividend Income (Excl. Franking)", field: "dividend", setter: "setDividend", min: 0, max: 100_000 },
          { type: "currency", label: "Franking Credits", field: "franking", setter: "setFranking", min: 0, max: 30_000 },
        ],
      },
      {
        label: "Capital Gains",
        fields: [
          { type: "currency", label: "Short-term (held < 12 months)", field: "capitalGainShort", setter: "setCapitalGainShort", min: 0, max: 500_000 },
          { type: "currency", label: "Long-term (held > 12 months)", field: "capitalGainLong", setter: "setCapitalGainLong", min: 0, max: 500_000 },
        ],
      },
    ],
  },
  {
    id: "deductions",
    title: "Allowable Deductions",
    shortTitle: "Deductions",
    color: "#c97070",
    groups: [
      {
        label: "Property & Work",
        fields: [
          { type: "currency", label: "Rental Property Deductions", field: "rentalDeductions", setter: "setRentalDeductions", min: 0, max: 200_000 },
          { type: "currency", label: "Work-Related Deductions", field: "workDeductions", setter: "setWorkDeductions", min: 0, max: 50_000 },
        ],
      },
    ],
  },
  {
    id: "adjustments",
    title: "Income Adjustments (HRI / MLS)",
    shortTitle: "Adjustments",
    color: "#bfa75a",
    groups: [
      {
        label: "Super & Benefits",
        fields: [
          { type: "currency", label: "Reportable Super (Salary Sacrifice)", field: "salSac", setter: "setSalSac", min: 0, max: 30_000 },
          { type: "currency", label: "Reportable Fringe Benefits (Grossed-Up)", field: "rfb", setter: "setRfb", min: 0, max: 50_000 },
        ],
      },
      {
        label: "HECS & Insurance",
        fields: [
          { type: "currency", label: "HELP/HECS Debt Balance", field: "hecsBal", setter: "setHecsBal", min: 0, max: 200_000 },
          { type: "toggle", label: "Private Health Insurance (Hospital Cover)", field: "phi", setter: "setPhi" },
          { type: "toggle", label: "Seniors Tax Offset (SAPTO)", field: "sapto", setter: "setSapto" },
        ],
      },
    ],
  },
];

// ── Aggregates ───────────────────────────────────

interface TabAggregate {
  total: number;
  hasValues: boolean;
  itemCount: number;
  filledCount: number;
}

function calculateTabAggregates(inputs: AdvancedTaxInputs): TabAggregate[] {
  return SECTIONS.map((section) => {
    let total = 0, filledCount = 0, itemCount = 0;
    section.groups.forEach((group) => {
      group.fields.forEach((f) => {
        itemCount++;
        if (f.type === "currency") {
          const value = inputs[f.field] as number;
          total += value;
          if (value > 0) filledCount++;
        } else if (f.type === "toggle") {
          if (inputs[f.field] as boolean) filledCount++;
        }
      });
    });
    return { total, hasValues: filledCount > 0, itemCount, filledCount };
  });
}

// ── Editable currency field ──────────────────────

function EditableField({
  label,
  value,
  min,
  max,
  onChange,
  color,
  touched,
  onTouch,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  color: string;
  touched: boolean;
  onTouch: () => void;
}) {
  const clampedCommit = useCallback(
    (parsed: number) => { onTouch(); onChange(Math.min(max, Math.max(min, parsed))); },
    [onChange, onTouch, min, max],
  );
  const parse = useCallback((d: string) => parseCurrency(d), []);
  const { editing, draft, inputRef, startEditing, commit, handleKeyDown, handleChange } =
    useEditableInput({ display: formatCurrencyShort(value), onCommit: clampedCommit, parse });

  const completed = touched || value > 0;

  return (
    <div
      className="flex items-center gap-3 py-[10px] pl-2"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      {/* Status dot */}
      <div
        className="h-2 w-2 shrink-0 rounded-full transition-colors duration-200"
        style={{ background: completed ? color : "rgba(255,255,255,0.08)" }}
      />

      {/* Label */}
      <span
        className="flex-1 text-[14px] leading-snug"
        style={{ color: completed ? "rgba(244,244,245,0.60)" : "rgba(244,244,245,0.30)" }}
      >
        {label}
      </span>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={editing ? draft : (completed ? formatCurrencyShort(value) : "—")}
        readOnly={!editing}
        onChange={handleChange}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onFocus={startEditing}
        onClick={startEditing}
        className="w-[90px] rounded-md bg-transparent px-2 py-1 text-right text-[15px] font-semibold tabular-nums outline-none transition-all duration-150"
        style={{
          color: completed ? "rgba(244,244,245,0.90)" : "rgba(244,244,245,0.25)",
          background: editing ? "rgba(255,255,255,0.06)" : "transparent",
          boxShadow: editing ? `0 0 0 1px ${color}` : "none",
          caretColor: color,
          cursor: "text",
        }}
      />
    </div>
  );
}

// ── Component ────────────────────────────────────

interface AdvancedColumnProps {
  inputs: AdvancedTaxInputs;
  setters: AdvancedTaxSetters;
}

export default function AdvancedColumn({ inputs, setters }: AdvancedColumnProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(() => new Set());
  const section = SECTIONS[activeTab];
  const aggregates = calculateTabAggregates(inputs);

  const markTouched = useCallback((field: string) => {
    setTouchedFields((prev) => { const next = new Set(prev); next.add(field); return next; });
  }, []);

  return (
    <GlassCard className="flex flex-1 min-h-0 flex-col" style={CARD_STYLE}>
      <div className="custom-scrollbar overflow-y-auto px-8 py-6">
        <span className="mb-8 block text-center text-[20px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.accent }}>
          Income &amp; Deductions
        </span>

        {/* Merged tab + value strip */}
        <div className="mb-6 flex gap-[3px] rounded-[10px] p-[3px]" style={{ background: "rgba(255,255,255,0.03)" }}>
          {SECTIONS.map((s, i) => {
            const isActive = i === activeTab;
            const agg = aggregates[i];
            return (
              <button
                key={s.id}
                onClick={() => setActiveTab(i)}
                className="flex flex-1 flex-col items-center rounded-[8px] py-[10px] px-3 transition-all duration-200"
                style={{
                  background: isActive ? s.color : "transparent",
                }}
              >
                <span
                  className="text-[12px] font-semibold tracking-[0.04em]"
                  style={{
                    color: isActive ? "#111215" : mix(s.color, 55),
                  }}
                >
                  {s.shortTitle}
                </span>
                <span
                  className="mt-[2px] text-[17px] font-semibold tabular-nums"
                  style={{
                    color: isActive
                      ? "#111215"
                      : agg.hasValues
                        ? mix(s.color, 50)
                        : "rgba(244,244,245,0.20)",
                  }}
                >
                  {formatCurrencyShort(agg.total)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Progress dots below tab strip */}
        <div className="-mt-4 mb-6 flex gap-[3px] px-[3px]">
          {SECTIONS.map((s, i) => {
            const agg = aggregates[i];
            return (
              <div key={s.id} className="flex flex-1 items-center justify-center gap-[5px]" style={{ height: 14 }}>
                {agg.filledCount === agg.itemCount && agg.filledCount > 0 ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.9 }}>
                    <circle cx="7" cy="7" r="6.5" stroke={s.color} strokeWidth="1" fill="none" opacity={0.35} />
                    <path d="M4 7.2 L6.2 9.4 L10 4.8" stroke={s.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                ) : (
                  Array.from({ length: agg.itemCount }, (_, j) => (
                    <div
                      key={j}
                      className="h-[6px] w-[6px] rounded-full transition-colors duration-200"
                      style={{
                        background: j < agg.filledCount
                          ? s.color
                          : "rgba(255,255,255,0.10)",
                      }}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>

        {/* Grouped fields */}
        <div className="flex flex-col gap-1">
          {section.groups.map((group, groupIdx) => (
            <div
              key={group.label}
              className="rounded-[8px] px-1 py-2"
              style={{
                borderLeft: `4px solid ${section.color}`,
                background: groupIdx % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
              }}
            >
              <div
                className="mb-1 px-3 text-[12px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: section.color }}
              >
                {group.label}
              </div>
              {group.fields.map((f) =>
                f.type === "currency" ? (
                  <EditableField
                    key={f.field}
                    label={f.label}
                    value={inputs[f.field] as number}
                    min={f.min}
                    max={f.max}
                    onChange={setters[f.setter] as (v: number) => void}
                    color={section.color}
                    touched={touchedFields.has(f.field)}
                    onTouch={() => markTouched(f.field)}
                  />
                ) : (
                  <div key={f.field} className="px-3 py-[10px]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <Toggle
                      label={f.label}
                      checked={inputs[f.field] as boolean}
                      onChange={setters[f.setter] as (v: boolean) => void}
                      reverse
                    />
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
