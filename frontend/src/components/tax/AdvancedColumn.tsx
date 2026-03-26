import { t, mix } from "@/lib/theme";
import { formatCurrencyShort } from "@/lib/formatters";
import { parseCurrency } from "@/lib/constants";
import type { AdvancedTaxInputs, AdvancedTaxSetters } from "@/hooks/useAdvancedTaxState";
import GlassCard from "@/components/ui/GlassCard";
import CompactSlider from "@/components/tax/CompactSlider";
import Toggle from "@/components/ui/Toggle";

const CARD_STYLE = { borderTopWidth: 3, borderTopColor: t.accentBorder, background: t.bg.cardElevated };

// ── Field definitions ────────────────────────────

type SliderField = {
  type: "slider";
  label: string;
  field: keyof AdvancedTaxInputs & string;
  setter: keyof AdvancedTaxSetters & string;
  min: number;
  max: number;
  step: number;
};

type ToggleField = {
  type: "toggle";
  label: string;
  field: keyof AdvancedTaxInputs & string;
  setter: keyof AdvancedTaxSetters & string;
};

type FieldDef = SliderField | ToggleField;

interface SectionDef {
  title: string;
  fields: FieldDef[];
}

const SECTIONS: SectionDef[] = [
  {
    title: "Assessable Income",
    fields: [
      { type: "slider", label: "Salary and Wages", field: "salary", setter: "setSalary", min: 0, max: 500_000, step: 1000 },
      { type: "slider", label: "Rental Income", field: "rental", setter: "setRental", min: 0, max: 200_000, step: 1000 },
      { type: "slider", label: "Interest Income", field: "interest", setter: "setInterest", min: 0, max: 50_000, step: 500 },
      { type: "slider", label: "Dividend Income (Excl. Franking Credits)", field: "dividend", setter: "setDividend", min: 0, max: 100_000, step: 500 },
      { type: "slider", label: "Franking Credits", field: "franking", setter: "setFranking", min: 0, max: 30_000, step: 100 },
      { type: "slider", label: "Capital Gains (Pre-Discount)", field: "capitalGain", setter: "setCapitalGain", min: 0, max: 500_000, step: 1000 },
    ],
  },
  {
    title: "Allowable Deductions",
    fields: [
      { type: "slider", label: "Rental Property Deductions", field: "rentalDeductions", setter: "setRentalDeductions", min: 0, max: 200_000, step: 1000 },
      { type: "slider", label: "Work-Related Deductions", field: "workDeductions", setter: "setWorkDeductions", min: 0, max: 50_000, step: 500 },
      { type: "toggle", label: "CGT Discount (50%) Applied", field: "cgtDiscount", setter: "setCgtDiscount" },
    ],
  },
  {
    title: "Income Adjustments (HRI / MLS)",
    fields: [
      { type: "slider", label: "Reportable Super Contributions (Salary Sacrifice)", field: "salSac", setter: "setSalSac", min: 0, max: 30_000, step: 500 },
      { type: "slider", label: "Reportable Fringe Benefits (Grossed-Up)", field: "rfb", setter: "setRfb", min: 0, max: 50_000, step: 500 },
      { type: "slider", label: "HELP/HECS Debt Balance", field: "hecsBal", setter: "setHecsBal", min: 0, max: 200_000, step: 1000 },
      { type: "toggle", label: "Private Health Insurance (Hospital Cover)", field: "phi", setter: "setPhi" },
    ],
  },
];

// ── Component ────────────────────────────────────

interface AdvancedColumnProps {
  inputs: AdvancedTaxInputs;
  setters: AdvancedTaxSetters;
}

export default function AdvancedColumn({ inputs, setters }: AdvancedColumnProps) {
  return (
    <GlassCard className="flex flex-1 min-h-0 flex-col" style={CARD_STYLE}>
      <div className="custom-scrollbar overflow-y-auto px-8 py-6">
        <span className="mb-4 block text-center text-[19px] font-semibold uppercase tracking-[0.14em]" style={{ color: mix(t.accent, 50) }}>
          Income &amp; Deductions
        </span>
        {SECTIONS.map((section, i) => (
          <div
            key={section.title}
            className={i > 0 ? "mt-4 pt-4" : undefined}
            style={i > 0 ? { borderTop: `1px solid ${t.border.default}` } : undefined}
          >
            <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted/30 mb-3">
              {section.title}
            </div>
            <div className="flex flex-col gap-2">
              {section.fields.map((f) =>
                f.type === "slider" ? (
                  <CompactSlider
                    key={f.field}
                    label={f.label}
                    value={inputs[f.field] as number}
                    display={formatCurrencyShort(inputs[f.field] as number)}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    onChange={setters[f.setter] as (v: number) => void}
                    editable
                    parseDisplay={parseCurrency}
                  />
                ) : (
                  <Toggle
                    key={f.field}
                    label={f.label}
                    checked={inputs[f.field] as boolean}
                    onChange={setters[f.setter] as (v: boolean) => void}
                    reverse
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
