export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="auth-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "clamp(48px, 10vh, 160px)",
        paddingBottom: "48px",
        paddingLeft: "24px",
        paddingRight: "24px",
        position: "relative",
      }}
    >
      <div
        className="home-bg-noise"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        aria-hidden="true"
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          maxHeight: 900,
          margin: "0 auto",
        }}
      >
        {children}
      </div>

      <div
        className="auth-bottom-anchor"
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          fontSize: 11,
          fontWeight: 400,
          color: "var(--color-fg-muted)",
          letterSpacing: "0.02em",
          pointerEvents: "none",
          zIndex: 2,
        }}
        aria-hidden="true"
      >
        MortgageModeler — Brisbane, Australia
      </div>
    </div>
  );
}
