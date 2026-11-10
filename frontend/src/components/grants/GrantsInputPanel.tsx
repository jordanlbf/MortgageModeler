"use client";

import { useId } from "react";
import { formatDollars, formatDollarsShort } from "@/lib/formatters";
import { GRANT_STATES, type GrantPropertyType, type GrantState, type GrantsState } from "@/hooks/useGrantsState";
import SectionCard from "@/components/patterns/cards/SectionCard";
import { AmountSection } from "@/components/domain/AmountSection";
import SwitchRow from "@/components/domain/SwitchRow";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

const PROPERTY_TYPES: { value: GrantPropertyType; label: string }[] = [
  { value: "existing", label: "Existing home" },
  { value: "new", label: "New build" },
  { value: "off-the-plan", label: "Off the plan" },
  { value: "land", label: "Vacant land" },
];

// Past every scheme's price cap.
const PRICE_MAX = 2_000_000;

const HELP = {
  income: "Before-tax income, a year.",
  singleParent: "The Family Home Guarantee is for single parents and legal guardians.",
  owned: "The ACT Home Buyer Concession needs you not to have owned property in Australia in the last 2 years.",
};

/**
 * "Your purchase", in the order you fill it in: state and property type (as
 * on Purchase Costs), then you, then income (buying as a couple adds the
 * partner's) and the price on a slider last. Federal schemes are always included.
 */
export default function GrantsInputPanel({ g }: { g: GrantsState }) {
  const id = useId();
  const { inputs: i, set } = g;

  return (
    <SectionCard flush title="Your purchase" titleId={`${id}-title`} role="group" aria-labelledby={`${id}-title`}>
      <div className="flex flex-col gap-4 px-6 pb-5">
        <div className="flex items-center justify-between gap-4">
          <Label variant="bare" htmlFor={`${id}-state`} className="text-[13.5px] text-fg-secondary">State</Label>
          <NativeSelect
            variant="form"
            id={`${id}-state`}
            value={i.state ?? ""}
            onChange={(e) => set("state", (e.target.value || null) as GrantState | null)}
            className="h-8 w-[88px] shrink-0 rounded-lg pr-7 pl-3 text-[13px] font-medium"
          >
            <NativeSelectOption variant="form" value="" disabled>—</NativeSelectOption>
            {GRANT_STATES.map((s) => (
              <NativeSelectOption variant="form" key={s} value={s}>{s}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        {/* At most one type is on: switching one on turns the others off. */}
        <div role="group" aria-label="Property type" className="flex flex-col gap-4">
          {PROPERTY_TYPES.map((t) => (
            <SwitchRow
              key={t.value}
              id={`${id}-type-${t.value}`}
              label={t.label}
              checked={i.propertyType === t.value}
              onChange={(on) => set("propertyType", on ? t.value : null)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border-subtle px-6 py-5">
        <SwitchRow
          id={`${id}-occ`}
          label="Living in it"
          checked={i.ownerOcc}
          onChange={(v) => {
            set("ownerOcc", v);
            // First home schemes need you to live in it.
            if (!v) set("firstHome", false);
          }}
        />
        <SwitchRow
          id={`${id}-first`}
          label="First home buyer"
          checked={i.firstHome}
          onChange={(v) => set("firstHome", v)}
          disabled={!i.ownerOcc}
          note="Only for a home you'll live in"
        />
        <SwitchRow
          id={`${id}-couple`}
          label="Buying as a couple"
          checked={i.couple}
          onChange={(v) => {
            set("couple", v);
            if (v) set("singleParent", false);
          }}
        />
        <SwitchRow
          id={`${id}-single`}
          label="Single parent"
          help={HELP.singleParent}
          checked={i.singleParent}
          onChange={(v) => set("singleParent", v)}
          disabled={i.couple}
          note="Not when buying as a couple"
        />
        {i.state === "ACT" && (
          <SwitchRow
            id={`${id}-owned`}
            label="Owned property in last 2 yrs"
            help={HELP.owned}
            checked={i.ownedRecently}
            onChange={(v) => set("ownedRecently", v)}
          />
        )}
      </div>

      <AmountSection
        id={`${id}-income`}
        label={i.couple ? "Your income" : "Income"}
        value={i.income}
        onChange={(n) => set("income", n)}
        inputStep={5_000}
        help={HELP.income}
      />
      {i.couple && (
        <AmountSection id={`${id}-partner`} label="Partner's income" value={i.partnerIncome} onChange={(n) => set("partnerIncome", n)} inputStep={5_000} divider={false} />
      )}

      <AmountSection
        id={`${id}-price`}
        label="Purchase price"
        value={i.price}
        onChange={(n) => set("price", n)}
        scale={{
          value: i.price,
          min: 0,
          max: PRICE_MAX,
          step: 10_000,
          onChange: (n) => set("price", n),
          tick: formatDollarsShort,
          valueText: formatDollars(i.price) || "$0",
        }}
        inputStep={10_000}
      />
    </SectionCard>
  );
}
