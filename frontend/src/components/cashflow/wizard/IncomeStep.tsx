"use client";

import type { CashflowState } from "@/hooks/useCashflowState";
import IncomeSliders from "./income/IncomeSliders";

export default function IncomeStep({ s }: { s: CashflowState }) {
  return <IncomeSliders s={s} />;
}
