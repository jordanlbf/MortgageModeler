import { formatDollarsSigned } from "@/lib/formatters";

export const currencyInput = (setter: (v: string) => void) => ({
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setter(raw ? formatDollarsSigned(Number(raw)) : "");
  },
});
