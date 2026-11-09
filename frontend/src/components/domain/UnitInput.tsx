"use client";

import { forwardRef, useState } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";

/**
 * A compact number field with a unit after it ("6.2 %", "30 yrs"), the partner
 * of `MoneyInput`. Keeps what you type while focused and updates on every
 * valid keystroke; on blur it clamps to `min`–`max` and tidies to `decimals`.
 * Arrow keys step by `step`.
 */
const UnitInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "variant" | "min" | "max" | "step"> & {
    value: number;
    onValueChange: (n: number) => void;
    unit: string;
    min: number;
    max: number;
    step?: number;
    decimals?: number;
  }
>(function UnitInput({ value, onValueChange, unit, min, max, step = 1, decimals = 0, className, onBlur, onKeyDown, ...props }, ref) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const tidy = (n: number) => Number(n.toFixed(decimals));
  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <Input
        ref={ref}
        variant="filled"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={draft ?? String(tidy(value))}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = parseFloat(e.target.value);
          if (Number.isFinite(n) && n >= min && n <= max) onValueChange(n);
        }}
        onBlur={(e) => {
          const n = parseFloat(e.target.value);
          if (Number.isFinite(n)) onValueChange(tidy(clamp(n)));
          setDraft(null);
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            setDraft(null);
            onValueChange(tidy(clamp(value + (e.key === "ArrowUp" ? step : -step))));
          }
        }}
        className="h-9 w-full py-0 pr-11 pl-3 text-right text-[14px] font-semibold tabular-nums"
        {...props}
      />
      <span aria-hidden="true" className="pointer-events-none absolute right-3 text-[12px] font-medium text-fg-tertiary">{unit}</span>
    </span>
  );
});

export default UnitInput;
