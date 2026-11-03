"use client";

import type { CashflowState } from "@/hooks/useCashflowState";
import RentalWaterfall from "./rental/RentalWaterfall";

export default function RentalStep({ s }: { s: CashflowState }) {
  return <RentalWaterfall s={s} />;
}
