"use client";

import type { CashflowState } from "@/hooks/useCashflowState";
import CostsBreakdown from "./costs/CostsBreakdown";

export default function CostsStep({ s }: { s: CashflowState }) {
  return <CostsBreakdown s={s} />;
}
