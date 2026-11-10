"use client";

import InfoTip from "@/components/patterns/blocks/InfoTip";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * A setting row: label (with optional help) on the left, a switch on the
 * right; the whole row toggles it. When `disabled`, the row dims and `note`
 * says why, to screen readers only. Used by Purchase Costs and Grants.
 */
export default function SwitchRow({
  id,
  label,
  checked,
  onChange,
  disabled,
  note,
  help,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  note?: string;
  help?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 transition-opacity duration-200 ${disabled ? "opacity-45" : ""}`}>
      <div className="flex items-center gap-1">
        <Label variant="bare" htmlFor={id} className={`text-[13.5px] text-fg-secondary ${disabled ? "cursor-default" : "cursor-pointer"}`}>
          {label}
          {/* Inside the label, so it's read with the switch's name. */}
          {disabled && note && <span className="sr-only">, {note}</span>}
        </Label>
        {help && <InfoTip label={label} id={`${id}-help`}>{help}</InfoTip>}
      </div>
      <Switch
        variant="accent"
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-describedby={help ? `${id}-help` : undefined}
      />
    </div>
  );
}
