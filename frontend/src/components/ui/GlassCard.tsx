interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`rounded-xl border border-white/[0.06] bg-[#0c0c16] transition-all duration-200 hover:border-white/[0.09] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-[1px] ${className}`}
    >
      {children}
    </div>
  );
}
