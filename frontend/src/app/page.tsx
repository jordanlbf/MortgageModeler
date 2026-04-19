import PageHeader from "@/components/layout/PageHeader";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your modelling workspace" />
      <div
        className="rounded-2xl border flex items-center justify-center text-[12px] uppercase tracking-[0.04em]"
        style={{
          height: "240px",
          background: "rgba(42,42,46,0.35)",
          borderColor: "var(--color-border)",
          color: "var(--color-faint)",
        }}
      >
        Dashboard content
      </div>
    </>
  );
}
