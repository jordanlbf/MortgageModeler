"use client";

import CashflowScreen from "@/components/cashflow/CashflowScreen";
import PurchaseCostsView from "@/components/purchase-costs/PurchaseCostsView";
import TaxView from "@/components/tax/TaxView";
import { CASHFLOW_OUTPUT, CASHFLOW_WIZARD, PURCHASE_COSTS, TAX } from "./screens-sample";

/*
 * The polished screens, rendered by the app's own components on generic
 * sample data (screens-sample.ts) instead of the API. Nothing here is styled:
 * to change a screen, edit its components (src/components/cashflow,
 * src/components/purchase-costs, src/components/tax) or the layers below, and the app follows.
 */

export function CashflowWizardScreenSection() {
  return <CashflowScreen source={CASHFLOW_WIZARD} />;
}

export function CashflowOutputScreenSection() {
  return <CashflowScreen source={CASHFLOW_OUTPUT} />;
}

export function PurchaseCostsScreenSection() {
  return <PurchaseCostsView source={PURCHASE_COSTS} />;
}

export function TaxScreenSection() {
  return <TaxView source={TAX} />;
}
