import { Button } from "@/components/ui/button";

interface Props {
  type?: "button" | "submit";
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

/** Auth CTA: Button variant "cta-glow" with the trailing arrow that slides on hover. */
export default function PrimaryButton({
  type = "submit",
  onClick,
  children,
  disabled = false,
}: Props) {
  return (
    <Button variant="cta-glow" type={type} onClick={onClick} disabled={disabled}>
      {children}
      <span data-cta-arrow aria-hidden="true">
        →
      </span>
    </Button>
  );
}
