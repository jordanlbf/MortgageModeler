import AmortisationView from "@/components/amortisation/AmortisationView";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed -left-[8%] -top-[15%] h-[45%] w-[35%] rounded-full bg-indigo-500/[0.05] blur-3xl" />
      <div className="pointer-events-none fixed -bottom-[15%] -right-[8%] h-[45%] w-[35%] rounded-full bg-purple-500/[0.035] blur-3xl" />

      {/* Noise texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <AmortisationView />
    </div>
  );
}
