import PageHeader from "@/components/layout/PageHeader";
import AmortisationView from "@/components/amortisation/AmortisationView";

export default function AmortisationPage() {
  return (
    <>
      <PageHeader
        title="Amortisation"
        subtitle="12 Example Street, Clayfield, QLD 4011"
      />
      <AmortisationView />
    </>
  );
}
