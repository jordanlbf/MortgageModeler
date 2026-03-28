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

interface SectionDef {
  title: string;
  color: string;
  fields: FieldDef[];
}

const SECTIONS: SectionDef[] = [
  {
    title: "Assessable Income",
    color: t.accent,
    fields: [
      { type: "currency", label: "Salary and Wages", field: "salary", setter: "setSalary", min: 0, max: 500_000 },
      { type: "currency", label: "Rental Income", field: "rental", setter: "setRental", min: 0, max: 200_000 },
      { type: "currency", label: "Interest Income", field: "interest", setter: "setInterest", min: 0, max: 50_000 },
      { type: "currency", label: "Dividend Income (Excl. Franking Credits)", field: "dividend", setter: "setDividend", min: 0, max: 100_000 },
      { type: "currency", label: "Franking Credits", field: "franking", setter: "setFranking", min: 0, max: 30_000 },
      { type: "currency", label: "Capital Gains (held < 12 months)", field: "capitalGainShort", setter: "setCapitalGainShort", min: 0, max: 500_000 },
      { type: "currency", label: "Capital Gains (held > 12 months)", field: "capitalGainLong", setter: "setCapitalGainLong", min: 0, max: 500_000 },
    ],
  },
  {
    title: "Allowable Deductions",
    color: "#60a5fa",
    fields: [
      { type: "currency", label: "Rental Property Deductions", field: "rentalDeductions", setter: "setRentalDeductions", min: 0, max: 200_000 },
      { type: "currency", label: "Work-Related Deductions", field: "workDeductions", setter: "setWorkDeductions", min: 0, max: 50_000 },
    ],
  },
  {
    title: "Income Adjustments (HRI / MLS)",
    color: "#a78bfa",
    fields: [
      { type: "currency", label: "Reportable Super (Salary Sacrifice)", field: "salSac", setter: "setSalSac", min: 0, max: 30_000 },
      { type: "currency", label: "Reportable Fringe Benefits (Grossed-Up)", field: "rfb", setter: "setRfb", min: 0, max: 50_000 },
      { type: "currency", label: "HELP/HECS Debt Balance", field: "hecsBal", setter: "setHecsBal", min: 0, max: 200_000 },
      { type: "toggle", label: "Private Health Insurance (Hospital Cover)", field: "phi", setter: "setPhi" },
    ],
  },
];

// ── Editable currency field ──────────────────────

function EditableField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const clampedCommit = useCallback(
    (parsed: number) => onChange(Math.min(max, Math.max(min, parsed))),
    [onChange, min, max],
  );
  const parse = useCallback((d: string) => parseCurrency(d), []);
  const { editing, draft, inputRef, startEditing, commit, handleKeyDown, handleChange } =
    useEditableInput({ display: formatCurrencyShort(value), onCommit: clampedCommit, parse });

  return (
    <div
      className="flex items-center justify-between py-[10px]"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <span className="text-[15px] text-muted/50">{label}</span>
      <input
        ref={inputRef}
        type="text"
        inputMode={editing ? "decimal" : "none"}
        value={editing ? draft : formatCurrencyShort(value)}
        readOnly={!editing}
        onChange={handleChange}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onClick={!editing ? startEditing : undefined}
        onFocus={startEditing}
        className={`w-[100px] bg-transparent text-right text-[16px] font-semibold tabular-nums outline-none ${
          editing ? "text-foreground cursor-text" : "text-foreground cursor-text hover:brightness-125"
        }`}
        style={{ caretColor: t.accent }}
      />
    </div>
  );
}

// ── Component ────────────────────────────────────

interface AdvancedColumnProps {
  inputs: AdvancedTaxInputs;
  setters: AdvancedTaxSetters;
}

const TAB_LABELS = SECTIONS.map((s) => s.title.replace(/\s*\(.*\)/, ""));

export default function AdvancedColumn({ inputs, setters }: AdvancedColumnProps) {
  const [activeTab, setActiveTab] = useState(0);
  const section = SECTIONS[activeTab];

  return (
    <GlassCard className="flex flex-1 min-h-0 flex-col" style={CARD_STYLE}>
      <div className="custom-scrollbar overflow-y-auto px-8 py-6">
        <span className="mb-8 block text-center text-[20px] font-semibold uppercase tracking-[0.14em]" style={{ color: mix(t.accent, 50) }}>
          Income &amp; Deductions
        </span>

        {/* Tab bar */}
        <div className="mb-8 flex gap-[2px] rounded-[10px] p-[3px]" style={{ background: "rgba(255,255,255,0.03)" }}>
          {TAB_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => setActiveTab(i)}
              className="flex-1 rounded-[8px] py-2 px-4 text-[13px] font-semibold tracking-[0.04em] transition-all duration-200"
              style={{
                background: i === activeTab ? "rgba(45,212,191,0.12)" : "transparent",
                color: i === activeTab ? t.accent : "rgba(244,244,245,0.50)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Active section */}
        <div
          className="pl-[14px]"
          style={{ borderLeft: `3px solid ${section.color}` }}
        >
          <div
            className="mb-2 text-[13px] font-bold uppercase"
            style={{ letterSpacing: "0.16em", color: section.color }}
          >
            {section.title}
          </div>
          {section.fields.map((f) =>
            f.type === "currency" ? (
              <EditableField
                key={f.field}
                label={f.label}
                value={inputs[f.field] as number}
                min={f.min}
                max={f.max}
                onChange={setters[f.setter] as (v: number) => void}
              />
            ) : (
              <div key={f.field} className="py-[7px]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
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
      </div>
    </GlassCard>
  );
}
