import { formatDollarsSigned } from "@/lib/formatters";

export const INPUT_CLS =
  "py-3.5 px-4 bg-transparent border border-border rounded-xl text-foreground font-[inherit] text-base font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-accent/40";

export const currencyInput = (setter: (v: string) => void) => ({
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setter(raw ? formatDollarsSigned(Number(raw)) : "");
  },
});
