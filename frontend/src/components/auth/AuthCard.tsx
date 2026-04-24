"use client";

interface Props {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  /** When true, renders a plain div instead of a form (for the sent state). */
  asDiv?: boolean;
}

const CARD_STYLE: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border-default)",
  borderRadius: 12,
  padding: 28,
  maxWidth: 400,
  width: "100%",
  boxShadow:
    "0 8px 24px rgba(0, 0, 0, 0.44), 0 0 0 0.5px rgba(113, 113, 122, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
};

export default function AuthCard({ children, onSubmit, asDiv = false }: Props) {
  const commonProps = {
    className: "animate-fade-up",
    style: { ...CARD_STYLE, animationDelay: "150ms" },
  };

  if (asDiv) {
    return <div {...commonProps}>{children}</div>;
  }

  return (
    <form {...commonProps} onSubmit={onSubmit}>
      {children}
    </form>
  );
}