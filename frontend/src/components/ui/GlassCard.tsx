import { t } from "@/lib/theme";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function GlassCard({ children, className = "", style }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-md transition-all duration-200 hover:-translate-y-[1px] ${className}`}
      style={{
        background: t.bg.card,
        border: `1px solid ${t.border.default}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
