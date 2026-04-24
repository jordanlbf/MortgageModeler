"use client";

interface Props {
  type?: "button" | "submit";
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function PrimaryButton({
  type = "submit",
  onClick,
  children,
  disabled = false,
}: Props) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="auth-cta">
      {children}
      <span className="auth-cta-arrow">→</span>
    </button>
  );
}