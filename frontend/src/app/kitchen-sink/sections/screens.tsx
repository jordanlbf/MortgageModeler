"use client";

import AmortisationView from "@/components/amortisation/AmortisationView";
import CashflowScreen from "@/components/cashflow/CashflowScreen";
import GrantsView from "@/components/grants/GrantsView";
import PurchaseCostsView from "@/components/purchase-costs/PurchaseCostsView";
import TaxView from "@/components/tax/TaxView";
import { AMORTISATION_OFFSET, CASHFLOW_OUTPUT, CASHFLOW_WIZARD, GRANTS, PURCHASE_COSTS, TAX } from "./screens-sample";

/*
 * The polished screens, rendered by the app's own components on generic
 * sample data (screens-sample.ts) instead of the API. Nothing here is styled:
 * to change a screen, edit its components (src/components/cashflow,
 * purchase-costs, tax, amortisation, grants) or the layers below, and the app follows.
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

export function AmortisationScreenSection() {
  return <AmortisationView source={AMORTISATION_OFFSET} />;
}

export function GrantsScreenSection() {
  return <GrantsView source={GRANTS} />;
}
