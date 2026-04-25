import PageHeader from "@/components/layout/PageHeader";
import TaxView from "@/components/tax/TaxView";

export default function TaxPage() {
  return (
    <>
      <PageHeader
        title="Tax Calculator"
        subtitle="12 Example Street, Clayfield, QLD 4011"
      />
      <TaxView />
    </>
  );
}
