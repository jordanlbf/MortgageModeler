import type { ReactNode } from "react";
import Input from "@/components/ui/Input";
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
  ...inputProps
}: {
  label: string;
  hint?: string;
  suffix?: string;
} & React.ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-fg-secondary">{label}</label>
        {hint && <span className="text-[10px] text-fg-muted">{hint}</span>}
      </div>
      <Input suffix={suffix} {...inputProps} />
    </div>
  );
}

export function ModeToggle({ children }: { children: ReactNode }) {
  return <div className="flex gap-1 p-1 rounded-lg bg-zinc-900/50 w-fit">{children}</div>;
}

export function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
        active ? "bg-zinc-800 text-fg-primary" : "text-fg-muted hover:text-fg-secondary"
      }`}
    >
      {children}
    </button>
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
      <span className="text-sm text-fg-muted text-left">{label}</span>
      <div className="flex items-baseline justify-end w-28">
        <input
          type="text"
          value={value || ""}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full text-right text-sm tabular-nums bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-brand focus:outline-none py-1 text-fg-secondary placeholder:text-fg-muted/50 transition-colors"
        />
        {isPercent && <span className="text-sm text-fg-muted ml-1">%</span>}
      </div>
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer text-[13px] text-fg-secondary w-fit">
      <input
        type="checkbox"
        className="absolute opacity-0 pointer-events-none peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="w-[18px] h-[18px] border border-strong rounded bg-transparent transition-all duration-150 shrink-0 relative peer-checked:bg-brand peer-checked:border-brand peer-checked:after:content-[''] peer-checked:after:absolute peer-checked:after:top-[3px] peer-checked:after:left-[6px] peer-checked:after:w-1 peer-checked:after:h-2 peer-checked:after:border-brand-contrast peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:rotate-45" />
      {children}
    </label>
  );
}
