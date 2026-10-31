"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EditableValue from "@/components/domain/EditableValue";
import SliderField from "@/components/domain/SliderField";
import { formatCurrency, formatDollars, parseCurrencyInput } from "@/lib/formatters";
import VariantRow from "../_components/VariantRow";

const VARIANTS = ["default", "form", "filled", "bar", "underline"] as const;

/** Value + `$` prefix: the pattern the money fields use. */
function Currency({ id, value, invalid }: { id: string; value: string; invalid?: boolean }) {
  return (
    <span className="relative inline-flex w-[200px] items-center">
      <span className="pointer-events-none absolute left-3 text-[15px] font-medium text-fg-tertiary" aria-hidden="true">$</span>
      <Input id={id} variant="form" inputMode="decimal" aria-label="Purchase price" aria-invalid={invalid || undefined} defaultValue={value} className="pl-7" />
    </span>
  );
}

/** Value + `%` suffix. */
function Percent({ id, value }: { id: string; value: string }) {
  return (
    <span className="relative inline-flex w-[140px] items-center">
      <Input id={id} variant="form" inputMode="decimal" aria-label="Interest rate" defaultValue={value} className="pr-8" />
      <span className="pointer-events-none absolute right-3 text-[15px] font-medium text-fg-tertiary" aria-hidden="true">%</span>
    </span>
  );
}

export default function InputsSection() {
  const [rate, setRate] = useState(6.14);
  const [price, setPrice] = useState(650_000);

  return (
    <>
      {VARIANTS.map((v) => (
        <VariantRow key={v} label={`Input variant="${v}" · empty / filled / error / disabled`}>
          <Input variant={v} aria-label={`Suburb (${v}, empty)`} placeholder="Clayfield" className="w-[180px]" />
          <Input variant={v} aria-label={`Suburb (${v}, filled)`} defaultValue="Indooroopilly" className="w-[180px]" />
          <Input variant={v} aria-label={`Suburb (${v}, error)`} aria-invalid defaultValue="Brisbane 9999" className="w-[180px]" />
          <Input variant={v} aria-label={`Suburb (${v}, disabled)`} disabled defaultValue="Toowoomba" className="w-[180px]" />
        </VariantRow>
      ))}
      <VariantRow label='variant="ghost" (click-to-edit)'>
        <Input variant="ghost" aria-label="Loan amount (ghost)" defaultValue="$712,400" className="w-[140px] text-[15px] tabular-nums" />
        <Input
          variant="ghost"
          aria-label="Loan amount (ghost, editing)"
          data-editing="true"
          defaultValue="712400"
          className="w-[140px] rounded-md px-2 text-[15px] tabular-nums [--input-accent:var(--color-brand)]"
        />
      </VariantRow>
      <VariantRow label="currency ($ prefix) · $0 / $1,247 / $1,234,567.89 / error">
        <Currency id="ks-cur-0" value="0" />
        <Currency id="ks-cur-1" value="1,247" />
        <Currency id="ks-cur-2" value="1,234,567.89" />
        <Currency id="ks-cur-3" value="-47,382" invalid />
      </VariantRow>
      <VariantRow label="percent (% suffix) · 0 / 4.2 / 127.3">
        <Percent id="ks-pct-0" value="0" />
        <Percent id="ks-pct-1" value="4.2" />
        <Percent id="ks-pct-2" value="127.3" />
      </VariantRow>
      <VariantRow label='password (variant="form")'>
        <Input variant="form" type="password" aria-label="Password" defaultValue="correct-horse-battery" className="w-[220px]" />
      </VariantRow>
      <VariantRow label="with label and helper text">
        <div className="flex w-[260px] flex-col gap-1.5">
          <Label variant="form" htmlFor="ks-helper">Deposit</Label>
          <Input id="ks-helper" variant="form" aria-describedby="ks-helper-text" defaultValue="130,000" />
          <span id="ks-helper-text" className="text-[12px] text-fg-tertiary">20% of the price avoids LMI.</span>
        </div>
        <div className="flex w-[260px] flex-col gap-1.5">
          <Label variant="form" htmlFor="ks-helper-err">Deposit</Label>
          <Input id="ks-helper-err" variant="form" aria-invalid aria-describedby="ks-helper-err-text" defaultValue="1,400,000" />
          <span id="ks-helper-err-text" className="text-[12px] text-data-negative">Deposit can&apos;t exceed the purchase price.</span>
        </div>
      </VariantRow>
      <VariantRow label="EditableValue (domain)">
        <EditableValue label="Monthly repayment" display={formatCurrency(2_843.17)} parse={parseCurrencyInput} onCommit={() => {}} className="text-[22px] font-semibold tabular-nums" />
      </VariantRow>
      <VariantRow label="SliderField (domain)">
        <div className="w-[260px]">
          <SliderField label="Interest rate" value={rate} display={`${rate.toFixed(2)}%`} min={2} max={12} step={0.01} onChange={setRate} />
        </div>
        <div className="w-[260px]">
          <SliderField
            label="Purchase price"
            value={price}
            display={formatDollars(price)}
            min={200_000}
            max={3_000_000}
            step={5_000}
            onChange={setPrice}
            editable
            parseDisplay={parseCurrencyInput}
            accent="var(--color-data-warning)"
          />
        </div>
      </VariantRow>
    </>
  );
}
