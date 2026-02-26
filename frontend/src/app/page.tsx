import AmortisationView from "@/components/amortisation/AmortisationView";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed -left-[10%] -top-[20%] h-[50%] w-[40%] rounded-full bg-indigo-500/[0.06] blur-3xl" />
      <div className="pointer-events-none fixed -bottom-[20%] -right-[10%] h-[50%] w-[40%] rounded-full bg-purple-500/[0.04] blur-3xl" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.04] px-8 py-[18px]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-400 to-indigo-600 text-[10px] font-bold text-white">
            M
          </div>
          <span className="text-sm font-semibold tracking-tight">MortgageModeler</span>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10">
        <AmortisationView />
      </main>
    </div>
  );
}
