interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-[#0c0c16] ${className}`}>
      {children}
    </div>
  );
}
