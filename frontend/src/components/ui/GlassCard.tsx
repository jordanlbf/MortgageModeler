import { t } from "@/lib/theme";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function GlassCard({ children, className = "", style }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-[1px] ${className}`}
      style={{
        background: t.bg.card,
        border: `1px solid ${t.border.default}`,
        boxShadow: `0 1px 4px rgba(0,0,0,0.20), 0 0 0 0.5px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.02)`,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px -2px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(113,113,122,0.06), inset 0 1px 0 rgba(255,255,255,0.03)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 1px 4px rgba(0,0,0,0.20), 0 0 0 0.5px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.02)`;
      }}
    >
      {children}
    </div>
  );
}
