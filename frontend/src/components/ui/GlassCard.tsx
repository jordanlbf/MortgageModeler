interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export default function GlassCard({ children, className = "", glow = false }: GlassCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[14px] border border-white/[0.05] bg-white/[0.02] backdrop-blur-sm ${className}`}
    >
      {glow && (
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-indigo-500/[0.1] blur-3xl" />
      )}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
