interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export default function GlassCard({ children, className = "", glow = false }: GlassCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm ${className}`}>
      {glow && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-30 w-30 rounded-full bg-indigo-500/[0.12] blur-2xl" />
      )}
      {children}
    </div>
  );
}
