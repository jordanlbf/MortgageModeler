import AmortisationView from "@/components/amortisation/AmortisationView";

// Page background uses t.bg.page from @/lib/theme.
// Hardcoded here because Tailwind needs static class values.

export default function Home() {
  return (
    <div className="min-h-screen bg-[#111215]">
      <AmortisationView />
    </div>
  );
}
