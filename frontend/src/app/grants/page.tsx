import PageHeader from "@/components/layout/PageHeader";
import GrantsView from "@/components/grants/GrantsView";

export default function GrantsPage() {
  return (
    <>
      <PageHeader
        title="Government Grants"
        subtitle="12 Example Street, Clayfield, QLD 4011"
      />
      <GrantsView />
    </>
  );
}
