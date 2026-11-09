"use client";

import { forwardRef, useState } from "react";
import { cn } from "cn";
import { formatDollars } from "@/lib/formatters";
import { Input } from "@/components/ui/input";
import { parseAmount } from "./AmountSection";

/**
 * A compact dollar field for a list of amounts (tax income lines, deductions).
 * Shows "$28,600" at rest. While focused it keeps what you type, so shorthand
 * like "28.6k" works, and updates on every keystroke. Empty means $0.
 */
const MoneyInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "variant"> & {
    value: number;
    onValueChange: (n: number) => void;
  }
>(function MoneyInput({ value, onValueChange, className, onBlur, onKeyDown, ...props }, ref) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value > 0 ? formatDollars(value) : "");
  return (
    <Input
      ref={ref}
      variant="filled"
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      placeholder="$0"
      value={shown}
      onChange={(e) => {
        const n = parseAmount(e.target.value);
        if (n !== null) onValueChange(n);
        // Plain numbers reformat as you type ("28,600"); shorthand like "28.6k" stays until blur.
        setDraft(/^[\s$\d,]*$/.test(e.target.value) ? null : e.target.value);
      }}
      onBlur={(e) => {
        setDraft(null);
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === "Enter" && !e.defaultPrevented) e.currentTarget.blur();
      }}
      className={cn("h-9 px-3 py-0 text-right text-[14px] font-semibold", className)}
      {...props}
    />
  );
});

export default MoneyInput;
