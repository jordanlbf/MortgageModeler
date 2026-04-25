import MortgageModelerLogo from "./MortgageModelerLogo";

interface Props {
  heading?: React.ReactNode;
  sub?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  logoSize?: number;
  compact?: boolean;
}

export default function AuthShell({
  heading,
  sub,
  children,
  footer,
  logoSize = 40,
  compact = false,
}: Props) {
  const headingSize = compact ? "clamp(22px, 3.2vw, 28px)" : "clamp(26px, 4vw, 34px)";
  const headingMaxWidth = compact ? 440 : 500;
  const subMaxWidth = compact ? 360 : 440;
  const subMarginBottom = compact ? 36 : 40;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div
        className="animate-fade-up"
        style={{ marginBottom: 32, animationDelay: "0ms" }}
      >
        <MortgageModelerLogo size={logoSize} />
      </div>

      {heading && (
        <h1
          className="animate-fade-up"
          style={{
            fontSize: headingSize,
            fontWeight: 500,
            color: "var(--color-fg-primary)",
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            textAlign: "center",
            maxWidth: headingMaxWidth,
            marginBottom: 14,
            animationDelay: "50ms",
          }}
        >
          {heading}
        </h1>
      )}

      {sub && (
        <p
          className="animate-fade-up"
          style={{
            fontSize: 15,
            fontWeight: 400,
            color: "var(--color-fg-secondary)",
            textAlign: "center",
            maxWidth: subMaxWidth,
            marginBottom: subMarginBottom,
            lineHeight: 1.5,
            animationDelay: "100ms",
          }}
        >
          {sub}
        </p>
      )}

      {!heading && !sub && <div style={{ marginBottom: 0 }} />}

      {children}

      {footer && (
        <div
          className="animate-fade-up"
          style={{
            marginTop: 24,
            fontSize: 13,
            color: "var(--color-fg-secondary)",
            animationDelay: "200ms",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}