import { t } from "@/lib/theme";

interface SkeletonProps {
  width: string;
  height: string;
  className?: string;
}

export default function Skeleton({ width, height, className = "" }: SkeletonProps) {
  return (
    <span
      className={`inline-block animate-pulse rounded-md ${className}`}
      style={{ width, height, background: t.border.default }}
    />
  );
}
