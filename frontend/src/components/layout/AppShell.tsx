import Sidebar from "./Sidebar";
import GlobalsTray from "./GlobalsTray";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-background)" }}>
      <Sidebar />
      <main
        className="flex-1 min-w-0 flex flex-col"
        style={{ background: "var(--color-background)" }}
      >
        <div
          className="flex justify-end items-center shrink-0"
          style={{
            paddingLeft: "var(--layout-page-padding-x)",
            paddingRight: "var(--layout-page-padding-x)",
            paddingTop: "20px",
            paddingBottom: "12px",
          }}
        >
          <GlobalsTray />
        </div>
        <div
          className="mx-auto w-full"
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
