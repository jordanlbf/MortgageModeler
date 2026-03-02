import AmortisationView from "@/components/amortisation/AmortisationView";

// Page gradient uses t.bg.pageFrom / t.bg.pageTo from @/lib/theme.
// Hardcoded here because Tailwind needs static class values.

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111215] to-[#1a1c20]">
      <AmortisationView />
    </div>
  );
}
