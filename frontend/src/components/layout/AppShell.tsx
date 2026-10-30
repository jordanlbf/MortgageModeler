import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-app">
      <Sidebar />
      <main className="flex-1 min-w-0 relative bg-surface-app">
        <div className="mx-auto max-w-(--layout-content-max) px-(--layout-page-padding-x) py-(--layout-page-padding-y)">
          {children}
        </div>
      </main>
    </div>
  );
}
