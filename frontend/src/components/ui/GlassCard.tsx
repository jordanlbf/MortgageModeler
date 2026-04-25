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
      className={`glass-card rounded-2xl backdrop-blur-md ${className}`}
      style={{
        background: t.surface.raised,
        ...style,
      }}
    >
      {children}
    </div>
  ),
);

GlassCard.displayName = "GlassCard";
export default GlassCard;
