interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-400/[0.12] bg-slate-800/70 backdrop-blur-md transition-all duration-200 hover:bg-slate-800/80 hover:-translate-y-[1px] ${className}`}
    >
      {children}
    </div>
  );
}
