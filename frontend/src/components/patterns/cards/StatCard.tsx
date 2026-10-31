import type { ComponentProps } from "react";
import Stat from "../blocks/Stat";
import SectionCard from "./SectionCard";

/**
 * KPI card: one `Stat` in a compact `SectionCard`. Number styling comes from
 * Stat (blocks), the box from SectionCard; this file only decides how the two
 * sit together.
 *
 * Edit this file to restyle every KPI card at once.
 */
export default function StatCard({
  className,
  ...stat
}: Omit<ComponentProps<typeof Stat>, "className"> & { className?: string }) {
  return (
    <SectionCard size="sm" data-card="stat" className={className}>
      <Stat {...stat} className="gap-1.5" />
    </SectionCard>
  );
}
