"use client";

import type { CashflowState } from "@/hooks/useCashflowState";
import DepSchedule from "./depreciation/DepSchedule";

export default function DepreciationStep({ s }: { s: CashflowState }) {
  return <DepSchedule s={s} />;
}
