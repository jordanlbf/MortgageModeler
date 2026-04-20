import Sidebar from "./Sidebar";
import GlobalsTray from "./GlobalsTray";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-surface-app)" }}>
      <Sidebar />
      <main
        className="flex-1 min-w-0 relative"
        style={{ background: "var(--color-surface-app)" }}
      >
        <GlobalsTray />
        <div
          className="mx-auto"
          style={{
            maxWidth: "var(--layout-content-max)",
            paddingLeft: "var(--layout-page-padding-x)",
            paddingRight: "var(--layout-page-padding-x)",
            paddingTop: "var(--layout-page-padding-y)",
            paddingBottom: "var(--layout-page-padding-y)",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
