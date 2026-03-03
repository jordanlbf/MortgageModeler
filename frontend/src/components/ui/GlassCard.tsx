import { forwardRef } from "react";
import { t } from "@/lib/theme";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = "", style }, ref) => (
    <div
      ref={ref}
      className={`glass-card rounded-2xl backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-[1px] ${className}`}
      style={{
        background: t.bg.card,
        border: `1px solid ${t.border.default}`,
        ...style,
      }}
    >
      {children}
    </div>
  ),
);

GlassCard.displayName = "GlassCard";
export default GlassCard;
