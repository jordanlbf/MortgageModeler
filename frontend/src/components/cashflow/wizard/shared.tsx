import { useId, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDollarsSigned } from "@/lib/formatters";

export const currencyInput = (setter: (v: string) => void) => ({
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setter(raw ? formatDollarsSigned(Number(raw)) : "");
  },
});

export function InputField({
  label,
  hint,
  suffix,
  id,
  className,
  type = "text",
  ...inputProps
}: {
  label: string;
  hint?: string;
  /** Right-aligned unit shown inside the field (e.g. "%"). */
  suffix?: string;
} & Omit<React.ComponentProps<typeof Input>, "variant">) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const input = (
    <Input
      id={inputId}
      type={type}
      variant="filled"
      className={cn(suffix && "pr-10 w-full", className)}
      {...inputProps}
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <Label variant="field" htmlFor={inputId}>{label}</Label>
        {hint && <span className="text-[10px] text-fg-muted">{hint}</span>}
      </div>
      {suffix ? (
        <div className="relative">
          {input}
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-fg-tertiary pointer-events-none">
            {suffix}
          </span>
        </div>
      ) : (
        input
      )}
    </div>
  );
}

export type EstimateMode = "quick" | "custom";

/**
 * Quick estimate / Custom switch with its two panes (Costs, Rental and
 * Depreciation steps). Also the step's outer column.
 */
export function ModeTabs({
  value,
  onValueChange,
  quick,
  custom,
}: {
  value: EstimateMode;
  onValueChange: (mode: EstimateMode) => void;
  quick: ReactNode;
  custom: ReactNode;
}) {
  return (
    <Tabs
      variant="track"
      value={value}
      onValueChange={(v) => onValueChange(v as EstimateMode)}
      className="flex flex-col gap-6 max-w-lg"
    >
      <TabsList aria-label="Entry mode">
        <TabsTrigger value="quick">Quick estimate</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
      </TabsList>
      <TabsContent value="quick">{quick}</TabsContent>
      <TabsContent value="custom">{custom}</TabsContent>
    </Tabs>
  );
}

export function EditableRow({
  label,
  value,
  onChange,
  placeholder,
  isPercent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isPercent?: boolean;
}) {
  const inputId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (isPercent) {
      onChange(raw.replace(/[^\d.]/g, ""));
      return;
    }
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) {
      onChange("");
      return;
    }
    onChange(`$${parseInt(digits, 10).toLocaleString()}`);
  };

  return (
    <div className="flex items-center justify-between">
      <Label variant="bare" htmlFor={inputId} className="text-sm text-fg-muted text-left">
        {label}
      </Label>
      <div className="flex items-baseline justify-end w-28">
        <Input
          id={inputId}
          type="text"
          variant="underline"
          value={value || ""}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full text-right tabular-nums"
        />
        {isPercent && <span className="text-sm text-fg-muted ml-1">%</span>}
      </div>
    </div>
  );
}

/** Whole-row clickable checkbox with a 13px caption. */
export function CheckboxField({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Label variant="bare" className="flex items-center gap-3 cursor-pointer text-[13px] text-fg-secondary w-fit">
      <Checkbox variant="md" checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      {children}
    </Label>
  );
}
