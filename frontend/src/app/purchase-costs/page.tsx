import PageHeader from "@/components/layout/PageHeader";
import PurchaseCostsView from "@/components/purchase-costs/PurchaseCostsView";

export default function PurchaseCostsPage() {
  return (
    <>
      <PageHeader
        title="Purchase Costs"
        subtitle="12 Example Street, Clayfield, QLD 4011"
      />
      <PurchaseCostsView />
    </>
  );
}
